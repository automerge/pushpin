import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { RIEInput } from 'riek'
import Dropdown, { DropdownContent, DropdownTrigger } from 'react-simple-dropdown'

import Loop from '../loop'
import * as Board from '../models/board'
import HashForm from './hash-form'
import Share from './share'
import Settings from './settings'


const log = Debug('pushpin:title-bar')

export default class TitleBar extends React.PureComponent {
  static propTypes = {
    formDocId: PropTypes.string.isRequired,
    // activeDocId: PropTypes.string.isRequired,
    requestedDocId: PropTypes.string.isRequired,
    board: PropTypes.shape({
      title: PropTypes.string.isRequired
    }).isRequired,
    self: PropTypes.shape({
      name: PropTypes.string.isRequired,
      avatar: PropTypes.string.isRequired
    }).isRequired
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.onChange = this.onChangeTitle.bind(this)
    this.onSubmit = this.onChangeBoardBackgroundColor.bind(this)
  }

  onChangeTitle(newState) {
    log('onChangeTitle')
    Loop.dispatch(Board.setTitle, newState)
  }

  onChangeBoardBackgroundColor(color) {
    log('onChangeBoardBackgroundColor')
    Loop.dispatch(Board.setBackgroundColor, { backgroundColor: color.hex })
  }

  onSubmit(e) {
    log('onSubmit')
    e.preventDefault()
  }

  render() {
    log('render')

    /*
    const shareData = {
      authors: {
        1: { name: 'Roshan', avatar: '../img/avatar-example.png' },
        2: { name: 'Peter' }
      },
      board: this.props.board,
      contacts: {
        3: { name: 'Mark' },
        4: { name: 'Ignatius' }
      },
      notifications: {
        A: { type: 'Invitation', sender: { name: 'Pvh' }, board: { title: 'Pushpin Demo' } },
        B: { type: 'Invitation', sender: { name: 'Ignatius' }, board: { title: 'Pokemon research' } }
      }
    }
    */

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

        <RIEInput
          value={this.props.board.title}
          change={this.onChangeTitle}
          propName="title"
          className="TitleBar__titleText"
          classLoading="TitleBar__titleText--loading"
          classInvalid="TitleBar__titleText--invalid"
        />

        <HashForm
          formDocId={this.props.formDocId}
          // activeDocId={this.props.activeDocId}
          requestedDocId={this.props.requestedDocId}
        />

        <Dropdown>
          <DropdownTrigger>
            <div className="TitleBar__dropDown">
              <i className="fa fa-train" />
            </div>
          </DropdownTrigger>
          <DropdownContent>
            <div className="PopOverWrapper">
              <div className="ListMenu">
                <div className="ListMenu__header">
                  <p className="Type--header">Label</p>
                </div>
                <div className="Tabs">
                  <div role="button" className="Tabs__tab Tabs__tab--active">
                    <i className="fa fa-share-alt" />
                    <p className="Type--primary">Label</p>
                  </div>
                  <div role="button" className="Tabs__tab">
                    <i className="fa fa-star" />
                    <p className="Type--primary">Label</p>
                  </div>
                </div>
                <div className="ListMenu__segment">
                  Label
                </div>

                <div className="ListMenu__section">
                  <div className="ListMenu__empty">
                    <div><i className="fa fa-info-circle"></i></div>
                    <p className="Type--primary">Sorry, nothing to see here.</p>
                    <p className="Type--secondary">Try making more friends</p>
                  </div>
                  <div className="ListMenu__item">
                    <div className="ListMenu__thumbnail">
                      <div className="Avatar">
                        <img src="../img/default-avatar.png" width="36"/>
                      </div>
                    </div>
                    <div className="Label">
                      <p className="Type--primary">Label</p>
                      <p className="Type--secondary">Secondary Label</p>
                    </div>
                    <div className="Actions">
                      <div className="ButtonAction"><i className="fa fa-share-alt"/></div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </DropdownContent>
        </Dropdown>

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
            <Settings
              name={this.props.self && this.props.self.name ?
                this.props.self.name : 'Self not loaded'}
              avatar={this.props.self && this.props.self.avatar ?
                this.props.self.avatar : '../img/default-avatar.png'}
            />
          </DropdownContent>
        </Dropdown>
      </div>
    )
  }
}
