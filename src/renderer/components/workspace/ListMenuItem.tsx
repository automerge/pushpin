import React from 'react'

import Content from '../Content'
import Actions from './actions'
import { PushpinUrl } from '../../ShareLink';


export interface Props {
  contentUrl: PushpinUrl
  actions: any[]
  selected: boolean
}

// TODO: item highlighting
export default class ListMenuItem extends React.PureComponent<Props> {
  static defaultProps = {
    actions: [],
    selected: false
  }

  get defaultAction() {
    return this.props.actions[0] && this.props.actions[0].callback
  }

  onClick = () => {
    if (this.defaultAction) {
      this.defaultAction(this.props.contentUrl)()
    }
  }

  render = () => {
    const { contentUrl, actions, selected } = this.props
    const classes = [
      'ListMenuItem',
      this.defaultAction ? 'ListMenuItem--withDefaultAction' : '',
      selected ? 'ListMenuItem--selected' : ''
    ].join(' ')
    return (
      <div className={classes} onClick={this.onClick}>
        <div className="ListMenuItem-content">
          <Content context="list" url={contentUrl} />
        </div>
        <div className="ListMenuItem-actions">
          <Actions url={contentUrl} actions={actions} />
        </div>
      </div>
    )
  }
}
