import React from 'react'
import Content, { ContentProps } from '../../Content'
import { useDocument } from '../../../Hooks'
import Badge from '../../Badge'
import { Doc } from './Workspace'
import { createDocumentLink } from '../../../ShareLink'
import { ContactDoc } from '../contact'
import Text from '../../Text'
import SecondaryText from '../../SecondaryText'
import './WorkspaceInList.css'

export default function WorkspaceListItem(props: ContentProps) {
  const [doc] = useDocument<Doc>(props.hypermergeUrl)
  const [selfDoc] = useDocument<ContactDoc>(doc && doc.selfId)

  if (!doc || !selfDoc) {
    return null
  }

  const { selfId, viewedDocUrls } = doc

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', props.url)
  }

  return (
    <div className="DocLink">
      <div className="WorkspaceLink-Badge" draggable onDragStart={onDragStart}>
        <Badge icon="briefcase" backgroundColor={selfDoc.color} />
        <div className="WorkspaceLink-ContactOverlay">
          <Content url={createDocumentLink('contact', selfId)} context="title-bar" />
        </div>
      </div>
      <div className="DocLink__title">
        <div className="WorkspaceLink-words">
          <Text>Workspace for {selfDoc.name}</Text>
          <SecondaryText>
            {viewedDocUrls.length} item{viewedDocUrls.length !== 1 ? 's' : ''}
          </SecondaryText>
        </div>
      </div>
    </div>
  )
}
