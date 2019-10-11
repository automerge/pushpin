import React from 'react'

import { ContentProps } from '../../Content'
import { BoardDoc } from '.'
import { createDocumentLink } from '../../../ShareLink'
import { useDocument } from '../../../Hooks'
import './BoardInBoard.css'

BoardInBoard.minWidth = 4
BoardInBoard.minHeight = 6
BoardInBoard.defaultWidth = 6
BoardInBoard.defaultHeight = 6
BoardInBoard.maxWidth = 9
BoardInBoard.maxHeight = 9

export default function BoardInBoard(props: ContentProps) {
  const [doc] = useDocument<BoardDoc>(props.hypermergeUrl)

  if (!doc) {
    return null
  }

  const { title, backgroundColor, cards } = doc

  const childCardCount = Object.keys(cards || {}).length

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation()
    window.location.href = createDocumentLink('board', props.hypermergeUrl)
  }

  return (
    <div className="BoardLink BoardInBoard-wrapper" onDoubleClick={handleDoubleClick}>
      <div className="BoardInBoard-icon" style={{ background: backgroundColor }}>
        <i className="fa fa-files-o" />
      </div>
      <div className="BoardInBoard-caption">
        <span className="BoardInBoard-title">{title}</span>
        <br />
        {`${childCardCount} card${childCardCount === 1 ? '' : 's'}`}
      </div>
    </div>
  )
}
