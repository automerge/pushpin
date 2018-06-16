import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import Dropdown, { DropdownContent, DropdownTrigger } from 'react-simple-dropdown'

import HashForm from './hash-form'
import Content from '../content'
import Share from './share'
import Settings from './settings'

import { createDocumentLink, parseDocumentLink } from '../../share-link'

const log = Debug('pushpin:title-bar')

export default class TitleBar extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    openDoc: PropTypes.func.isRequired,
  }

  boardHistory = React.createRef()

  state = { sessionHistory: [], historyIndex: 0 }

  hideBoardHistory = () => {
    this.boardHistory.current.hide()
  }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  disableBack = () => this.state.historyIndex === (this.state.sessionHistory.length - 1)

  disableForward = () => this.state.historyIndex === 0

  back = () => {
    if (this.disableBack()) {
      throw new Error('Can not go back further than session history')
    }

    const historyIndex = this.state.historyIndex + 1
    this.setState({ historyIndex }, () => {
      this.props.openDoc(this.state.sessionHistory[historyIndex])
    })
  }

  forward = () => {
    if (this.disableForward()) {
      throw new Error('Can not go forward past session history')
    }

    const historyIndex = this.state.historyIndex - 1

    this.setState({ historyIndex }, () => {
      this.props.openDoc(this.state.sessionHistory[historyIndex])
    })
  }

  onChange = (doc) => {
    let { historyIndex, sessionHistory } = this.state

    // Init sessionHistory
    if (sessionHistory.length === 0) {
      sessionHistory = [doc.currentDocUrl]
    // If we're opening a new document (as opposed to going back or forward),
    // add it to our sessionHistory and remove all docs 'forward' of the current index
    } else if (doc.currentDocUrl !== sessionHistory[historyIndex]) {
      sessionHistory = [doc.currentDocUrl, ...(sessionHistory.slice(historyIndex))]
      historyIndex = 0
    }

    this.setState({ ...doc, sessionHistory, historyIndex })
  }

  render = () => {
    log('render')
    if (!this.state.currentDocUrl) {
      return null
    }

    const boardDocUrls = this.state.viewedDocUrls.filter(url => parseDocumentLink(url).type === 'board')
    const boardDocLinks = boardDocUrls.map(url => {
      const { docId, type } = parseDocumentLink(url)
      const docLinkUrl = createDocumentLink('board', docId)

      return (
        <div key={url} className="ListMenu__item">
          <Content context="list" url={docLinkUrl} linkedDocumentType={type} />
        </div>
      )
    })

    const { docId } = parseDocumentLink(this.state.currentDocUrl)

    return (
      <div className="TitleBar">
        <div className="TitleBar__left">
          <Dropdown ref={this.boardHistory} className="TitleBar__menuItem">
            <DropdownTrigger>
              <i className="fa fa-map" />
            </DropdownTrigger>
            <DropdownContent onClick={this.hideBoardHistory}>
              <div className="PopOverWrapper">
                <div className="ListMenu">
                  <div className="ListMenuSection">
                    { boardDocLinks }
                  </div>
                </div>
              </div>
            </DropdownContent>
          </Dropdown>
          <button disabled={this.disableBack()} onClick={this.back} className="TitleBar__menuItem">
            <i className="fa fa-angle-left" />
          </button>
          <button disabled={this.disableForward()} onClick={this.forward} className="TitleBar__menuItem">
            <i className="fa fa-angle-right" />
          </button>
        </div>

        <div className="TitleBar__center">
          <Content url={createDocumentLink('board-title', docId)} />
          <HashForm
            formDocId={this.state.currentDocUrl}
            onChanged={this.props.openDoc}
          />
        </div>

        <div className="TitleBar__right">
          <Dropdown className="TitleBar__menuItem">
            <DropdownTrigger>
              <i className="fa fa-group" />
            </DropdownTrigger>
            <DropdownContent>
              <Share
                docId={this.props.docId}
                openDocument={this.props.openDoc}
              />
            </DropdownContent>
          </Dropdown>
          <Dropdown className="TitleBar__menuItem">
            <DropdownTrigger>
              <i className="fa fa-gear" />
            </DropdownTrigger>
            <DropdownContent>
              <Settings docId={this.state.selfId} />
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
    )
  }
}
