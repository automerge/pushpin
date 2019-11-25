import React, { useCallback } from 'react'
import { Doc } from 'automerge'
import { PushpinUrl, parseDocumentLink, HypermergeUrl } from '../../../ShareLink'
import { useDocument, ChangeFn } from '../../../Hooks'
import Content from '../../Content'
import ActionListItem from '../workspace/omnibox/ActionListItem'
import { DeviceDoc } from '../workspace/Device'
import { StoragePeerDoc } from '../storage-peer'
import './ContactEditor.css'

export interface Props {
  selfUrl: HypermergeUrl
  deviceId: PushpinUrl
  isCurrentDevice: boolean
  onRemoveDevice: (url: PushpinUrl) => void
}

export type OnRemoveDevice = (url: PushpinUrl) => void

export default function ContactEditorDevice(props: Props) {
  const { selfUrl, deviceId, onRemoveDevice, isCurrentDevice } = props
  const { hypermergeUrl: deviceHypermergeUrl } = parseDocumentLink(deviceId)
  const [deviceDoc, changeDevice] = useDocument<DeviceDoc>(deviceHypermergeUrl)

  const removeDevice = useCallback(() => {
    // XXX: We want to unregister from the storage peer when we remove it as a device.
    // We need a better way to do this, but for now just hack it here.
    if (isStoragePeer(deviceDoc)) {
      unregisterFromStoragePeer(changeDevice as ChangeFn<StoragePeerDoc>, selfUrl)
    }
    onRemoveDevice(deviceId)
  }, [deviceDoc, changeDevice, selfUrl, deviceId, onRemoveDevice])

  if (!deviceDoc) {
    return null
  }

  // XXX: Would be better to not recreate this every render.
  const deviceActions = [
    {
      name: 'remove',
      destructive: true,
      callback: () => () => removeDevice(),
      faIcon: 'fa-trash',
      label: 'Remove',
      shortcut: '⌘+⌫',
      keysForActionPressed: (e: KeyboardEvent) => (e.metaKey || e.ctrlKey) && e.key === 'Backspace',
    },
  ]

  return (
    <ActionListItem
      contentUrl={deviceId}
      actions={isCurrentDevice ? [] : deviceActions}
      selected={false}
    >
      <Content context="list" url={deviceId} editable />
    </ActionListItem>
  )
}

function isStoragePeer(doc: unknown): doc is Doc<StoragePeerDoc> {
  return !!(doc as any).registry
}

function unregisterFromStoragePeer(
  changeStoragePeer: ChangeFn<StoragePeerDoc>,
  contactUrl: HypermergeUrl
) {
  changeStoragePeer((doc) => {
    delete doc.registry[contactUrl]
  })
}
