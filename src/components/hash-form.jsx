import React from 'react'
import classNames from 'classnames'
import Debug from 'debug'

import Loop from '../loop'
import * as Model from '../model'

const log = Debug('hash-form')

class HashForm extends React.PureComponent {
  constructor(props) {
    super(props)
    log('constructor')
  }

  componentWillMount() {
    log('componentWillMount')
  }

  componentDidMount() {
    log('componentDidMount')
  }

  componentWillReceiveProps(nextProps) {
    log('componentWillReceiveProps')
  }

  componentWillUpdate(nextProps) {
    log('componentWillUpdate')
  }

  componentDidUpdate() {
    log('componentDidUpdate')
  }

  onSubmit(e) {
    log('onSubmit')
    e.preventDefault()
    Loop.dispatch(Model.hashFormSubmitted)
  }

  onChange(e) {
    log('onChange')
    e.preventDefault()
    Loop.dispatch(Model.hashFormChanged, { docId: e.target.value })
  }

  render() {
    log('render')
    return (
      <div id='hashForm'>
        <form onSubmit={this.onSubmit}>
          <input
             type='text'
             value={this.props.formDocId}
             onChange={this.onChange}
             className={classNames(this.props.activeDocId === this.props.requestedDocId ? 'loaded' : 'loading')}
          />
        </form>
      </div>
    )
  }
}

export default HashForm
