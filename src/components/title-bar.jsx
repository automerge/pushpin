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
    doc: PropTypes.shape({
      selfId: PropTypes.string,
      currentDocUrl: PropTypes.string,
      contactIds: PropTypes.arrayOf(PropTypes.string),
      viewedDocUrls: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    openDoc: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.back = this.back.bind(this)
    this.forward = this.forward.bind(this)
    this.hideBoardHistory = this.hideBoardHistory.bind(this)

    this.boardHistory = React.createRef()

    // this should never change, right?
    window.selfId = props.doc.selfId
  }

  backIndex() {
    return this.props.doc.viewedDocUrls.findIndex(url => url === this.props.doc.currentDocUrl)
  }

  back() {
    const index = this.backIndex()
    this.props.openDoc(this.props.doc.viewedDocUrls[index + 1], { saveHistory: false })
  }

  forward() {
    const index = this.backIndex()
    this.props.openDoc(this.props.doc.viewedDocUrls[index - 1], { saveHistory: false })
  }

  hideBoardHistory() {
    this.boardHistory.current.hide()
  }

  render() {
    log('render')
    if (!this.props.doc.currentDocUrl) {
      return null
    }

    const boardDocUrls = this.props.doc.viewedDocUrls.filter(url => parseDocumentLink(url).type === 'board')
    const boardDocLinks = boardDocUrls.map(url => {
      const { docId, type } = parseDocumentLink(url)
      const docLinkUrl = createDocumentLink('doc-link', docId)

      return (
        <div key={url} className="ListMenu__item">
          <Content url={docLinkUrl} linkedDocumentType={type} />
        </div>
      )
    })

    const { docId, type } = parseDocumentLink(this.props.doc.currentDocUrl)
    const index = this.backIndex()
    const disableBack = index === (this.props.doc.viewedDocUrls.length - 1)
    const disableForward = index === 0

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
          <button disabled={disableBack} onClick={this.back} className="TitleBar__menuItem">
            <i className="fa fa-angle-left" />
          </button>
          <button disabled={disableForward} onClick={this.forward} className="TitleBar__menuItem">
            <i className="fa fa-angle-right" />
          </button>
        </div>

        <div className="TitleBar__center">
          <Content url={createDocumentLink('board-title', docId)} />
          <HashForm
            formDocId={this.props.doc.currentDocUrl}
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
                url={createDocumentLink('settings', this.props.doc.selfId)}
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
