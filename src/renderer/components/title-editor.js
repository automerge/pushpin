import React from 'react'
import PropTypes from 'prop-types'
import withDocument from './with-document'

// `preventDrag` is a little kludgey, but is required to enable text selection if the
// input is in a draggable element.
class TitleEditor extends React.PureComponent {
  static initializeDocument = (doc) => {
    doc.title = null
  }

  static propTypes = {
    placeholder: PropTypes.string,
    doc: PropTypes.shape({
      title: PropTypes.string
    }).isRequired,
    change: PropTypes.func.isRequired,
    preventDrag: PropTypes.bool
  }

  static defaultProps = {
    placeholder: '',
    preventDrag: false
  }

  input = React.createRef()

  onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      this.input.current.blur()
    }
  }

  onChange = (e) => {
    this.props.change((doc) => {
      doc.title = e.target.value
    })
  }

  // Required to prevent draggable parent elements from blowing away edit capability.
  onDragStart = (e) => {
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
