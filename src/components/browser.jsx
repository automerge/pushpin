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
    src: null,
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange(doc => {
      this.setState({ src: doc.src })
    })
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
        }}
        onSubmit={this.go}
      >
        <input
          value={this.state.src}
          onInput={this.setUrl}
          style={{
            margin: 5,
          }}
        />
        <webview
          src={http(this.state.src)}
          style={{
            borderTop: '1px solid #eee'
          }}
        />
      </form>
    )
  }

  go = e => {
    e.preventDefault()
    e.stopPropagation()

    this.handle.change(doc => {
      doc.src = this.state.src
    })
  }

  setUrl = e => {
    e.stopPropagation()

    this.setState({
      src: e.target.value
    })
  }
}

const http = url => (
  url.startsWith('http://')
    ? url
    : `http://${url}`
)

ContentTypes.register({
  component: Browser,
  type: 'browser',
  name: 'Website',
  icon: 'globe',
  resizable: true,
})
