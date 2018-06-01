import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import Dropdown, { DropdownContent, DropdownTrigger } from 'react-simple-dropdown'

import HashForm from './hash-form'
import Content from './content'
import ContentTypes from '../content-types'


const log = Debug('pushpin:title-bar')

export default class TitleBar extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    doc: PropTypes.shape({
      selfId: PropTypes.string,
      boardId: PropTypes.string,
      offeredIds: PropTypes.arrayOf(PropTypes.object),
      contactIds: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.openBoard = this.openBoard.bind(this)
  }

  openBoard(id) {
    this.props.onChange(d => {
      d.boardId = id
    })
  }

  render() {
    log('render')

    return (
      <div className="TitleBar">
        <div className="TitleBar__left">
          <button className="TitleBar__menuItem">
            <i className="fa fa-map"/>
          </button>
          <button className="TitleBar__menuItem">
            <i className="fa fa-angle-left"/>
          </button>
          <button className="TitleBar__menuItem">
            <i className="fa fa-angle-right"/>
          </button>
        </div>
        <div className="TitleBar__center">
          <HashForm
            formDocId={this.props.doc.boardId}
            onChanged={this.openBoard}
          />
        </div>

        <div className="TitleBar__right">
          <Dropdown className="TitleBar__menuItem">
            <DropdownTrigger>
              <i className="fa fa-group" />
            </DropdownTrigger>
            <DropdownContent>
              <Content
                type="share"
                docId={this.props.docId}
                openBoard={this.openBoard}
              />
            </DropdownContent>
          </Dropdown>
          <Dropdown className="TitleBar__menuItem">
            <DropdownTrigger>
              <i className="fa fa-gear" />
            </DropdownTrigger>
            <DropdownContent>
              <Content type="settings" docId={this.props.doc.selfId} />
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
