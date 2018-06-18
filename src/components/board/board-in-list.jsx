import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'
import { createDocumentLink } from '../../share-link'

export default class BoardInList extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.string)
  }

  static defaultProps = {
    actions: []
  }

  state = {}

  handleClick = (e) => {
    window.location = createDocumentLink('board', this.props.docId)
  }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  render = () => {
    let actions
    if (this.props.actions.includes('view')) {
      actions = (
        <div className="Actions">
          <span className="Type--secondary">⏎ View</span>
        </div>
      )
    }

    return (
      <div className="DocLink" onClick={this.handleClick}>
        <i className="Badge fa fa-files-o" style={{ background: this.state.backgroundColor }} />
        <div className="DocLink__title">{ this.state.title }</div>
        { actions }
      </div>
    )
  }
}

ContentTypes.register({
  component: BoardInList,
  type: 'board',
  context: 'list',
  name: 'Document Link',
  icon: 'sticky-note',
  unlisted: true,
})
