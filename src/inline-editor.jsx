import React from 'react'
import { connect } from 'react-redux'
import ReactMarkdown from 'react-markdown'
import { Editor } from 'slate-react'
import Plain from 'slate-plain-serializer'
import Prism from 'prismjs'

import { maybeInlineFile } from './model'
import { CARD_TEXT_CHANGED, CARD_UNIQUELY_SELECTED, CARD_TEXT_RESIZED, CARD_DELETED } from './action-types'
import log from './log'

// Add Markdown syntax to Prism.
Prism.languages.markdown = Prism.languages.extend("markup",{})
Prism.languages.insertBefore("markdown","prolog",{
  blockquote: {
    pattern:/^>(?:[\t ]*>)*/m,
    alias:"punctuation"
  },
  code:[
    {
      pattern:/^(?: {4}|\t).+/m,
      alias:"keyword"
    }, {
      pattern:/``.+?``|`[^`\n]+`/,
      alias:"keyword"
    }
  ],
  title:[
    {
      pattern:/\w+.*(?:\r?\n|\r)(?:==+|--+)/,
      alias:"important",
      inside: {punctuation:/==+$|--+$/}
    },
    {
      pattern:/(^\s*)#+.+/m,
      lookbehind:!0,
      alias:"important",
      inside: {punctuation:/^#+|#+$/}
    }
  ],
  hr: {
    pattern:/(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m,
    lookbehind:!0,
    alias:"punctuation"
  },
  list: {
    pattern:/(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
    lookbehind:!0,
    alias:"punctuation"
  },
  "url-reference": {
    pattern:/!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
    inside:{variable:{pattern:/^(!?\[)[^\]]+/ ,lookbehind:!0}, string:/(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,punctuation:/^[\[\]!:]|[<>]/},
    alias:"url"
  },
  bold: {
    pattern:/(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind:!0,
    inside:{punctuation:/^\*\*|^__|\*\*$|__$/}
  },
  italic: {
    pattern:/(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind:!0,
    inside:{punctuation:/^[*_]|[*_]$/}
  },
  url: {
    pattern:/!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
    inside:{variable:{pattern:/(!?\[)[^\]]+(?=\]$)/,lookbehind:!0},string:{pattern:/"(?:\\.|[^"\\])*"(?=\)$)/}}
  }
})
Prism.languages.markdown.bold.inside.url=Prism.util.clone(Prism.languages.markdown.url)
Prism.languages.markdown.italic.inside.url=Prism.util.clone(Prism.languages.markdown.url)
Prism.languages.markdown.bold.inside.italic=Prism.util.clone(Prism.languages.markdown.italic)
Prism.languages.markdown.italic.inside.bold=Prism.util.clone(Prism.languages.markdown.bold)

class InlineEditorPresentation extends React.Component {
  constructor(props) {
    log('editor.constructor')
    super(props)
    this.state = {value: Plain.deserialize(props.text)}
    this.lastLocalHeight = null
  }

  componentDidMount() {
    log('editor.didMount')
    this.ensureFocus()
    this.checkHeight()
  }

  componentDidUpdate() {
    log('editor.didUpdate')
    this.ensureFocus()
    this.checkHeight()
  }

  ensureFocus() {
    if (this.props.selected && !this.state.value.isFocused) {
      log('editor.forceFocus')
      const newValue = this.state.value.change().focus().value
      this.setState({value: newValue})
    }
  }

  checkHeight() {
    const localHeight = this.props.selected ? this.refs.editorWrapper.clientHeight : null
    if (this.lastLocalHeight != localHeight) {
      this.props.onLocalHeight(localHeight)
      this.lastLocalHeight = localHeight
    }

    if (!this.props.selected) {
      const height = this.refs.renderer.clientHeight
      if (this.props.cardHeight != height) {
        this.props.onTextResized(this.props.cardId, height)
      }
    }
  }

  onKeyDown(e, change) {
    log('editor.onKeyDown')

    if (e.key !== 'Backspace') {
      return
    }
    const text = Plain.serialize(this.state.value)
    if (text != '') {
      return
    }
    e.preventDefault()
    this.props.onDeleted(this.props.cardId)
  }

  componentWillReceiveProps(props) {
    log('editor.willReceiveProps')

    if (this.props.selected && !props.selected) {
      this.props.onTextChanged(this.props.cardId, Plain.serialize(this.state.value))
    } else if (!props.selected) {
      this.setState({value: Plain.deserialize(props.text)})
    }
  }

  onChange({ value }) {
    log('editor.onChange')
    this.setState({value: value})
  }

  renderMark(props) {
    log('editor.renderMark', props)

    const { children, mark } = props
    switch (mark.type) {
      case 'bold':
        return <strong>{children}</strong>
      case 'code':
        return <code>{children}</code>
      case 'italic':
        return <em>{children}</em>
      case 'underlined':
        return <u>{children}</u>
      case 'title': {
        return (
          <span className='title'>
            {children}
          </span>
        )
      }
      case 'punctuation': {
        return <span className='punctuation'>{children}</span>
      }
      case 'list': {
        return (
          <span className='list'>
            {children}
          </span>
        )
      }
      default: {
        throw new Error(`Did not expact type '${mark.type}'`)
      }
    }
  }

  decorateNode(node) {
    log('editor.decorateNode', node.toJS())

    if (node.object != 'block') return

    const string = node.text
    const texts = node.getTexts().toArray()
    const grammar = Prism.languages.markdown
    const tokens = Prism.tokenize(string, grammar)
    const decorations = []
    let startText = texts.shift()
    let endText = startText
    let startOffset = 0
    let endOffset = 0
    let start = 0

    function getLength(token) {
      if (typeof token == 'string') {
        return token.length
      } else if (typeof token.content == 'string') {
        return token.content.length
      } else {
        return token.content.reduce((l, t) => l + getLength(t), 0)
      }
    }

    for (const token of tokens) {
      startText = endText
      startOffset = endOffset

      const length = getLength(token)
      const end = start + length

      let available = startText.text.length - startOffset
      let remaining = length

      endOffset = startOffset + remaining

      while (available < remaining) {
        endText = texts.shift()
        remaining = length - available
        available = endText.text.length
        endOffset = remaining
      }

      if (typeof token != 'string') {
        const range = {
          anchorKey: startText.key,
          anchorOffset: startOffset,
          focusKey: endText.key,
          focusOffset: endOffset,
          marks: [{ type: token.type }],
        }

        decorations.push(range)
      }

      start = end
    }

    return decorations
  }

  render() {
    log('editor.render')

    if (this.props.selected) {
      return (
        <div
          className={'editorWrapper'}
          ref={'editorWrapper'}
        >
          <Editor
            value={this.state.value}
            onChange={this.onChange.bind(this)}
            onKeyDown={this.onKeyDown.bind(this)}
            renderMark={this.renderMark.bind(this)}
            decorateNode={this.decorateNode.bind(this)}
            ref={'editor'}
          />
        </div>
      )
    } else {
      return (
        <div
          className={'renderer'}
          ref={'renderer'}
        >
          <ReactMarkdown
            source={this.props.text}
          />
        </div>
      )
    }
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onTextChanged: (id, text) => {
      log('editor.onTextChanged')
      dispatch({type: CARD_TEXT_CHANGED, id: id, text: text })
      maybeInlineFile(dispatch, id, text)
    },
    onSelected: (id) => {
      log('editor.onSelected')
      dispatch({type: CARD_UNIQUELY_SELECTED, id: id})
    },
    onDeleted: (id) => {
      log('editor.onDeleted')
      dispatch({type: CARD_DELETED, id: id})
    },
    onTextResized: (id, height) => {
      log('editor.onTextResized')
      dispatch({type: CARD_TEXT_RESIZED, id: id, height: height})
    },
  }
}

const InlineEditor = connect(null, mapDispatchToProps)(InlineEditorPresentation)

export default InlineEditor
