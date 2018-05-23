import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import Loop from '../loop'
import * as Model from '../models/model'

const log = Debug('pushpin:hash-form')

export default class HashForm extends React.PureComponent {
  static propTypes = {
    formDocId: PropTypes.string.isRequired,
    // activeDocId: PropTypes.string.isRequired,
    // requestedDocId: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onChange(e) {
    log('onChange')
    Loop.dispatch(Model.formChanged, { docId: e.target.value })
  }

  onSubmit(e) {
    log('onSubmit')
    e.preventDefault()
    Loop.dispatch(Model.formSubmitted)
  }

  render() {
    log('render')

    // Should go back to checking activeDocId === requestedDocId for className
    return (
      <div className="HashForm">
        <form onSubmit={this.onSubmit}>
          <input
            type="text"
            value={this.props.formDocId}
            onChange={this.onChange}
            className="loaded"
          />
        </form>
      </div>
    )
  }
}
