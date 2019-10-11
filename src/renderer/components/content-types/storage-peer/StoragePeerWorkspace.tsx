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
  const { hypermergeUrl } = props
  const [doc, changeDoc] = useDocument<StoragePeerDoc>(hypermergeUrl)
  const selfId = useSelfId()
  const workspaceUrlsContext = useContext(WorkspaceUrlsContext)
  const [selfDoc, changeSelfDoc] = useDocument<ContactDoc>(selfId)

  if (!workspaceUrlsContext) {
    return null
  }
  const currentWorkspace = workspaceUrlsContext.workspaceUrls[0]
  const { hypermergeUrl: workspaceUrl } = parseDocumentLink(currentWorkspace)

  const registerWithStoragePeer = useCallback(() => {
    changeDoc((doc) => {
      doc.storedUrls[selfId] = workspaceUrl
    })

    changeSelfDoc((selfDoc) => {
      if (!selfDoc.devices) {
        selfDoc.devices = []
      }
      if (doc && !selfDoc.devices.includes(hypermergeUrl)) {
        selfDoc.devices.push(hypermergeUrl)
      }
    })
  }, [selfDoc])

  if (!doc) {
    return null
  }

  const { storedUrls } = doc

  const archiveEntries = Object.entries(storedUrls)

  const renderedUrls =
    archiveEntries.length > 0 ? (
      archiveEntries.map(([contact, workspace]) => (
        <ActionListItem
          key={contact}
          contentUrl={createDocumentLink('workspace', workspace)}
          actions={[]}
          selected={false}
        >
          <div className="StoragePeerEditor-row">
            <Content context="list" url={createDocumentLink('contact', contact as HypermergeUrl)} />
            <Content context="list" url={createDocumentLink('workspace', workspace)} />
          </div>
        </ActionListItem>
      ))
    ) : (
      <SecondaryText>No workspaces currently stored...</SecondaryText>
    )

  return (
    <div className="StoragePeerEditor">
      <div className="StoragePeerEditor-heading">
        <Heading>Storage Peer Control</Heading>
      </div>
      <div className="StoragePeerEditor-section">
        <div className="StoragePeerEditor-sectionLabel">Storage Peer</div>
        <div className="StoragePeerEditor-sectionContent">
          <Content context="list" url={createDocumentLink('device', hypermergeUrl)} editable />
        </div>
      </div>
      <div className="StoragePeerEditor-section">
        <div className="StoragePeerEditor-sectionLabel">Stored Workspaces</div>
        <div className="StoragePeerEditor-sectionContent">{renderedUrls}</div>
      </div>
      <button type="button" onClick={registerWithStoragePeer}>
        Register with Storage Peer
      </button>
    </div>
  )
}
