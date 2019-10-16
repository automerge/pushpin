import React, { useEffect, useState } from 'react'
import { Feed, FeedId } from 'hypermerge/dist/FeedStore'
import * as Block from 'hypermerge/dist/Block'
import { useImmer } from 'use-immer'
import { toDiscoveryId } from 'hypermerge/dist/Misc'
import classnames from 'classnames'

import { useRepo } from '../BackgroundHooks'
import Info, { humanBytes } from './Info'
import Card from './Card'
import Expandable from './Expandable'
import './FeedView.css'

interface Props {
  feedId: FeedId
}

interface BlockInfo {
  index: number
  data: Uint8Array
}

const BLOCK_LIMIT = 1000

export default function FeedView({ feedId }: Props) {
  const { feeds } = useRepo()
  const feed = useFeed(feedId)
  const info = useFeedInfo(feedId)
  const [selectedBlock, setBlock] = useState<BlockInfo | null>(null)

  function renderBlock(hasBlock: boolean, index: number) {
    const isSelected = selectedBlock && index === selectedBlock.index
    return (
      <div
        key={String(index)}
        title={`Block ${index}`}
        className={classnames('FeedView_Block', {
          FeedView_Block__selected: isSelected,
          FeedView_Block__downloaded: hasBlock,
        })}
        onClick={() => feeds.read(feedId, index).then((data) => setBlock({ index, data }))}
      />
    )
  }

  function renderBlocks(blocks: boolean[]) {
    return <div className="FeedView_Blocks">{blocks.map(renderBlock)}</div>
  }

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

      {renderBlocks(info.blocks.slice(0, BLOCK_LIMIT))}

      {info.blocks.length > BLOCK_LIMIT ? (
        <Expandable summary={`${info.blocks.length - BLOCK_LIMIT} more...`}>
          {() => renderBlocks(info.blocks.slice(100))}
        </Expandable>
      ) : null}

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
            data={parseBlockData(selectedBlock.data)}
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

function parseBlockData(data: Uint8Array): Uint8Array | object {
  try {
    return Block.unpack(data)
  } catch (e) {
    return data
  }
}
