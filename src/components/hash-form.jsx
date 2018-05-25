import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import Loop from '../loop'
import * as Model from '../models/model'

const log = Debug('pushpin:hash-form')

export default class HashForm extends React.PureComponent {
  static propTypes = {
    formDocId: PropTypes.string.isRequired,
    onChanged: PropTypes.func
  }

  static defaultProps = {
    onChanged: () => {}
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.state = { value: this.props.formDocId }
    this.onSubmit = this.onSubmit.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.formDocId })
  }

  onSubmit(e) {
    log('onSubmit')
    e.preventDefault()
    this.props.onChanged(this.input.value)
  }

  render() {
    log('render')

    // Should go back to checking activeDocId === requestedDocId for className
    return (
      <div className="HashForm">
        <form onSubmit={this.onSubmit}>
          <input
            type="text"
            className="loaded"
            value={this.state.value}
            onChange={e => this.setState({ value: e.target.value })}
            ref={node => this.input = node}
          />
        </form>
      </div>
    )
  }
}
