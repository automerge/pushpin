import { parseDocumentLink, HypermergeUrl } from './ShareLink'
import { Handle } from 'hypermerge';
import { ContactDoc } from './components/contact';
import { Doc } from './components/workspace/Workspace';

//
// Example:
//   this.invitationsView = new InvitationsView(this.props.hypermergeUrl)
//   this.invitationsView.onChange((invitations) => {
//     debugger
//   })
//
export default class InvitationsView {
  selfId?: HypermergeUrl
  workspaceHandle: Handle<Doc>
  contactHandles: { [contactId: string]: Handle<ContactDoc> }
  docHandles: { [docId: string]: Handle<any> }
  invitations: any[]
  pendingInvitations: any[]
  onChangeCb?: Function

  constructor(workspaceId: HypermergeUrl, onChange: Function) {
    this.contactHandles = {}
    this.docHandles = {}
    this.invitations = []
    this.pendingInvitations = []

    this.onChangeCb = onChange

    this.workspaceHandle = window.repo.watch(workspaceId, (doc) => {
      this.selfId = doc.selfId
      doc.contactIds.forEach(id => this.watchContact(id))
    })
  }

  watchDoc = (hypermergeUrl: HypermergeUrl) => {
    if (this.docHandles[hypermergeUrl]) {
      return
    }

    const handle = window.repo.watch(hypermergeUrl, (doc) => {
      const index = this.pendingInvitations.findIndex(i => i.hypermergeUrl === hypermergeUrl)
      if (index !== -1) {
        const invite = this.pendingInvitations[index]
        this.pendingInvitations.splice(index, 1)

        invite.doc = doc
        this.invitations.push(invite)

        if (this.onChangeCb) {
          this.onChangeCb(this.invitations)
        }
      }
    })
    this.docHandles[hypermergeUrl] = handle
  }

  watchContact = (contactId) => {
    if (this.contactHandles[contactId]) {
      return
    }

    this.contactHandles[contactId] = window.repo.watch(contactId, (contact) => {
      if (!contact.offeredUrls) {
        return
      }

      const offererId = contactId
      const offersForUs = (this.selfId && contact.offeredUrls[this.selfId]) || []

      offersForUs.forEach((documentUrl) => {
        const { hypermergeUrl } = parseDocumentLink(documentUrl)
        const matchOffer = (offer) => (
          offer.documentUrl === documentUrl && offer.offererId === offererId
        )

        if (!this.pendingInvitations.some(matchOffer)) {
          this.pendingInvitations.push({ documentUrl, offererId, sender: contact, hypermergeUrl })
          this.watchDoc(hypermergeUrl)
        }
      })
    })
  }
}
