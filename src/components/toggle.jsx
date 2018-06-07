import React from 'react'
import ReactToggle from 'react-toggle'
import Base from './base'

import ContentTypes from '../content-types'

export default class Toggle extends Base {
  static initializeDocument(doc) {
    doc.toggled = false
  }

  flipToggle = () => {
    this.change(doc => {
      doc.toggled = !doc.toggled
    })
  }

  render() {
    return <ReactToggle checked={this.state.toggled} onChange={this.flipToggle} />
  }
}

ContentTypes.register({
  component: Toggle,
  type: 'toggle',
  name: 'Toggle',
  icon: 'toggle-off',
  resizable: false
})
