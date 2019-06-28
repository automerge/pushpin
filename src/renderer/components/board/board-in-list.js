import React from 'react'
import PropTypes from 'prop-types'
import TitleEditor from '../TitleEditor'

export default class BoardInList extends React.PureComponent {
  static propTypes = {
    url: PropTypes.string.isRequired,
    hypermergeUrl: PropTypes.string.isRequired,
    editable: PropTypes.bool
  }

  static defaultProps = {
    editable: false
  }

  state = {}

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

  render = () => (
    <div draggable="true" onDragStart={this.onDragStart} className="DocLink" onClick={this.handleClick}>
      <i ref={(ref) => { this.badgeRef = ref }} className="Badge fa fa-files-o" style={{ background: this.state.backgroundColor }} />
      {this.props.editable ? (
        <TitleEditor url={this.props.hypermergeUrl} preventDrag />
      ) : (
          <div className="DocLink__title">{this.state.title}</div>
        )}
    </div>
  )
}
