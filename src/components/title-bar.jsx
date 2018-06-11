import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import Dropdown, { DropdownContent, DropdownTrigger } from 'react-simple-dropdown'

import HashForm from './hash-form'
import Content from './content'
import ContentTypes from '../content-types'
import { createDocumentLink, parseDocumentLink } from '../share-link'

const log = Debug('pushpin:title-bar')

export default class TitleBar extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    openDoc: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
    onForward: PropTypes.func.isRequired,
    disableBack: PropTypes.bool.isRequired,
    disableForward: PropTypes.bool.isRequired
  }

  boardHistory = React.createRef()

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

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  render = () => {
    log('render')
    if (!this.state.currentDocUrl) {
      return null
    }

    const boardDocUrls = this.state.viewedDocUrls.filter(url => parseDocumentLink(url).type === 'board')
    const boardDocLinks = boardDocUrls.map(url => {
      const { docId, type } = parseDocumentLink(url)
      const docLinkUrl = createDocumentLink('doc-link', docId)

      return (
        <div key={url} className="ListMenu__item">
          <Content url={docLinkUrl} linkedDocumentType={type} />
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
          <button disabled={this.props.disableBack} onClick={this.props.onBack} className="TitleBar__menuItem">
            <i className="fa fa-angle-left" />
          </button>
          <button disabled={this.props.disableForward} onClick={this.props.onForward} className="TitleBar__menuItem">
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
              <Content
                url={createDocumentLink('share', this.props.docId)}
                openDocument={this.props.openDoc}
              />
            </DropdownContent>
          </Dropdown>
          <Dropdown className="TitleBar__menuItem">
            <DropdownTrigger>
              <i className="fa fa-gear" />
            </DropdownTrigger>
            <DropdownContent>
              <Content
                url={createDocumentLink('settings', this.state.selfId)}
              />
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: TitleBar,
  type: 'title-bar',
  name: 'Title Bar',
  icon: 'sticky-note',
  unlisted: true,
})
