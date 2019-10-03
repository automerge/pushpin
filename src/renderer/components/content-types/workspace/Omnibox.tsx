/* eslint-disable react/sort-comp */
// this component has a bunch of weird pseudo-members that make eslint sad

import React from 'react'
import Debug from 'debug'

import { Handle } from 'hypermerge'
import { HypermergeUrl } from '../../../ShareLink'
import { WorkspaceUrlsApi } from '../../../WorkspaceHooks'
import { ContactDoc } from '../contact'
import { Doc as WorkspaceDoc } from './Workspace'
import WorkspaceInOmnibox from './WorkspaceInOmnibox'
import './Omnibox.css'

const log = Debug('pushpin:omnibox')

export interface Props {
  active: boolean
  hypermergeUrl: HypermergeUrl
  omniboxFinished: Function
  workspaceUrlsContext: WorkspaceUrlsApi | null
}

interface State {
  search: string
}

export default class Omnibox extends React.PureComponent<Props, State> {
  omniboxInput = React.createRef<HTMLInputElement>()
  handle?: Handle<WorkspaceDoc>
  viewedDocHandles: { [docUrl: string]: Handle<any> }
  contactHandles: { [contactId: string]: Handle<ContactDoc> }
  invitationsView: any

  state: State = {
    search: '',
  }

  constructor(props) {
    super(props)
    this.viewedDocHandles = {}
    this.contactHandles = {}
  }

  // TODO: remove the need for this
  componentWillReceiveProps(newProps: Props) {
    if (!this.props.active && newProps.active) {
      this.setState({ search: '' }, () => {
        setTimeout(() => {
          this.omniboxInput && this.omniboxInput.current && this.omniboxInput.current.focus()
        }, 0)
      })
    }
  }

  // pass this down
  endSession = () => {
    this.props.omniboxFinished()
  }

  // pass input down too
  onInputChange = (e) => {
    this.setState({ search: e.target.value })
  }

  render = () => {
    log('render')

    if (!this.props.workspaceUrlsContext) {
      return null
    }

    const { workspaceUrls } = this.props.workspaceUrlsContext

    return (
      <div className="Omnibox">
        <div className="Omnibox--header">
          <input
            className="Omnibox--input"
            type="text"
            ref={this.omniboxInput}
            onChange={this.onInputChange}
            value={this.state.search}
            placeholder="Search..."
          />
        </div>
        {workspaceUrls.map((url) => (
          <WorkspaceInOmnibox
            omniboxFinished={this.props.omniboxFinished}
            hypermergeUrl={this.props.hypermergeUrl}
            search={this.state.search}
            active={this.props.active}
          />
        ))}
      </div>
    )
  }
}
