import React, { useCallback, useContext } from 'react'
import { createDocumentLink, HypermergeUrl, parseDocumentLink } from '../../../ShareLink'

import Content, { ContentProps } from '../../Content'
import { StoragePeerDoc } from '.'

import { useDocument, useSelfId } from '../../../Hooks'
import Heading from '../../Heading'
import SecondaryText from '../../SecondaryText'

import ActionListItem from '../workspace/omnibox/ActionListItem'

import './StoragePeerWorkspace.css'
import { WorkspaceUrlsContext } from '../../../WorkspaceHooks'
import { ContactDoc } from '../contact'

export default function StoragePeerEditor(props: ContentProps) {
  const [doc, changeDoc] = useDocument<StoragePeerDoc>(props.hypermergeUrl)
  const selfId = useSelfId()
  const workspaceUrlsContext = useContext(WorkspaceUrlsContext)
  const [selfDoc, changeSelfDoc] = useDocument<ContactDoc>(selfId)

  if (!workspaceUrlsContext) {
    return null
  }
  const currentWorkspace = workspaceUrlsContext.workspaceUrls[0]
  const { hypermergeUrl } = parseDocumentLink(currentWorkspace)

  const registerWithStoragePeer = useCallback(() => {
    changeDoc((doc) => {
      doc.archivedUrls[selfId] = hypermergeUrl
    })

    changeSelfDoc((selfDoc) => {
      if (!selfDoc.devices) {
        selfDoc.devices = []
      }
      if (doc && doc.device && !selfDoc.devices.includes(doc.device)) {
        selfDoc.devices.push(doc.device)
      }
    })
  }, [selfDoc])

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
          <div className="StoragePeer-row">
            <Content context="list" url={createDocumentLink('contact', contact as HypermergeUrl)} />
            <Content context="list" url={createDocumentLink('workspace', workspace)} />
          </div>
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
          <div className="StoragePeerEditor-sectionLabel">Storage Peer</div>
          <div className="StoragePeerEditor-sectionContent">
            <Content context="list" url={createDocumentLink('device', device)} editable />
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
