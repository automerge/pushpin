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
    this.invitations = []
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

        if (!this.invitations.some((offer) => (offer.documentUrl === documentUrl && offer.offererId === offererId))) {
          this.invitations.push({ documentUrl, offererId, sender: contact, doc })
        }
      })

      if (this.onChangeCb) {
        this.onChangeCb(this.invitations)
      }
    })
  }
}
