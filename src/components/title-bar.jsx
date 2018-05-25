import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import Dropdown, { DropdownContent, DropdownTrigger } from 'react-simple-dropdown'

import HashForm from './hash-form'
import Share from './share'
import Settings from './settings'
import Content from './content'
import ContentTypes from '../content-types'

const log = Debug('pushpin:title-bar')

export default class TitleBar extends React.PureComponent {
  static propTypes = {
    formDocId: PropTypes.string.isRequired,
    requestedDocId: PropTypes.string.isRequired,
    board: PropTypes.shape({
      title: PropTypes.string.isRequired
    }).isRequired,
    self: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string.isRequired
    }).isRequired,
    onBoardIdChanged: PropTypes.func
  }

  static defaultProps = {
    onBoardIdChanged: () => {}
  }

  onSubmit(e) {
    log('onSubmit')
    e.preventDefault()
  }

  render() {
    log('render')

    const { state } = this.props

    const notifications = []
    state.workspace.offeredIds.forEach(offer => {
      const contact = state.contacts[offer.offererId] || { name: `Loading ${offer.offererId}` }

      if (state.offeredDocs && state.offeredDocs[offer.offeredId]) {
        const board = state.offeredDocs[offer.offeredId]
        notifications.push({ type: 'Invitation', sender: contact, board })
      }
    })

    const filteredContacts = Object.keys(state.contacts || {})
      .filter(contactId => (!state.board.authorIds.includes(contactId)))
      .reduce((res, key) => { res[key] = state.contacts[key]; return res }, {})

    const shareData = {
      authors: [],
      board: this.props.board,
      contacts: filteredContacts,
      notifications
    }

    // remember to exclude yourself from the authors list (maybe?)
    if (state.board && state.board.authorIds) {
      shareData.authors = state.board.authorIds.map((authorId) => {
        if (state.workspace && state.self && authorId === state.workspace.selfId) {
          // we're not a "contact", but show us in the authors list if we're there
          return { name: `You (${state.self.name || 'loading'})` }
        } else if (state.contacts && state.contacts[authorId]) {
          // otherwise we should have this contact in our contacts list...
          return state.contacts[authorId]
        }

        // and if we don't, make up a stub
        return { name: 'ErrNo' }
        /* TODO improve this: really, we want to increase the likelihood of good output here.
               that means either caching values we want to show in the host document and swapping
               for newer versions as required or maybe guaranteeing load order better (or both)
               or perhaps leave out loading values so we don't see bogus data? */
      })
    }

    return (
      <div className="TitleBar">
        <img
          className="TitleBar__logo"
          alt="pushpin logo"
          src="pushpinIcon_Standalone.svg"
          width="28"
          height="28"
        />

        <Content card={{type: 'board-title', docId: this.props.doc.boardId}} />

        <HashForm
          formDocId={this.props.doc.boardId}
          onChanged={this.props.onBoardIdChanged}
        />

        <Dropdown>
          <DropdownTrigger>
            <div className="TitleBar__dropDown">
              <i className="fa fa-group" />
            </div>
          </DropdownTrigger>
          <DropdownContent>
            <Share {...shareData} />
          </DropdownContent>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <div className="TitleBar__dropDown">
              <i className="fa fa-gear" />
            </div>
          </DropdownTrigger>
          <DropdownContent>
            <Content card={{type: 'settings', docId: this.props.doc.selfId}} />
          </DropdownContent>
        </Dropdown>
      </div>
    )
  }
}

ContentTypes.register({
  component: TitleBar,
  type: 'title-bar',
  name: 'Title Bar',
  icon: 'sticky-note'
})
