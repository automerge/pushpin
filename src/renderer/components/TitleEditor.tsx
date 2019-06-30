import React from 'react'
import withDocument from './withDocument'

interface Doc {
  title?: string
}

interface Props {
  placeholder: string,
  doc: Doc
  change: (cb: (doc: Doc) => void) => void
  preventDrag: boolean
}

import './TitleEditor.css'

// `preventDrag` is a little kludgey, but is required to enable text selection if the
// input is in a draggable element.
class TitleEditor extends React.Component<Props> {
  static initializeDocument = (doc: Doc) => {
    doc.title = undefined
  }

  static defaultProps = {
    placeholder: '',
    preventDrag: false
  }

  input: React.RefObject<HTMLInputElement> = React.createRef()

  shouldComponentUpdate(nextProps: Props) {
    return nextProps.doc.title !== this.props.doc.title
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      this.input && this.input.current && this.input.current.blur()
    }
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.change((doc: Doc) => {
      doc.title = e.target.value
    })
  }

  // Required to prevent draggable parent elements from blowing away edit capability.
  onDragStart = (e: React.DragEvent) => {
    if (this.props.preventDrag) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  render = () => {
    const { doc, preventDrag } = this.props
    return (
      <input
        ref={this.input}
        draggable={preventDrag}
        onDragStart={this.onDragStart}
        type="text"
        className="TitleEditor"
        value={doc.title}
        placeholder={this.props.placeholder}
        onKeyDown={this.onKeyDown}
        onChange={this.onChange}
      />
    )
  }
}

export default withDocument(TitleEditor, TitleEditor.initializeDocument)
