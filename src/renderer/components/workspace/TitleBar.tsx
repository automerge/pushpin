import React from 'react'
import Debug from 'debug'
import { clipboard } from 'electron'

import Dropdown, { DropdownContent, DropdownTrigger } from '../react-simple-dropdown/dropdown'
import Omnibox from './Omnibox'
import Content from '../Content'
import Authors from './Authors'
import Share from './Share'
import { HypermergeUrl, PushpinUrl } from '../../ShareLink';
import { Handle } from 'hypermerge';

import "./TitleBar.css"

const log = Debug('pushpin:title-bar')

export interface Props {
  hypermergeUrl: HypermergeUrl
  openDoc: Function
}

interface Doc {
  currentDocUrl: PushpinUrl
}

interface State {
    activeOmnibox: boolean
    sessionHistory: PushpinUrl[]
    historyIndex: number
    doc?: Doc
}

export default class TitleBar extends React.PureComponent<Props, State> {
  dropdownRef = React.createRef<Dropdown>()
  handle?: Handle<Doc>
  state: State = {
    activeOmnibox: false,
    sessionHistory: [],
    historyIndex: 0
  }

  // This is the New Boilerplate
  componentWillMount = () => {
    this.handle = window.repo.watch(this.props.hypermergeUrl, (doc) => this.onChange(doc))
  }
  componentDidMount = () => {
    document.addEventListener('keydown', this.onKeyDown)
  }
  componentWillUnmount = () => {
    this.handle && this.handle.close()
    document.removeEventListener('keydown', this.onKeyDown)
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

  onChange = (doc: Doc) => {
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

      return { doc, sessionHistory, historyIndex }
    })
  }

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === '/' && document.activeElement === document.body) {
      if (!this.state.activeOmnibox) {
        this.activateOmnibox()
        e.preventDefault()
      }
    }
    if (e.key === 'Escape' && this.state.activeOmnibox) {
      this.deactivateOmnibox()
      e.preventDefault()
    }
  }

  activateOmnibox = () => {
    this.dropdownRef && this.dropdownRef.current && this.dropdownRef.current.show()
  }

  deactivateOmnibox = () => {
    this.dropdownRef.current.hide()
  }

  onShow = () => {
    this.setState(() => ({ activeOmnibox: true }))
  }

  onHide = () => {
    this.setState(() => ({ activeOmnibox: false }))
  }

  copyLink = (e: React.MouseEvent) => {
    if (this.state.doc) {
      clipboard.writeText(this.state.doc.currentDocUrl)
    }
  }

  render = () => {
    log('render')
    if (!this.state.doc || !this.state.doc.currentDocUrl) {
      return null
    }

    return (
      <div className="TitleBar">
        <button disabled={this.disableBack()} type="button" onClick={this.back} className="TitleBar__menuItem">
          <i className="fa fa-angle-left" />
        </button>
        <Dropdown
          ref={this.dropdownRef}
          className="TitleBar__menuItem TitleBar__right"
          onShow={this.onShow}
          onHide={this.onHide}
        >
          <DropdownTrigger>
            <i className="fa fa-map" />
          </DropdownTrigger>
          <DropdownContent>
            <Omnibox
              active={this.state.activeOmnibox}
              hypermergeUrl={this.props.hypermergeUrl}
              omniboxFinished={this.deactivateOmnibox}
            />
          </DropdownContent>
        </Dropdown>

        <button
          disabled={this.disableForward()}
          type="button"
          onClick={this.forward}
          className="TitleBar__menuItem"
        >
          <i className="fa fa-angle-right" />
        </button>

        <Content url={this.state.doc.currentDocUrl} context="list" editable />
        <Authors hypermergeUrl={this.props.hypermergeUrl} />

        <Dropdown className="TitleBar__menuItem
          TitleBar__right"
        >
          <DropdownTrigger>
            <i className="fa fa-group" />
          </DropdownTrigger>
          <DropdownContent>
            <Share hypermergeUrl={this.props.hypermergeUrl} />
          </DropdownContent>
        </Dropdown>

        <button
          className="BoardTitle__clipboard BoardTitle__labeledIcon TitleBar__menuItem"
          type="button"
          onClick={this.copyLink}
        >
          <i className="fa fa-clipboard" />
        </button>
      </div>
    )
  }
}
