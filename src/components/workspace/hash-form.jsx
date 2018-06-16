import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

const log = Debug('pushpin:hash-form')

export default class HashForm extends React.PureComponent {
  static propTypes = {
    formDocId: PropTypes.string.isRequired,
    onChanged: PropTypes.func.isRequired
  }

  state = { value: this.props.formDocId }

  componentWillReceiveProps = (nextProps) => {
    this.setState({ value: nextProps.formDocId })
  }

  onSubmit = (e) => {
    log('onSubmit')
    e.preventDefault()
    this.props.onChanged(this.input.value)
  }

  setInput = (elem) => {
    this.input = elem
  }

  // Should go back to checking activeDocId === requestedDocId for className
  render = () => (
    <div className="HashForm">
      <form onSubmit={this.onSubmit}>
        <input
          type="text"
          className="loaded"
          value={this.state.value}
          onChange={e => this.setState({ value: e.target.value })}
          ref={this.setInput}
        />
      </form>
    </div>
  )
}
