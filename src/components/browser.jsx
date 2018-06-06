import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'

export default class Browser extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
  }

  static initializeDocument(doc) {
    doc.src = 'https://google.com'
    doc.title = 'Empty'
    doc.backs = []
    doc.forwards = []
  }

  handle = null
  state = {
    input: '',
    title: 'Empty',
    src: '',
    backs: [],
    forwards: [],
  }

  componentDidMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange(doc => {
      this.setState(doc)
      this.setState({ input: doc.src })
    })

    this.web.addEventListener('load-commit', this.navigated)
    this.web.addEventListener('page-title-updated', this.setTitle)
  }

  render() {
    const { state } = this

    return (
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #ddd',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
          minWidth: 200,
          minHeight: 200,
          flexGrow: 1,
        }}
      >
        <div style={{ textAlign: 'center', padding: 2 }}>{state.title}</div>
        <div
          style={{
            padding: 5,
            borderBottom: '1px solid #eee',
            display: 'flex',
          }}
        >
          <Button icon="arrow-left" onClick={this.back} disabled={!state.backs.length} />
          <Button icon="arrow-right" onClick={this.forward} disabled={!state.forwards.length} />
          <Button icon="refresh" onClick={this.reload} />
          <input
            value={state.input}
            onInput={this.setUrl}
            onKeyDown={this.keyDown}
            style={{
              flexGrow: 1,
            }}
          />
        </div>
        <webview
          ref={web => { this.web = web }}
          src={http(state.src)}
          autosize="autosize"
          useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"
        />
      </div>
    )
  }

  reload = e => {
    this.web.reload()
  }

  back = e => {
    this.handle.change(doc => {
      if (doc.backs.length) {
        doc.forwards.push(doc.src)
        doc.src = doc.backs.pop()
      }
    })
  }

  forward = e => {
    this.handle.change(doc => {
      if (doc.forwards.length) {
        doc.backs.push(doc.src)
        doc.src = doc.forwards.pop()
      }
    })
  }

  navigated = e => {
    if (!e.isMainFrame) { return }

    this.handle.change(doc => {
      if (doc.src !== e.url) {
        doc.backs.push(doc.src)
        doc.forwards = []
        doc.src = e.url
      }
    })
  }

  go = () => {
    this.handle.change(doc => {
      doc.backs.push(doc.src)
      doc.forwards = []
      doc.src = this.state.input
    })
  }

  setTitle = e => {
    this.handle.change(doc => {
      doc.title = e.title
    })
  }

  setUrl = e => {
    e.stopPropagation()

    this.setState({
      input: e.target.value
    })
  }

  keyDown = e => {
    e.stopPropagation()

    if (e.key === 'Enter') {
      e.preventDefault()
      this.go()
    }
  }
}

const http = url => (
  url.startsWith('http')
    ? url
    : `http://${url}`
)

const Button = ({ icon, ...props }) => (
  <button
    style={{
      marginRight: 3,
      WebkitAppearance: 'none',
      outline: 0,
      backgroundColor: 'transparent',
      border: '1px solid #eee',
      borderRadius: 3,
      cursor: 'pointer',
    }}
    {...props}
  >
    <i className={`fa fa-${icon}`} />
  </button>
)

ContentTypes.register({
  component: Browser,
  type: 'browser',
  name: 'Browser',
  icon: 'globe',
  resizable: true,
})
