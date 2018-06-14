import { parseDocumentLink } from './share-link'

//
// Example:
//   this.invitationsView = new InvitationsView(this.props.docId)
//   this.invitationsView.onChange((invitations) => {
//     debugger
//   })
//
export default class InvitationsView {
  constructor(workspaceId) {
    this.contactHandles = {}
    this.docHandles = {}
    this.invitations = []
    this.pendingInvitations = []
    this.selfId = null

    this.workspaceHandle = window.hm.openHandle(workspaceId)
    this.workspaceHandle.onChange((doc) => {
      this.selfId = doc.selfId
      doc.contactIds.forEach(id => this.watchContact(id))    
    })
  }

  onChange = (callback) => {
    this.onChangeCb = callback
    this.onChangeCb(this.invitations)
  }

  watchDoc = (docId) => {
    if (this.docHandles[docId]) {
      return
    }

    this.docHandles[docId] = window.hm.openHandle(docId)
    this.docHandles[docId].onChange((doc) => {
      const index = this.pendingInvitations.findIndex(i => i.docId === window.hm.getId(doc))
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
  }

  watchContact = (contactId) => {
    if (this.contactHandles[contactId]) {
      return
    }

    this.contactHandles[contactId] = window.hm.openHandle(contactId)
    this.contactHandles[contactId].onChange((contact) => {
      if (!contact.offeredUrls) {
        return
      }

      const offererId = contactId
      const offersForUs = contact.offeredUrls[this.selfId] || []

      offersForUs.forEach((documentUrl) => {
        const { docId } = parseDocumentLink(documentUrl)
        const doc = window.hm.openHandle(docId).get()

        if (!this.pendingInvitations.some((offer) => (offer.documentUrl === documentUrl && offer.offererId === offererId))) {
          this.pendingInvitations.push({ documentUrl, offererId, sender: contact, docId })
          this.watchDoc(docId)
        }
      })
    })
  }
}
