import { useCallback, useContext } from 'react'
import { RepoFrontend, DocUrl } from 'hypermerge'
import Automerge, { FreezeObject } from 'automerge'
import { StoragePeerDoc } from '.'
import { useRepo, useDocument, useSelfId } from '../../../Hooks'
import { WorkspaceUrlsContext } from '../../../WorkspaceHooks'
import { ContactDoc } from '../contact'
import { parseDocumentLink } from '../../../ShareLink'

export type RegistrationFn = () => void
export type UnregistrationFn = () => void

export function useStoragePeer(
  storagePeerUrl: DocUrl
): [FreezeObject<StoragePeerDoc> | null, boolean | null, RegistrationFn, UnregistrationFn] {
  const repo = useRepo()
  const [doc, changeDoc] = useDocument<StoragePeerDoc>(storagePeerUrl)

  // Self context doc rigamarole
  const selfId = useSelfId()
  const [selfDoc, changeSelfDoc] = useDocument<ContactDoc>(selfId)

  // Current workspace rigamarole
  const workspaceUrlsContext = useContext(WorkspaceUrlsContext)
  const currentWorkspace = workspaceUrlsContext && workspaceUrlsContext.workspaceUrls[0]
  const workspaceUrl = currentWorkspace && parseDocumentLink(currentWorkspace).hypermergeUrl

  const isRegistered = doc && !!doc.registry[selfId]

  const register = useCallback(async () => {
    if (!doc || !workspaceUrl || isRegistered) return
    if (!(await verifyPublicKey(repo, storagePeerUrl, doc))) return

    const sealedWorkspace = await repo.crypto.sealedBox(doc.encryptionKey, workspaceUrl)
    changeDoc((doc) => {
      doc.registry[selfId] = sealedWorkspace
    })

    changeSelfDoc((selfDoc) => {
      if (!selfDoc.devices) {
        selfDoc.devices = []
      }
      if (!selfDoc.devices.includes(storagePeerUrl)) {
        selfDoc.devices.push(storagePeerUrl)
      }
    })
  }, [selfDoc, doc, workspaceUrl, isRegistered])

  const unregister = useCallback(() => {
    if (!doc || !workspaceUrl || !isRegistered) return
    changeDoc((doc) => {
      delete doc.registry[selfId]
    })

    changeSelfDoc((selfDoc) => {
      if (!selfDoc.devices) return
      without(storagePeerUrl, selfDoc.devices)
    })
  }, [selfDoc, doc, workspaceUrl, isRegistered])

  return [doc, isRegistered, register, unregister]
}

async function verifyPublicKey(
  repo: RepoFrontend,
  docUrl: DocUrl,
  doc: FreezeObject<StoragePeerDoc>
): Promise<boolean> {
  if (!doc.encryptionKey || !doc.encryptionKeySignature) {
    return false
  }
  return repo.crypto.verify(docUrl, doc.encryptionKey, doc.encryptionKeySignature)
}

/**
 * Helper function for removing an item from an Automerge list.
 */
function without<T>(val: T, list: Automerge.List<T>) {
  const pos = list.findIndex((item) => item === val)
  if (!pos) return
  // The Automerge type for deleteAt is wrong.
  list.deleteAt!(pos)
}
