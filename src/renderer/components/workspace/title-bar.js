import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import Dropdown, { DropdownContent, DropdownTrigger } from '../react-simple-dropdown/dropdown'

import OmniPrompt from './omni-prompt'
import Content from '../content'
import ContactEditor from '../contact/contact-editor'
import PresentContacts from './present-contacts'
import Share from './share'
import { createDocumentLink } from '../../share-link'

const log = Debug('pushpin:title-bar')

export default class TitleBar extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
    openDoc: PropTypes.func.isRequired,
  }

  state = { sessionHistory: [], historyIndex: 0 }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.hypermergeUrl)
  componentWillUnmount = () => this.handle.close()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  disableBack = () => this.state.historyIndex === (this.state.sessionHistory.length - 1)

  disableForward = () => this.state.historyIndex === 0

  back = () => {
    if (this.disableBack()) {
      throw new Error('Can not go back further than session history')
    }

    this.setState((prevState) => {
      const historyIndex = prevState.historyIndex + 1
      this.props.openDoc(prevState.sessionHistory[historyIndex])
      return { historyIndex }
    })
  }

  forward = () => {
    if (this.disableForward()) {
      throw new Error('Can not go forward past session history')
    }

    this.setState((prevState) => {
      const historyIndex = prevState.historyIndex - 1
      this.props.openDoc(prevState.sessionHistory[historyIndex])
      return { historyIndex }
    })
  }

  onChange = (doc) => {
    this.setState((prevState) => {
      let { historyIndex, sessionHistory } = prevState

      // Init sessionHistory
      if (sessionHistory.length === 0) {
        sessionHistory = [doc.currentDocUrl]
        // If we're opening a new document (as opposed to going back or forward),
        // add it to our sessionHistory and remove all docs 'forward' of the current index
      } else if (doc.currentDocUrl !== sessionHistory[historyIndex]) {
        sessionHistory = [doc.currentDocUrl, ...(sessionHistory.slice(historyIndex))]
        historyIndex = 0
      }

      return { ...doc, sessionHistory, historyIndex }
    })
  }

  render = () => {
    log('render')
    if (!this.state.currentDocUrl) {
      return null
    }

    return (
      <div className="TitleBar">
        <Dropdown className="TitleBar__menuItem TitleBar__left">
          <DropdownTrigger>
            <Content context="title-bar" url={createDocumentLink('contact', this.state.selfId)} />
          </DropdownTrigger>
          <DropdownContent>
            <ContactEditor hypermergeUrl={this.state.selfId} />
          </DropdownContent>
        </Dropdown>
        <button disabled={this.disableBack()} type="button" onClick={this.back} className="TitleBar__menuItem">
          <i className="fa fa-angle-left" />
        </button>
        <button disabled={this.disableForward()} type="button" onClick={this.forward} className="TitleBar__menuItem">
          <i className="fa fa-angle-right" />
        </button>
        <Content url={this.state.currentDocUrl} context="list" editable />
        <PresentContacts
          currentDocUrl={this.state.currentDocUrl}
        />
        <OmniPrompt hypermergeUrl={this.props.hypermergeUrl} />

        <Dropdown className="TitleBar__menuItem TitleBar__right">
          <DropdownTrigger>
            <i className="fa fa-group" />
          </DropdownTrigger>
          <DropdownContent>
            <Share hypermergeUrl={this.props.hypermergeUrl} />
          </DropdownContent>
        </Dropdown>
      </div>
    )
  }
}
