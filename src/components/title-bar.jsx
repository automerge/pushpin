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
    doc: PropTypes.shape({
      selfId: PropTypes.string,
      boardId: PropTypes.string,
      offeredIds: PropTypes.arrayOf(PropTypes.string),
      contactIds: PropTypes.arrayOf(PropTypes.string)
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

    return (
      <div className="TitleBar">
        <img
          className="TitleBar__logo"
          alt="pushpin logo"
          src="pushpinIcon_Standalone.svg"
          width="28"
          height="28"
        />

        <Content card={{ type: 'board-title', docId: this.props.doc.boardId }} />

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
            <Content
              card={{ type: 'share', docId: this.props.doc.boardId }}
              offeredIds={this.props.doc.offeredIds}
              contactIds={this.props.doc.contactIds}
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
            <Content card={{ type: 'settings', docId: this.props.doc.selfId }} />
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
  icon: 'sticky-note',
  unlisted: true,
})
