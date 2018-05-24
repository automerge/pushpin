import React from 'react'
import ReactToggle from 'react-toggle'

import ContentTypes from '../content-types'

export default class Toggle extends React.PureComponent {
  constructor() {
    super()
    this.toggle = this.toggle.bind(this)
  }

  toggle() {
    this.props.onChange(doc => doc.toggled = !doc.toggled)
  }

  render() {
    return <ReactToggle checked={this.props.doc.toggled} onChange={this.toggle} />
  }
}

ContentTypes.register({
  component: Toggle,
  type: 'toggle',
  name: 'Toggle',
  icon: 'toggle-off',
  initialize: (doc) => {
    doc.toggled = false
  }
})
