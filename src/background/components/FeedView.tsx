import React, { useEffect, useState } from 'react'
import { Feed, FeedId } from 'hypermerge/dist/FeedStore'
import { useImmer } from 'use-immer'
import { toDiscoveryId } from 'hypermerge/dist/Misc'

import { useRepo } from '../BackgroundHooks'
import Info, { humanBytes } from './Info'
import Card from './Card'

interface Props {
  feedId: FeedId
}

interface BlockInfo {
  index: number
  data: Uint8Array
}

export default function FeedView({ feedId }: Props) {
  const { feeds } = useRepo()
  const feed = useFeed(feedId)
  const info = useFeedInfo(feedId)
  const [selectedBlock, setBlock] = useState<BlockInfo | null>(null)

  return (
    <div>
      <Info
        log={feed}
        feedId={feedId}
        discoveryId={toDiscoveryId(feedId)}
        isWritable={info.writable}
        bytes={humanBytes(info.bytes)}
        blocks={`${info.downloaded} / ${info.total}`}
      />

      <div
        style={{
          marginTop: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 8px)',
          gridAutoRows: '8px',
          gridGap: 1,
        }}
      >
        {info.blocks.map((hasBlock, index) => {
          const isSelected = selectedBlock && index === selectedBlock.index
          return (
            <div
              key={String(index)}
              title={`Block ${index}`}
              style={{
                backgroundColor: isSelected ? 'skyblue' : hasBlock ? 'green' : 'red', // eslint-disable-line
                cursor: 'pointer',
              }}
              onClick={() => feeds.read(feedId, index).then((data) => setBlock({ index, data }))}
            />
          )
        })}
      </div>

      {selectedBlock ? (
        <Card
          style={{
            marginTop: 10,
          }}
        >
          <a href="#" onClick={() => setBlock(null)} style={{ position: 'sticky', top: 10 }}>
            Hide
          </a>
          <Info
            log={selectedBlock.data}
            block={selectedBlock.index}
            bytes={humanBytes(selectedBlock.data.length)}
            data={selectedBlock.data}
          />
        </Card>
      ) : null}
    </div>
  )
}

interface FeedInfo {
  writable: boolean
  downloaded: number
  total: number
  blocks: boolean[]
  bytes: number
}

function useFeedInfo(feedId: FeedId): FeedInfo {
  const feed = useFeed(feedId)
  const [info, update] = useImmer<FeedInfo>({
    writable: false,
    downloaded: 0,
    total: 0,
    bytes: 0,
    blocks: [],
  })

  useEffect(() => {
    if (!feed) return () => {}

    function setTotals(info: FeedInfo) {
      if (!feed) return
      info.total = feed.length
      info.bytes = feed.byteLength
      info.downloaded = feed.downloaded()
    }

    function onReady() {
      update((info) => {
        if (!feed) return
        info.writable = feed.writable
        info.blocks = Array(feed.length).fill(false)
        setTotals(info)

        for (let i = 0; i < feed.length; i += 1) {
          info.blocks[i] = feed.has(i)
        }
      })
    }

    function onDownload(index: number) {
      update((info) => {
        info.blocks[index] = true
        setTotals(info)
      })
    }

    function onAppend() {
      update((info) => {
        info.blocks.push(true)
        setTotals(info)
      })
    }

    feed
      .on('download', onDownload)
      .on('append', onAppend)
      .ready(onReady)

    return () => {
      feed
        .off('ready', onReady)
        .off('append', onAppend)
        .off('download', onDownload)
    }
  }, [feed])

  return info
}

function useFeed(feedId: FeedId): Feed | null {
  const [feed, setFeed] = useState<Feed | null>(null)
  const repo = useRepo()

  useEffect(() => {
    repo.feeds.getFeed(feedId).then((fd) => {
      setFeed(fd)
    })
  }, [feedId])

  return feed
}
