import React from 'react'
import { createDocumentLink, HypermergeUrl } from '../../../ShareLink'
import Content, { ContentProps } from '../../Content'
import Heading from '../../Heading'

import './StoragePeerWorkspace.css'
import { useStoragePeer } from './StoragePeerHooks'
import ActionListItem from '../workspace/omnibox/ActionListItem'
import SecondaryText from '../../SecondaryText'

export default function StoragePeerEditor(props: ContentProps) {
  const { hypermergeUrl } = props
  const [doc, isRegistered, register, unregister] = useStoragePeer(hypermergeUrl)

  if (!doc) {
    return null
  }

  const registeredContacts = Object.keys(doc.registry)

  const renderedContacts =
    registeredContacts.length > 0 ? (
      registeredContacts.map((contact) => {
        const contactUrl = createDocumentLink('contact', contact as HypermergeUrl)
        return (
          <ActionListItem key={contact} contentUrl={contactUrl} actions={[]} selected={false}>
            <div className="StoragePeerEditor-row">
              <Content context="list" url={contactUrl} />
            </div>
          </ActionListItem>
        )
      })
    ) : (
      <SecondaryText>No one is currently registered with this storage peer...</SecondaryText>
    )

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
        <div className="StoragePeerEditor-section">
          <div className="StoragePeerEditor-sectionLabel">Disclaimer</div>
          <div className="StoragePeerEditor-sectionContent">
            If you register with a storage peer, whoever has access to the server where the storage
            peer is running will have full access to your data. Additionally, when you unregister
            from a storage peer your data is not deleted from the storage peer's server and will
            continue to be replicated until the storage peer is restarted.
          </div>
        </div>

        <div className="StoragePeerEditor-section">
          <div className="StoragePeerEditor-sectionLabel">Registered Contacts</div>
          <div className="StoragePeerEditor-sectionContent">{renderedContacts}</div>
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
