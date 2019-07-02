import React from 'react'

import { ContentProps } from '../content'
import { BoardDoc } from '.'
import { createDocumentLink } from '../../ShareLink'
import { useDocument } from '../../Hooks';

BoardInBoard.minWidth = 4
BoardInBoard.minHeight = 6
BoardInBoard.defaultWidth = 6
BoardInBoard.defaultHeight = 6
BoardInBoard.maxWidth = 9
BoardInBoard.maxHeight = 9

export default function BoardInBoard(props: ContentProps) {
  const [doc] = useDocument<BoardDoc>(props.hypermergeUrl)

  if (!doc) return null

  const { title, backgroundColor, cards } = doc

  const childCardCount = Object.keys(cards || {}).length

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation()
    window.location.href = createDocumentLink('board', props.hypermergeUrl)
  }

  return (
    <div
      className="BoardLink"
      onDoubleClick={handleDoubleClick}
      style={css.wrapper}
    >
      <i className="fa fa-files-o" style={{ ...css.icon, background: backgroundColor }} />
      <div style={css.caption}>
        <span style={css.title}>{title}</span>
        <br />
        {`${childCardCount} card${childCardCount === 1 ? '' : 's'}`}
      </div>
    </div>
  )
}

const css = {
  icon: {
    display: 'flex' as 'flex',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    fontSize: '32px',
    borderRadius: '50%',
    width: 60,
    height: 60,
    flex: 'none' as 'none'
  },
  caption: {
    color: 'var(--colorSecondaryGrey)',
    marginTop: '2px',
    width: '100%',
    textOverflow: 'ellipsis' as 'ellipsis',
    fontSize: '12px',
    lineHeight: '20px',
    textAlign: 'center' as 'center',
    whiteSpace: 'nowrap' as 'nowrap',
    overflow: 'hidden' as 'hidden',
  },
  title: {
    color: 'var(--colorBlueBlack)',
    fontWeight: '600' as 'bold' // errrrrr
  },
  wrapper: {
    boxSizing: 'border-box' as 'border-box',
    border: '1px solid var(--colorPaleGrey)',
    overflow: 'hidden' as 'hidden',
    padding: '10px',
    backgroundColor: 'white',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center' as 'center',
    justifyContent: 'center' as 'center',
    width: '100%',
  },
}
