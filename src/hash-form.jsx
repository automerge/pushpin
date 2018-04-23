import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { FORM_CHANGED, FORM_SUBMITTED } from './action-types';

const hashFormPresentation = ({ formDocId, activeDocId, requestedDocId, onChange, onSubmit }) => {
  return (
    <div id='hashForm'>
      <form onSubmit={onSubmit}>
        <input
           type='text'
           value={formDocId}
           onChange={onChange}
           className={classNames(activeDocId === requestedDocId ? 'loaded' : 'loading')}
        />
      </form>
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    activeDocId: state.activeDocId,
    formDocId: state.formDocId,
    requestedDocId: state.requestedDocId
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onChange: (event) => {
      dispatch({type: FORM_CHANGED, docId: event.target.value})
    },
    onSubmit: (event) => {
      event.preventDefault()
      dispatch({type: FORM_SUBMITTED})
    }
  }
}

const HashForm = connect(mapStateToProps, mapDispatchToProps)(hashFormPresentation)

export default HashForm
