import React from 'react'
import PropTypes from 'prop-types'
import ReactToggle from 'react-toggle'

import ContentTypes from '../content-types'

export default class Toggle extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      toggled: PropTypes.boolean,
    }).isRequired,
    onChange: PropTypes.func.isRequired
  }

  static initializeDocument(onChange) {
    onChange((doc) => {
      doc.toggled = false
    })
  }

  constructor() {
    super()
    this.toggle = this.toggle.bind(this)
  }

  toggle() {
    this.props.onChange((doc) => {
      doc.toggled = !doc.toggled
    })
  }

  render() {
    return <ReactToggle checked={this.props.doc.toggled || false} onChange={this.toggle} />
  }
}

ContentTypes.register({
  component: Toggle,
  type: 'toggle',
  name: 'Toggle',
  icon: 'toggle-off',
  resizable: false
})
