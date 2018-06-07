import 'codemirror/mode/javascript/javascript'
import React from 'react'
import PropTypes from 'prop-types'
import CodeMirror from 'react-codemirror'
import * as ts from 'typescript'
import ContentTypes from '../content-types'

export default class SourceEditor extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(doc) {
    doc.compiled = ''
    doc.source = defaultSource
  }

  state = {
    source: defaultSource,
    error: '',
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange(doc => {
      this.setState(doc)
      eval(doc.compiled)
    })
  }

  flipToggle() {
    this.handle.change((doc) => {
      doc.toggled = !doc.toggled
    })
  }

  render() {
    const options = {
      mode: 'javascript',
      theme: 'monokai',
      lineNumbers: true,
    }
    return (
      <div
        onKeyDown={this.keyDown}
        style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          flexGrow: 1,
        }}
      >
        <div style={{
          display: 'flex',
        }}
        >
          <div style={{ flexGrow: 1 }}>{this.renderError()}</div>
          <button onClick={this.compile}>Compile</button>
        </div>
        <CodeMirror
          options={options}
          value={this.state.source}
          onChange={this.onChange}
          style={{
            height: '100%',
          }}
        />
      </div>
    )
  }

  renderError() {
    if (!this.state.error) {
      return null
    }

    return (
      <div>
        {this.state.error}
      </div>
    )
  }

  compile = e => {
    const { source } = this.state

    try {
      const output = this._compileCode(source)
      this.setState({ error: '' })
      this.handle.change(doc => {
        doc.compiled = output
        doc.source = source
      })
    } catch (e) {
      this.setState({ error: e.message })
    }
  }

  onChange = (source, e) => {
    this.setState({ source })
  }

  keyDown = e => {
    e.stopPropagation()
  }

  _compileCode = source =>
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: 'React'
      }
    })
}

ContentTypes.register({
  component: SourceEditor,
  type: 'source-editor',
  name: 'Source Editor',
  icon: 'code',
  resizable: true,
})

const defaultSource =
  `import React from 'react'
import PropTypes from 'prop-types'
import ReactToggle from 'react-toggle'

import ContentTypes from '../content-types'

export default class Toggle extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(doc) {
    doc.toggled = false
  }

  state = {}

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange(doc => {
      this.setState(doc)
    })
  }

  flipToggle = () => {
    this.handle.change(doc => {
      doc.toggled = !doc.toggled
    })
  }

  render() {
    return <ReactToggle checked={this.state.toggled} onChange={this.flipToggle} />
  }
}

ContentTypes.register({
  component: Toggle,
  type: 'toggle',
  name: 'Toggle',
  icon: 'toggle-off',
  resizable: false
})`
