import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'

export default class BoardInList extends React.PureComponent {
  static propTypes = {
    url: PropTypes.string.isRequired,
    docId: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(PropTypes.string)
  }

  static defaultProps = {
    actions: []
  }

  state = {}

  handleClick = (e) => {
    window.location = this.props.url
  }

  onDragStart = (e) => {
    e.dataTransfer.setData('application/pushpin-url', this.props.url)
    e.dataTransfer.setDragImage(this.badgeRef, 0, 0)
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
      <div draggable="true" onDragStart={this.onDragStart} className="DocLink" onClick={this.handleClick}>
        <i ref={(ref) => { this.badgeRef = ref }} className="Badge fa fa-files-o" style={{ background: this.state.backgroundColor }} />
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
