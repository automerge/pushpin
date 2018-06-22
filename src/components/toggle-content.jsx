import React from 'react'
import PropTypes from 'prop-types'
import ReactToggle from 'react-toggle'

import ContentTypes from '../content-types'

export default class ToggleContent extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument = (toggleDoc) => {
    toggleDoc.toggled = false
  }

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => this.handle.release()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      this.handle.release()
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  flipToggle = () => {
    this.handle.change((doc) => {
      doc.toggled = !doc.toggled
    })
  }

  render = () => <ReactToggle checked={this.state.toggled} onChange={this.flipToggle} />
}

ContentTypes.register({
  component: ToggleContent,
  type: 'toggle',
  name: 'Toggle',
  icon: 'toggle-off',
  resizable: false
})
