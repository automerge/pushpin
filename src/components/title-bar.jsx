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
              <i className="fa fa-train" />
            </div>
          </DropdownTrigger>
          <DropdownContent>
            <div className="PopOverWrapper">
              <div className="ListMenu">
                <div className="ListMenu__header">
                  <div class="Label">
                    <p className="Label Type--header">Label</p>
                  </div>
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
                  <div className="ListMenu__item">
                    <div className="ListMenu__grouped">
                      <div className="ListMenu__typegroup">
                        <div><i className="fa fa-info-circle"></i></div>
                        <p className="Type--primary">Sorry, nothing to see here.</p>
                        <p className="Type--secondary">Try making more friends</p>
                      </div>
                      <div className="ButtonGroup">
                        <div role="button" className="ButtonAction">
                          <i className="fa fa-arrow-left"/>
                          <p className="ButtonAction__label">View</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ListMenu__section">
                  <div className="ListMenu__item">
                    <div className="ListMenu__thumbnail">
                      <div className="Avatar">
                        <img src="../img/default-avatar.png" width="36"/>
                      </div>
                    </div>
                    <div className="Label">
                      <p className="Type--primary">A thing that goes on for far to long and is too long for the container</p>
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
