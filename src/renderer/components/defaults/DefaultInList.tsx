import React from 'react'
import { Handle } from 'hypermerge'
import ContentTypes from '../../ContentTypes'
import { ContentProps } from '../Content'

interface Doc {
  title?: string
}

interface State {
  doc?: Doc
}

export default class ListItem extends React.PureComponent<ContentProps, State> {
  handle?: Handle<Doc>
  state: State = {}

  componentDidMount() {
    this.handle = window.repo.watch(this.props.hypermergeUrl, this.onChange)
  }

  componentWillUnmount() {
    this.handle && this.handle.close()
    delete this.handle
  }

  onChange = (doc: Doc) => {
    this.setState({ doc })
  }

  onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/pushpin-url', this.props.url)
  }

  render() {
    const { type } = this.props
    const { doc } = this.state
    if (!doc) {
      return null
    }

    // this context: default business is wrong wrong wrong
    const contentType = ContentTypes.lookup({ type, context: 'list' })

    const { icon = 'question', name = `Unidentified type: ${type}` } = contentType || {}

    // TODO: pick background color based on url
    return (
      <div className="DocLink" style={css.listItem}>
        <i draggable onDragStart={this.onDragStart} className={`Badge fa fa-${icon}`} />
        <div className="DocLink__title">{doc && doc.title ? doc.title : name}</div>
      </div>
    )
  }
}

const css = {
  listItem: {
    padding: '5px',
    border: '1px solid #eaeaea',
    borderRadius: '4px',
  },
}

ContentTypes.registerDefault({
  component: ListItem,
  context: 'list',
})
