import React from 'react'
import ContentTypes from '../../ContentTypes'
import { ContentProps } from '../Content'
import { useDocument } from '../../Hooks'
import Badge from '../Badge'

interface Doc {
  title?: string
}

export default function ListItem(props: ContentProps) {
  const [doc] = useDocument<Doc>(props.hypermergeUrl)

  if (!doc) {
    return null
  }

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('application/pushpin-url', props.url)
  }

  const { type } = props

  const contentType = ContentTypes.lookup({ type, context: 'list' })

  const { icon = 'question', name = `Unidentified type: ${type}` } = contentType || {}

  // TODO: pick background color based on url
  return (
    <div className="DocLink" style={css.listItem}>
      <span draggable onDragStart={onDragStart}>
        <Badge icon={icon} />
      </span>
      <div className="DocLink__title">{doc.title || name}</div>
    </div>
  )
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
