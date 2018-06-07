import React from 'react'
import PropTypes from 'prop-types'

export default class Base extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(doc) {
  }

  constructor(props) {
    super(props)
    this.state = this.constructor.initializeDocument({})
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange(doc => {
      this.setState(doc)
    })
  }

  change(cb) {
    this.handle.change(cb)
  }
}
