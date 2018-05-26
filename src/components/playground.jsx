import React from 'react'
import PropTypes from 'prop-types'
import Playground from 'component-playground'

/* eslint-disable max-statements */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/require-default-props */

import 'babel-polyfill'
import { transform } from 'babel-standalone'
import ReactDOM, { render } from 'react-dom'
import ReactDOMServer from 'react-dom/server'
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
      pairs.push((
        <span key={key}>
          <span style={{ color: '#8A6BA1' }}>
            {(first ? '' : ', ') + key}
          </span>
          {': '}
          {wrapMap[`wrap${getType(obj[key])}`](obj[key])}
        </span>
      ))

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
    theme: PropTypes.string,
    selectedLines: PropTypes.array,
    noRender: PropTypes.bool,
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
      noRender,
      previewComponent,
      scope } = this.props

    return (
      <div className={`playground${collapsableCode ? ' collapsableCode' : ''}`}>
        <div className="playgroundPreview">
          <Preview
            context={context}
            code={code}
            scope={scope}
            noRender={noRender}
            previewComponent={previewComponent}
          />
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
