import React from 'react'
import PropTypes from 'prop-types'
import Playground from 'component-playground'
import Automerge from 'automerge'

/* eslint-disable max-statements */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/require-default-props */

import 'babel-polyfill'
import { transform } from 'babel-standalone'
import ReactDOM, { render } from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import ContentTypes from '../content-types'

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
    noRender: true,
    context: {}
  };

  static propTypes = {
    codeText: PropTypes.string.isRequired,
    scope: PropTypes.object.isRequired,
    noRender: PropTypes.bool,
    context: PropTypes.object,
    previewComponent: PropTypes.node
  };

  state = {
    code: this.props.codeText,
  };

  componentWillReceiveProps = (nextProps) => {
    this.setState({
      code: nextProps.codeText,
    })
  };

  _handleCodeChange = (code) => {
    this.setState({
      code
    })
  };

  render() {
    const { code } = this.state
    const {
      context,
      noRender,
      previewComponent,
      scope } = this.props

    return (
      <div className="playground">
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
    const defaultText = `class Button extends React.Component {
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

    onChange((doc) => {
      doc.text = new Automerge.Text()
      doc.text.insertAt(0, ...defaultText.split(''))
    })
  }

  render() {
    return (
      <div>
        <ReactPlayground
          codeText={this.props.doc.text.join('')}
          scope={{ React, ReactDOM }}
          noRender={false}
        />
      </div>
    )
  }
}

export default Playground

ContentTypes.register({
  component: ContentPlayground,
  type: 'playground',
  name: 'Playground',
  icon: 'toggle-off'
})
