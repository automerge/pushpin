import React from 'react'
import classnames from 'classnames'

import Content from '../Content'
import Actions, { ActionItem } from './Actions'
import { PushpinUrl } from '../../ShareLink'

export interface Props {
  contentUrl: PushpinUrl
  actions: ActionItem[]
  selected: boolean
}

ListMenuItem.defaultProps = {
  actions: [],
  selected: false,
}

// TODO: item highlighting
export default function ListMenuItem(props: Props) {
  const { contentUrl, actions, selected } = props
  const [defaultAction] = actions

  function onClick() {
    if (defaultAction) {
      defaultAction.callback(contentUrl)
    }
  }

  const className = classnames([
    'ListMenuItem',
    {
      'ListMenuItem--withDefaultAction': !!defaultAction,
      'ListMenuItem--selected': selected,
    },
  ])

  return (
    <div className={className} onClick={onClick}>
      <div className="ListMenuItem-content">
        <Content context="list" url={contentUrl} />
      </div>
      <div className="ListMenuItem-actions">
        <Actions url={contentUrl} actions={actions} />
      </div>
    </div>
  )
}
