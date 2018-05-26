import React from 'react'
import PropTypes from 'prop-types'
import Playground from 'component-playground'

/* eslint-disable max-statements */

import 'babel-polyfill'
import { transform } from 'babel-standalone'
import ReactDOM, { render, unmountComponentAtNode } from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import Codemirror from 'react-codemirror2'
import ContentTypes from '../content-types'

const getType = function getType(el) {
  let t = typeof el

  if (Array.isArray(el)) {
    t = 'array'
  } else if (el === null) {
    t = 'null'
  }

  return t
}

const wrapMap = {
  wrapnumber(num) {
    return (<span style={{ color: '#6170d5' }}>{num}</span>)
  },

  wrapstring(str) {
    return (<span style={{ color: '#F2777A' }}>{`'${str}'`}</span>)
  },

  wrapboolean(bool) {
    return (<span style={{ color: '#48A1CF' }}>{bool ? 'true' : 'false'}</span>)
  },

  wraparray(arr) {
    return (
      <span>
        {'['}
        {arr.map((entry, i) => (
          <span key={i}>
            {wrapMap[`wrap${getType(entry)}`](entry)}
            {i !== arr.length - 1 ? ', ' : ''}
          </span>
          ))}
        {']'}
      </span>
    )
  },

  wrapobject(obj) {
    const pairs = []
    let first = true

    for (const key in obj) {
      pairs.push(<span key={key}>
        <span style={{ color: '#8A6BA1' }}>
          {(first ? '' : ', ') + key}
        </span>
        {': '}
        {wrapMap[`wrap${getType(obj[key])}`](obj[key])}
      </span>)

      first = false
    }

    return (<i>{'Object {'}{pairs}{'}'}</i>)
  },

  wrapfunction() {
    return (<i style={{ color: '#48A1CF' }}>function</i>)
  },

  wrapnull() {
    return (<span style={{ color: '#777' }}>null</span>)
  },

  wrapundefined() {
    return (<span style={{ color: '#777' }}>undefined</span>)
  }
}

class EsPreview extends React.Component {
  static propTypes = {
    code: PropTypes.string.isRequired,
    scope: PropTypes.object.isRequired
  };

  _compileCode = () => {
    const { code, scope } = this.props
    return transform(`
      ((${Object.keys(scope).join(',')}) => {
        var list = [];
        var console = { log(...x) {
          list.push({val: x, multipleArgs: x.length !== 1})
        }};
        ${code}
        return list;
      });
    `, { presets: ['es2015', 'react', 'stage-1'] }).code
  };

  _setTimeout = (...args) => {
    clearTimeout(this.timeoutID); //eslint-disable-line
    this.timeoutID = setTimeout.apply(null, args); //eslint-disable-line
  };

  _executeCode = () => {
    const mountNode = this.mount

    try {
      unmountComponentAtNode(mountNode)
    } catch (e) {
      console.error(e); //eslint-disable-line
    }

    try {
      const { scope } = this.props
      const tempScope = []
      Object.keys(scope).forEach((s) => tempScope.push(scope[s]))
      tempScope.push(mountNode)
      const compiledCode = this._compileCode()
      class Comp extends React.Component {
        _createConsoleLine = ({ val, multipleArgs }) => (
          <span style={{ marginRight: '20px' }}>
            {multipleArgs ?
              val.map((y) => this._createConsoleLine([y], false)) :
              wrapMap[`wrap${getType(val[0])}`](val[0])}
          </span>
        );

        render() {
          return (
            <div style={{ padding: 15, fontFamily: 'Consolas, Courier, monospace' }}>
              {
                eval(compiledCode).apply(null, tempScope).map((x, i) => ( //eslint-disable-line
                  <div
                    key={i}
                    style={{
                      borderBottom: '1px solid #ccc',
                      padding: '4px 0'
                    }}
                  >
                    {this._createConsoleLine(x)}
                  </div>
                ))
              }
            </div>
          )
        }
      }
      render(<Comp />, mountNode)
    } catch (err) {
      this._setTimeout(() => {
        render(
          <div className="playgroundError">{err.toString()}</div>,
          mountNode
        )
      }, 500)
    }
  };

  componentDidMount = () => {
    this._executeCode()
  };

  componentDidUpdate = (prevProps) => {
    clearTimeout(this.timeoutID); //eslint-disable-line
    if (this.props.code !== prevProps.code) {
      this._executeCode()
    }
  }

  render() {
    return (
      <div ref={(c) => { this.mount = c }} />
    )
  }
}

const propTypesArray = [{
  key: 'array',
  test: PropTypes.array,
  isRequired: PropTypes.array.isRequired
}, {
  key: 'boolean',
  test: PropTypes.bool,
  isRequired: PropTypes.bool.isRequired
}, {
  key: 'function',
  test: PropTypes.func,
  isRequired: PropTypes.func.isRequired
}, {
  key: 'number',
  test: PropTypes.number,
  isRequired: PropTypes.number.isRequired
}, {
  key: 'object',
  test: PropTypes.object,
  isRequired: PropTypes.array.isRequired
}, {
  key: 'string',
  test: PropTypes.string,
  isRequired: PropTypes.string.isRequired
}, {
  key: 'node',
  test: PropTypes.node,
  isRequired: PropTypes.node.isRequired
}, {
  key: 'element',
  test: PropTypes.element,
  isRequired: PropTypes.element.isRequired
}]

const getReactPropType = (propTypeFunc) => {
  let name = 'custom'
  let isRequired = false

  propTypesArray.some((propType) => {
    if (propTypeFunc === propType.test) {
      name = propType.key
      return true
    }
    if (propTypeFunc === propType.isRequired) {
      name = propType.key
      isRequired = true
      return true
    }
    return false
  })
  return { name, isRequired }
}


class Doc extends React.Component {
  static defaultProps = {
    propDescriptionMap: {},
    ignore: []
  };

  static propTypes = {
    componentClass: PropTypes.func,
    ignore: PropTypes.array,
    propDescriptionMap: PropTypes.object
  };

  render() {
    const propTypes = []
    const {
      componentClass,
      ignore,
      propDescriptionMap
    } = this.props
    for (const propName in componentClass.propTypes) {
      if (ignore.indexOf(propName)) {
        propTypes.push({
          propName,
          type: getReactPropType(componentClass.propTypes[propName]),
          description: propDescriptionMap[propName] || ''
        })
      }
    }

    return (
      <div className="playgroundDocs">
        <ul>
          {
            propTypes.map((propObj) => (
              <li key={propObj.propName}>
                <b>{`${propObj.propName}: `}</b>
                <i>{propObj.type.name}</i>
                {propObj.description && ` - ${propObj.description}`}
                <b>{`${propObj.type.isRequired ? ' required' : ''}`}</b>
              </li>
            ))
          }
        </ul>
      </div>
    )
  }
}

class Preview extends React.Component {
  static defaultProps = {
    previewComponent: 'div'
  };

  static propTypes = {
    code: PropTypes.string.isRequired,
    scope: PropTypes.object.isRequired,
    previewComponent: PropTypes.node,
    noRender: PropTypes.bool,
    context: PropTypes.object
  };

  state = {
    error: null
  };

  _compileCode = () => {
    const { code, context, noRender, scope } = this.props
    const generateContextTypes = (c) => `{ ${Object.keys(c).map((val) =>
      `${val}: PropTypes.any.isRequired`).join(', ')} }`

    const scopeWithProps = { ...scope, PropTypes }

    if (noRender) {
      return transform(`
        ((${Object.keys(scopeWithProps).join(', ')}, mountNode) => {
          class Comp extends React.Component {
            getChildContext() {
              return ${JSON.stringify(context)};
            }
            render() {
              return (
                ${code}
              );
            }
          }
          Comp.childContextTypes = ${generateContextTypes(context)};
          return Comp;
        });
      `, { presets: ['es2015', 'react', 'stage-1'] }).code
    }
    return transform(`
        ((${Object.keys(scopeWithProps).join(',')}, mountNode) => {
          ${code}
        });
      `, { presets: ['es2015', 'react', 'stage-1'] }).code
  };

  _executeCode = () => {
    const mountNode = this.mount
    const { scope, noRender, previewComponent } = this.props

    const scopeWithProps = { ...scope, PropTypes }

    const tempScope = []

    try {
      Object.keys(scopeWithProps).forEach((s) => tempScope.push(scopeWithProps[s]))
      tempScope.push(mountNode)
      const compiledCode = this._compileCode()
      if (noRender) {
        /* eslint-disable no-eval, max-len */
        const Comp = React.createElement(eval(compiledCode)(...tempScope))
        ReactDOMServer.renderToString(React.createElement(previewComponent, {}, Comp))
        render(
          React.createElement(previewComponent, {}, Comp),
          mountNode
        )
      } else {
        eval(compiledCode)(...tempScope)
      }
      /* eslint-enable no-eval, max-len */
      clearTimeout(this.timeoutID)
      this.setState({ error: null })
    } catch (err) {
      const error = err.toString()
      clearTimeout(this.timeoutID) // eslint-disable-line no-undef
      this.timeoutID = setTimeout(() => {
        this.setState({ error })
      }, 500)
    }
  };

  componentDidMount = () => {
    this._executeCode()
  };

  componentDidUpdate = (prevProps) => {
    if (this.props.code !== prevProps.code) {
      this._executeCode()
    }
  };

  render() {
    const { error } = this.state
    return (
      <div>
        {error !== null ?
          <div className="playgroundError">{error}</div> :
          null}
        <div ref={(c) => { this.mount = c }} className="previewArea" />
      </div>
    )
  }
}

class Editor extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    codeText: PropTypes.string,
    external: PropTypes.bool,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
    selectedLines: PropTypes.array,
    style: PropTypes.object,
    theme: PropTypes.string
  };

  componentDidMount = () => {
    const editor = this.editor.editor
    this.highlightSelectedLines(editor, this.props.selectedLines)
  };

  highlightSelectedLines = (editor, selectedLines) => {
    if (Array.isArray(selectedLines)) {
      selectedLines.forEach((lineNumber) =>
        editor.addLineClass(lineNumber, 'wrap', 'CodeMirror-activeline-background'))
    }
  };

  updateCode = (editor, meta, code) => {
    if (!this.props.readOnly && this.props.onChange) {
      this.props.onChange(code)
    }
  };

  render() {
    const {
      className,
      external,
      style,
      codeText,
      theme,
      readOnly
    } = this.props

    const options = {
      mode: 'jsx',
      lineNumbers: false,
      lineWrapping: true,
      smartIndent: false,
      matchBrackets: true,
      theme,
      readOnly
    }

    return (
      <Codemirror
        ref={(c) => { this.editor = c }}
        className={className}
        external={external}
        options={options}
        style={style}
        value={codeText}
        onChange={this.updateCode}
      />
    )
  }
}

class ReactPlayground extends React.Component {
  static defaultProps = {
    theme: 'monokai',
    noRender: true,
    context: {},
    initiallyExpanded: false
  };

  static propTypes = {
    codeText: PropTypes.string.isRequired,
    scope: PropTypes.object.isRequired,
    collapsableCode: PropTypes.bool,
    docClass: PropTypes.func,
    propDescriptionMap: PropTypes.object,
    theme: PropTypes.string,
    selectedLines: PropTypes.array,
    noRender: PropTypes.bool,
    es6Console: PropTypes.bool,
    context: PropTypes.object,
    initiallyExpanded: PropTypes.bool,
    previewComponent: PropTypes.node
  };

  state = {
    code: this.props.codeText,
    expandedCode: this.props.initiallyExpanded,
    external: true
  };

  componentWillReceiveProps = (nextProps) => {
    this.setState({
      code: nextProps.codeText,
      external: true
    })
  };

  _handleCodeChange = (code) => {
    this.setState({
      code,
      external: false
    })
  };

  _toggleCode = () => {
    this.setState({
      expandedCode: !this.state.expandedCode
    })
  };

  render() {
    const { code, external, expandedCode } = this.state
    const {
      collapsableCode,
      context,
      docClass,
      es6Console,
      noRender,
      previewComponent,
      propDescriptionMap,
      scope,
      selectedLines,
      theme } = this.props

    return (
      <div className={`playground${collapsableCode ? ' collapsableCode' : ''}`}>
        {
          docClass ?
            <Doc
              componentClass={docClass}
              propDescriptionMap={propDescriptionMap}
            /> : null
        }
        <div className={`playgroundCode${expandedCode ? ' expandedCode' : ''}`}>
          <Editor
            className="playgroundStage"
            codeText={code}
            external={external}
            onChange={this._handleCodeChange}
            selectedLines={selectedLines}
            theme={theme}
          />
        </div>
        {
          collapsableCode ?
            <div className="playgroundToggleCodeBar">
              <span className="playgroundToggleCodeLink" onClick={this._toggleCode}>
                {expandedCode ? 'collapse' : 'expand'}
              </span>
            </div> : null
        }
        <div className="playgroundPreview">
          {
            es6Console ?
              <EsPreview
                code={code}
                scope={scope}
              /> :
              <Preview
                context={context}
                code={code}
                scope={scope}
                noRender={noRender}
                previewComponent={previewComponent}
              />
          }
        </div>
      </div>
    )
  }
}

/* eslint react/no-multi-comp: off */
class ContentPlayground extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      text: PropTypes.object
    }).isRequired,
    onChange: PropTypes.func.isRequired
  }

  static initializeDocument(onChange) {
    onChange((doc) => {
      doc.text = `class Button extends React.Component {
        state = { counter: 1 };
        
        handleClick = () => {
          this.setState((prevState) => ({
            counter: prevState.counter + 1 
          }));
        };
        
        render() {
          return (
            <button onClick={this.handleClick}>
              {this.state.counter}
            </button>
          );
        }
      }
      ReactDOM.render(<Button/>, mountNode);
      `
    })
  }

  render() {
    return <ReactPlayground codeText={this.props.doc.text} scope={{ React, ReactDOM }} noRender={false} />
  }
}

export default Playground

ContentTypes.register({
  component: ContentPlayground,
  type: 'playground',
  name: 'Playground',
  icon: 'toggle-off'
})
