import React, { useRef } from 'react'
import TitleEditor from '../../TitleEditor'
import { BoardDoc } from '.'
import { ContentProps } from '../../Content'
import { useDocument } from '../../../Hooks'
import Badge from '../../Badge'

interface Props extends ContentProps {
  editable: boolean
}

export default function BoardInList(props: Props) {
  const [doc] = useDocument<BoardDoc>(props.hypermergeUrl)
  const badgeRef = useRef<HTMLElement>(null)

  if (!doc) {
    return null
  }

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', props.url)

    if (badgeRef.current) {
      e.dataTransfer.setDragImage(badgeRef.current, 0, 0)
    }
  }

  const { title, backgroundColor } = doc

  return (
    <div draggable onDragStart={onDragStart} className="DocLink">
      <Badge ref={badgeRef} icon="files-o" backgroundColor={backgroundColor} />
      {props.editable ? (
        <TitleEditor url={props.hypermergeUrl} />
      ) : (
        <div className="DocLink__title">{title}</div>
      )}
    </div>
  )
}
