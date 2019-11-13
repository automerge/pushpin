import React from 'react'

import { ContentProps } from '../../Content'
import { BoardDoc } from '.'
import { useDocument } from '../../../Hooks'
import './BoardInBoard.css'
import Badge from '../../Badge'
import SecondaryText from '../../SecondaryText'
import Heading from '../../Heading'
import CenteredStack from '../../CenteredStack'

BoardInBoard.minWidth = 5
BoardInBoard.minHeight = 6
BoardInBoard.defaultWidth = 6
BoardInBoard.defaultHeight = 9
BoardInBoard.maxWidth = 9
BoardInBoard.maxHeight = 10

export default function BoardInBoard(props: ContentProps) {
  const { hypermergeUrl } = props
  const [doc] = useDocument<BoardDoc>(hypermergeUrl)

  if (!doc) {
    return null
  }

  const { title, backgroundColor, cards } = doc

  const childCardCount = Object.keys(cards || {}).length
  const subTitle = `${childCardCount} card${childCardCount === 1 ? '' : 's'}`

  return (
    <div className="BoardInBoard BoardCard--standard">
      <CenteredStack>
        <Badge size="huge" icon="files-o" backgroundColor={backgroundColor} />
        <Heading wrap>{title}</Heading>
        <SecondaryText>{subTitle}</SecondaryText>
      </CenteredStack>
    </div>
  )
}
