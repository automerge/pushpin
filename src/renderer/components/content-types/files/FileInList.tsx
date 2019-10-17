import React, { useRef } from 'react'
import TitleEditor from '../../TitleEditor'
import { FileDoc } from '.'
import { ContentProps } from '../../Content'
import { useDocument } from '../../../Hooks'
import Badge from '../../Badge'

import './FileInList.css'

interface Props extends ContentProps {
  editable: boolean
}

export default function FileInList(props: Props) {
  const [doc] = useDocument<FileDoc>(props.hypermergeUrl)
  const badgeRef = useRef<HTMLDivElement>(null)

  if (!doc) {
    return null
  }

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', props.url)

    if (badgeRef.current) {
      e.dataTransfer.setDragImage(badgeRef.current, 0, 0)
    }
  }

  const backgroundColor = 'orangered'
  const { title } = doc

  return (
    <div draggable onDragStart={onDragStart} className="FileListItem">
      <Badge ref={badgeRef} shape="square" icon="files-o" backgroundColor={backgroundColor} />
      {props.editable ? (
        <TitleEditor url={props.hypermergeUrl} />
      ) : (
        <div className="FileListItem__title">{title}</div>
      )}
    </div>
  )
}
