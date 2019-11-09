import React from 'react'

import { ContentProps } from '../../Content'
import { BoardDoc } from '.'
import { useDocument } from '../../../Hooks'
import './BoardInBoard.css'
import TitleWithSubtitle from '../../TitleWithSubtitle'
import Badge from '../../Badge'
import SecondaryText from '../../SecondaryText'
import Heading from '../../Heading'
import CenteredVerticalStack from '../../CenteredVerticalStack'

BoardInBoard.minWidth = 4
BoardInBoard.minHeight = 6
BoardInBoard.defaultWidth = 6
BoardInBoard.defaultHeight = 6
BoardInBoard.maxWidth = 9
BoardInBoard.maxHeight = 9

export default function BoardInBoard(props: ContentProps) {
  const { hypermergeUrl, url } = props
  const [doc] = useDocument<BoardDoc>(hypermergeUrl)

  if (!doc) {
    return null
  }

  const { title, backgroundColor, cards } = doc

  const childCardCount = Object.keys(cards || {}).length
  const subTitle = `${childCardCount} card${childCardCount === 1 ? '' : 's'}`

  return (
    <div className="BoardInBoard">
      <CenteredVerticalStack>
        <Badge size="huge" icon="files-o" backgroundColor={backgroundColor} />
        <Heading wrap>{title}</Heading>
        <SecondaryText>{subTitle}</SecondaryText>
      </CenteredVerticalStack>
    </div>
  )
}
