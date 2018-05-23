import React from 'react'
import ReactToggle from 'react-toggle'

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
