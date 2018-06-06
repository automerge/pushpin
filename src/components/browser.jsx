import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'

export default class Browser extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
  }

  static initializeDocument(doc) {
    doc.src = 'https://google.com'
  }

  handle = null
  state = {
    src: '',
    input: '',
  }

  componentDidMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange(doc => {
      this.setState({ src: doc.src, input: doc.src })
    })

    this.web.addEventListener('load-commit', this.navigated)
  }


  render() {
    return (
      <form
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          minWidth: 200,
          minHeight: 200,
        }}
        onSubmit={this.go}
      >
        <div
          style={{
            padding: 5,
            borderBottom: '1px solid #eee',
            display: 'flex',
          }}
        >
          <Button icon="arrow-left" onClick={this.back} />
          <Button icon="arrow-right" onClick={this.forward} />
          <Button icon="refresh" onClick={this.reload} />
          <input
            value={this.state.input}
            onInput={this.setUrl}
            onKeyDown={this.stop}
            style={{
              flexGrow: 1,
            }}
          />
        </div>
        <webview
          ref={web => { this.web = web }}
          src={http(this.state.src)}
        />
      </form>
    )
  }

  reload = e => {
    this.web.reload()
  }

  back = e => {
    this.web.goBack()
  }

  forward = e => {
    this.web.goForward()
  }

  navigated = e => {
    this.setState({ src: e.url })

    this.handle.change(doc => {
      doc.src = e.url
    })
  }

  go = e => {
    e.preventDefault()
    e.stopPropagation()

    this.handle.change(doc => {
      doc.src = this.state.input
    })
  }

  setUrl = e => {
    e.stopPropagation()

    this.setState({
      input: e.target.value
    })
  }

  stop = e => {
    e.stopPropagation()
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
  name: 'Website',
  icon: 'globe',
  resizable: true,
})

