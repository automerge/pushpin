import React from 'react'
import PropTypes from 'prop-types'
import ReactToggle from 'react-toggle'
import Debug from 'debug'

import ContentTypes from '../content-types'

const log = Debug('pushpin:toggle')

export default class Toggle extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(toggle) {
    toggle.toggled = false
  }

  constructor() {
    log('constructor')
    super()
    this.handle = null
    this.flipToggle = this.flipToggle.bind(this)
  }

  componentWillMount() {
    log('componentWillMount')
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => {
      this.setState({ toggled: doc.toggled })
    })
  }

  flipToggle() {
    this.handle.change((doc) => {
      doc.toggled = !doc.toggled
    })
  }

  render() {
    log('render')
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
