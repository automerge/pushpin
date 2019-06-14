import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../../content-types'

export default class ListItem extends React.PureComponent {
  static propTypes = {
    url: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    doc: PropTypes.shape({
      title: PropTypes.string
    })
  }

  static defaultProps = {
    doc: null
  }

  onDragStart = (e) => {
    e.dataTransfer.setData('application/pushpin-url', this.props.url)
    e.dataTransfer.setDragImage(this.badgeRef, 0, 0)
  }

  render = () => {
    const { doc, type } = this.props
    const contentType = ContentTypes.lookup(type)

    // TODO: this should be handled by the content system.
    const icon = contentType ? contentType.icon : 'question'
    const name = contentType ? contentType.name : 'Unknown'

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


ContentTypes.register({
  component: ListItem,
  context: 'list',
  type: 'default',
  name: 'Generic List Item',
  icon: 'question'
})
