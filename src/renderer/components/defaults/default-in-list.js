import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'

export default class ListItem extends React.PureComponent {
  static propTypes = {
    url: PropTypes.string.isRequired,
    hypermergeUrl: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }

  state = { doc: {} }

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
    this.setState({ doc })
  }

  onDragStart = (e) => {
    e.dataTransfer.setData('application/pushpin-url', this.props.url)
    e.dataTransfer.setDragImage(this.badgeRef, 0, 0)
  }

  render = () => {
    const { type } = this.props
    const { doc } = this.state

    // this context: default business is wrong wrong wrong
    const contentType = ContentTypes.lookup({ type })
    console.log(contentType)
    const { icon = 'question', name = `Unidentified type: ${type}` } = contentType || {}

    // TODO: pick background color based on url
    return (
      <div style={css.listItem} draggable="true" onDragStart={this.onDragStart} className="DocLink" onClick={this.handleClick}>
        <i ref={(ref) => { this.badgeRef = ref }} className={`Badge fa fa-${icon}`} />
        <div className="DocLink__title">{(doc && doc.title) ? doc.title : name}</div>
      </div>
    )
  }
}

const css = {
  listItem: {
    padding: '5px',
    border: '1px solid #eaeaea',
    borderRadius: '4px'
  }
}


ContentTypes.registerDefault({
  component: ListItem,
  context: 'list'
})
