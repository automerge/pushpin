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
      contactIds: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.openDocument = this.openDocument.bind(this)
  }

  openDocument(id) {
    this.props.onChange(d => {
      d.currentDocUrl = id
    })
  }

  render() {
    log('render')
    if (!this.props.doc.currentDocUrl) {
      return null
    }

    const { docId } = parseDocumentLink(this.props.doc.currentDocUrl)

    return (
      <div className="TitleBar">
        <div className="TitleBar__left">
          <img
            className="TitleBar__logo"
            alt="pushpin logo"
            src="pushpinIcon_Standalone.svg"
            width="28"
            height="28"
          />
          <Content url={createDocumentLink('board-title', docId)} />
        </div>
        <HashForm
          formDocId={this.props.doc.currentDocUrl}
          onChanged={this.openDocument}
        />
        <div className="TitleBar__dropdowns">
          <Dropdown>
            <DropdownTrigger>
              <div className="TitleBar__dropDown">
                <i className="fa fa-group" />
              </div>
            </DropdownTrigger>
            <DropdownContent>
              <Content
                url={createDocumentLink('share', this.props.docId)}
                openDocument={this.openDocument}
              />
            </DropdownContent>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <div className="TitleBar__dropDown">
                <i className="fa fa-gear" />
              </div>
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
