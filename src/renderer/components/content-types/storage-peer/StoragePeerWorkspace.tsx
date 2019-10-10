import React, { useCallback } from 'react'
import { createDocumentLink, HypermergeUrl } from '../../../ShareLink'

import Content, { ContentProps } from '../../Content'
import { StoragePeerDoc } from '.'

import { useDocument, useSelfId } from '../../../Hooks'
import Heading from '../../Heading'
import SecondaryText from '../../SecondaryText'

import ActionListItem from '../workspace/omnibox/ActionListItem'

import './StoragePeerWorkspace.css'
import TitleEditor from '../../TitleEditor'
import { useWorkspaceUrls } from '../../../WorkspaceHooks'

export default function StoragePeerEditor(props: ContentProps) {
  const [doc, changeDoc] = useDocument<StoragePeerDoc>(props.hypermergeUrl)
  const selfId = useSelfId()
  const workspaceIds = useWorkspaceUrls()
  const currentWorkspace = workspaceIds[0]

  const registerWithStoragePeer = useCallback(() => {
    console.log('registering with storage peer')
    changeDoc((doc) => {
      doc.archivedUrls[selfId] = currentWorkspace
    })
  }, [])

  if (!doc) {
    return null
  }

  const { device, archivedUrls } = doc

  const archiveEntries = Object.entries(archivedUrls)

  const renderedUrls =
    archiveEntries.length > 0 ? (
      archiveEntries.map(([contact, workspace]) => (
        <ActionListItem
          key={contact}
          contentUrl={createDocumentLink('workspace', workspace)}
          actions={[]}
          selected={false}
        >
          <Content context="list" url={createDocumentLink('contact', contact as HypermergeUrl)} />
          <Content context="list" url={createDocumentLink('workspace', workspace)} />
        </ActionListItem>
      ))
    ) : (
      <SecondaryText>No devices registered...</SecondaryText>
    )

  return (
    <div className="StoragePeerEditor-frame">
      <div className="StoragePeerEditor">
        <div className="StoragePeerEditor-heading">
          <Heading>Edit Profile...</Heading>
        </div>
        <div className="StoragePeerEditor-section">
          <div className="StoragePeerEditor-sectionLabel">Storage Peer Name</div>
          <div className="StoragePeerEditor-sectionContent">
            <TitleEditor field="name" url={props.hypermergeUrl} />
          </div>
        </div>
        <div className="StoragePeerEditor-section">
          <div className="StoragePeerEditor-sectionLabel">Storage Peer Device Doc</div>
          <div className="StoragePeerEditor-sectionContent">
            <Content context="list" url={createDocumentLink('device', device)} />
          </div>
        </div>
        <div className="StoragePeerEditor-section">
          <div className="StoragePeerEditor-sectionLabel">Archived Workspaces</div>
          <div className="StoragePeerEditor-sectionContent">{renderedUrls}</div>
        </div>
        <button type="button" onClick={registerWithStoragePeer}>
          Register with Storage Peer
        </button>
      </div>
    </div>
  )
}
