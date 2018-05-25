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

    this.onSubmit = this.onSubmit.bind(this)
  }

  onSubmit(e) {
    log('onSubmit')
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
            defaultValue={this.props.formDocId}
            ref={node => this.input = node}
          />
        </form>
      </div>
    )
  }
}
