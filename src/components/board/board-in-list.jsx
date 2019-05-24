import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'

export default class BoardInList extends React.PureComponent {
  static propTypes = {
    url: PropTypes.string.isRequired,
    hypermergeUrl: PropTypes.string.isRequired,
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
  componentWillMount = () => this.refreshHandle(this.props.hypermergeUrl)
  componentWillUnmount = () => this.handle.close()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  renderActions = () => {
    const actionOptions = []

    if (this.props.actions.includes('archive')) {
      actionOptions.push(<span key="archive" className="Type--secondary">⌘+⌫ Archive</span>)
    }

    if (this.props.actions.includes('view')) {
      actionOptions.push(<span key="view" className="Type--secondary">⏎ View</span>)
    }

    if (actionOptions.length > 0) {
      return <div className="Actions">{ actionOptions }</div>
    }

    return null
  }

  render = () => (
    <div draggable="true" onDragStart={this.onDragStart} className="DocLink" onClick={this.handleClick}>
      <i ref={(ref) => { this.badgeRef = ref }} className="Badge fa fa-files-o" style={{ background: this.state.backgroundColor }} />
      <div className="DocLink__title">{ this.state.title }</div>
      { this.renderActions() }
    </div>
  )
}

ContentTypes.register({
  component: BoardInList,
  type: 'board',
  context: 'list',
  name: 'Document Link',
  icon: 'sticky-note',
  unlisted: true,
})
