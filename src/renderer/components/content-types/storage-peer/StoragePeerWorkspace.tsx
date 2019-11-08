import React from 'react'
import { createDocumentLink } from '../../../ShareLink'
import Content, { ContentProps } from '../../Content'
import Heading from '../../Heading'

import './StoragePeerWorkspace.css'
import { useStoragePeer } from './StoragePeerHooks'

export default function StoragePeerEditor(props: ContentProps) {
  const { hypermergeUrl } = props
  const [doc, isRegistered, register, unregister] = useStoragePeer(hypermergeUrl)

  if (!doc) {
    return null
  }

  return (
    <div className="StoragePeerEditor">
      <div className="StoragePeerEditor-content">
        <div className="StoragePeerEditor-heading">
          <Heading>Storage Peer Control</Heading>
        </div>
        <div className="StoragePeerEditor-section">
          <div className="StoragePeerEditor-sectionLabel">Storage Peer</div>
          <div className="StoragePeerEditor-sectionContent">
            <Content context="list" url={createDocumentLink('device', hypermergeUrl)} editable />
          </div>
        </div>
        {isRegistered ? (
          <button type="button" onClick={unregister}>
            Unregister with Storage Peer
          </button>
        ) : (
          <button type="button" onClick={register}>
            Register with Storage Peer
          </button>
        )}
      </div>
    </div>
  )
}
