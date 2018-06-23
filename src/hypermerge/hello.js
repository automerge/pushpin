const Multicore = require('./Multicore')


const mc = new Multicore('./data/testing')
const mc2 = new Multicore('./data/testing2')

mc.ready(() => {
  mc.joinSwarm()

  const feed = mc.hypercore()
  feed.append('hello world')

  feed.ready(() => {
    const key = feed.key.toString('hex')

    console.log('feedkey:', key)

    mc2.ready(() => {
      mc2.joinSwarm()
      mc2.hypercore(key).get(0, (err, str) => {
        console.log('mc2 get:', str)
      })
    })
  })
})

