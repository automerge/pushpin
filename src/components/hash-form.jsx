import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Debug from 'debug'

import { FORM_CHANGED, FORM_SUBMITTED } from '../action-types'

const log = Debug('pushpin:hash-form')

class HashFromPresentation extends React.PureComponent {
  constructor(props) {
    super(props)
    log('constructor')

    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onChange(e) {
    log('onChange')
    this.props.dispatch({ type: FORM_CHANGED, docId: e.target.value })
  }

  onSubmit(e) {
    log('onSubmit')
    e.preventDefault()
    this.props.dispatch({ type: FORM_SUBMITTED })
  }

  render() {
    log('render')

    return (
      <div id="hashForm">
        <form onSubmit={this.onSubmit}>
          <input
            type="text"
            value={this.props.formDocId}
            onChange={this.onChange}
            className={classNames(this.props.activeDocId === this.props.requestedDocId ? 'loaded' : 'loading')}
          />
        </form>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  activeDocId: state.activeDocId,
  formDocId: state.formDocId,
  requestedDocId: state.requestedDocId,
})

const mapDispatchToProps = (dispatch) => ({ dispatch })

HashFromPresentation.propTypes = {
  dispatch: PropTypes.func.isRequired,
  formDocId: PropTypes.string.isRequired,
  activeDocId: PropTypes.string.isRequired,
  requestedDocId: PropTypes.string.isRequired,
}

const HashForm = connect(mapStateToProps, mapDispatchToProps)(HashFromPresentation)

export default HashForm
