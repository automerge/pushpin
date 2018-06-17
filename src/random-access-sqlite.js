const Sqlite3 = require('sqlite3')
const Hypercore = require('hypercore')
const assert = require('assert')

const BLOCK_SIZE = 512

export class RandomAccessSqlite {
  constructor(db, path) {
    assert(db)
    assert(path)
    this.db = db
    this.path = path
    this.fileId = null
    this.fileSize = null
    this.writeQueue = []
    this.writing = false
    // this.log('constructor')
  }

  log(...args) {
    console.log('random-access-sqlite', this.path, ...args)
  }

  blockRange(offset, size) {
    const blockFirst = Math.floor(offset / BLOCK_SIZE)
    const blockLast = Math.ceil((offset + size) / BLOCK_SIZE) - 1
    const blockCount = blockLast - blockFirst + 1
    assert(blockCount > 0)
    return [blockFirst, blockLast, blockCount]
  }

  withFileMeta(cb) {
    // this.log('withFileMeta')

    // After the first operation we'll have this in memory.
    if (this.fileId) {
      return cb(null, this.fileId, this.fileSize)
    }

    // Otherwise we need to go to the DB.
    this.db.get('SELECT id, size FROM files WHERE path = ?', [this.path], (err, row) => {
      // DB error.
      if (err) {
        return cb(err, null, null)
      }

      // Path already written in DB.
      if (row) {
        assert(row.id)
        assert(row.size >= 0)
        this.fileId = row.id
        this.fileSize = row.size
        return cb(null, row.id, row.size)
      }

      // New path, write into DB. Must be careful with `function`/`this` here because we
      // get the row ID from a `this`-based sqlite API...
      const instance = this
      const initialSize = 0
      this.db.run('INSERT INTO files (path, size) VALUES (?, ?)', [instance.path, initialSize], function(err) {
        // DB error. Unset cache.
        if (err) {
          this.fileId = null
          this.fileSize = null
          return cb(err, null, null)
        }

        // Succesfully created file record.
        assert(this.lastID)
        this.fileId = this.lastID
        this.fileSize = initialSize
        cb(null, this.fileId, this.fileSize)
      })
    })
  }

  read(offset, size, cb) {
    // this.log('read', `offset=${offset}`, `size=${size}`)

    this.withFileMeta((err, fileId, fileSize) => {
      // Error getting file metadata.
      if (err) {
        return cb(err, null)
      }

      // Read outside of file size.
      if ((offset + size) > fileSize) {
        return cb(new Error('Out of range'), null)
      }

      // Shuold have all blocks to copy data from.
      const [blockFirst, blockLast, blockCount] = this.blockRange(offset, size)
      const readSql = 'SELECT data, seq FROM blocks WHERE file_id = ? AND seq >= ? AND seq <= ? ORDER BY seq ASC'
      const readParams = [fileId, blockFirst, blockLast]
      this.db.all(readSql, readParams, (err, rows) => {
        // DB error.
        if (err) {
          return cb(err, null)
        }

        // Copy into read buffer.
        assert(rows.length === blockCount)
        const readData = Buffer.alloc(size)
        let readDataOffset = 0
        let blockOffset = offset - (blockFirst * BLOCK_SIZE)
        let remaining = size
        for (let b = 0; b < blockCount; b++) {
          const toRead = Math.min(remaining, BLOCK_SIZE - blockOffset)
          const blockData = rows[b].data
          blockData.copy(readData, readDataOffset, blockOffset, blockOffset + toRead)
          readDataOffset = readDataOffset + toRead
          blockOffset = blockOffset + toRead - BLOCK_SIZE
          remaining = remaining - toRead
        }
        assert(remaining === 0)
        cb(null, readData)
      })
    })
  }

  execWrite(offset, data, cb) {
    // this.log('execWrite', `offset=${offset}`, `size=${data.length}`)

    this.withFileMeta((err, fileId, fileSize) => {
      // Error getting file metadata.
      if (err) {
        return cb(err, null)
      }

      // If there's a gap between the end of the current file and the requested,
      // offset, write empty data to close it.
      if (offset > fileSize) {
        const fill = offset - fileSize
        // this.log('execWrite.fill', fileSize, fill)
        offset = fileSize
        data = Buffer.concat([Buffer.alloc(fill), data])
      }

      const [blockFirst, blockLast, blockCount] = this.blockRange(offset, data.length)
      const readSql = 'SELECT data, seq FROM blocks WHERE file_id = ? AND seq >= ? AND seq <= ? ORDER BY seq ASC'
      const readParams = [fileId, blockFirst, blockLast]
      this.db.all(readSql, readParams, (err, rows) => {
        // DB error.
        if (err) {
          return cb(err, null)
        }

        // Read some blocks; create missing ones, overlay onto existing ones, write back.
        const dataBySeq = {}
        for (let r = 0; r < rows.length; r++) {
          dataBySeq[rows[r].seq] = rows[r].data
        }
        let reqOffset = 0
        let blockOffset = offset - (blockFirst * BLOCK_SIZE)
        let remaining = data.length
        const writeParams = []
        for (let s = blockFirst; s <= blockLast; s++) {
          const toWrite = Math.min(remaining, BLOCK_SIZE - blockOffset)
          const blockData = dataBySeq[s] || Buffer.alloc(BLOCK_SIZE)
          data.copy(blockData, blockOffset, reqOffset, reqOffset + toWrite)
          writeParams.push(fileId, s, blockData)
          reqOffset = reqOffset + toWrite
          blockOffset = blockOffset + toWrite - BLOCK_SIZE
          remaining = remaining - toWrite
        }
        assert(remaining === 0)
        assert(writeParams.length === (blockCount * 3))
        // this.log('execWrite.params', blockFirst, blockLast, blockCount, writeParams)
        const writeSql = `REPLACE INTO blocks (file_id, seq, data) VALUES ${Array(blockCount).fill('(?,?,?)').join(',')}`
        this.db.run(writeSql, writeParams, (err) => {
          // DB error.
          if (err) {
            return cb(err)
          }

          const newSize = offset + data.length
          // No need to write new size.
          if (fileSize >= newSize) {
            return cb(null)
          }

          // Need to write new size.
          this.db.run('UPDATE files set size = ? WHERE id = ?', [newSize, fileId], (err) => {
            // DB error.
            if (err) {
              return cb(err)
            }

            // Cache new size and callback.
            this.fileSize = newSize
            cb(null)
          })
        })
      })
    })
  }

  write(offset, data, cb) {
    // this.log('write', `offset=${offset}`, `size=${data.length}`)
    this.writeQueue.push([offset, data, cb])
    this.writeLoop()
  }

  writeLoop() {
    // this.log('writeLoop')
    if (this.writing) {
      return
    }
    this.writing = true
    assert(this.writeQueue.length > 0)
    const [offset, data, opCb] = this.writeQueue.shift()
    this.execWrite(offset, data, (err) => {
      opCb(err)
      this.writing = false
      if (this.writeQueue.length > 0) {
        this.writeLoop()
      }
    })
  }
}

export function ensureTables(db, cb) {
  db.run(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    size INTEGER NOT NULL
  )`, [], (err) => {
    if (err) { cb(err) }
    db.run(`
    CREATE TABLE IF NOT EXISTS blocks (
      file_id INTEGER NOT NULL,
      seq INTEGER NOT NULL,
      data BLOB NOT NULL,
      PRIMARY KEY (file_id, seq)
    )`, [], (err) => {
      cb(err)
    })
  })
}
