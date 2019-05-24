import React from 'react'
import PropTypes from 'prop-types'
import Unfluff from 'unfluff'
import Debug from 'debug'

import * as Hyperfile from '../hyperfile'
import ContentTypes from '../content-types'

const log = Debug('pushpin:url')

const removeEmpty = (obj) =>
  Object.entries(obj).forEach(([key, val]) => {
    if (val && typeof val === 'object') {
      removeEmpty(val)
    } else if (val == null) {
      delete obj[key]
    }
  })

export default class UrlContent extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired
  }

  static initializeDocument = (urlDoc, { url = '' }) => {
    urlDoc.url = url
  }

  static minWidth = 9
  static minHeight = 9
  static defaultWidth = 12
  // static defaultHeight = 18
  static maxWidth = 24
  static maxHeight = 32

  state = { urlInput: '' }

  componentWillMount = () => this.refreshHandle(this.props.hypermergeUrl)
  componentWillUnmount = () => this.handle.close()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }


  onChange = (doc) => {
    if (doc.url && !doc.data) {
      this.refreshContent(doc)
    }
    this.setState({ ...doc })
  }

  onInputChange = (e) => {
    this.setState({
      urlInput: e.target.value
    })
  }

  onKeyDown = (e) => {
    e.stopPropagation()

    if (e.key === 'Enter') {
      e.preventDefault()
      this.handle.change((doc) => {
        const input = this.state.urlInput
        const url = (input.indexOf('://') === -1) ? `http://${input}` : input
        doc.url = url
      })
    }
  }

  onPaste = (e) => {
    e.stopPropagation()
  }

  refreshContent = (doc) => {
    fetch(doc.url).then((response) => {
      response.text().then((text) => {
        const data = Unfluff(text)
        this.handle.change((doc) => {
          if (data.image) {
            this.uploadImage(data)
          }
          removeEmpty(data)
          doc.data = data
        })
      })
    }).catch((reason) => {
      log('refreshContent.caught', reason)
      this.handle.change((doc) => {
        doc.data = { error: reason }
      })
    })
  }

  uploadImage = (data) => {
    const imageCanonicalUrl = new URL(data.image, this.state.url)
    fetch(imageCanonicalUrl).then((response => {
      response.arrayBuffer().then((buffer) => {
        // we need to convert the ArrayBuffer into a Uint8Buffer
        Hyperfile.writeBuffer(Buffer.from(buffer), (err, hyperfileUrl) => {
          if (err) {
            throw new Error(err)
          }

          this.handle.change((doc) => {
            doc.imageHyperfileUrl = hyperfileUrl
          })
        })
      })
    }))
  }

  render = () => {
    const { data, url } = this.state
    if (!url) {
      return (
        <div style={css.urlCard}>
          <div style={css.inputGroup}>
            <i style={css.inputGroupIcon} className="fa fa-link" />
            <input
              autoFocus
              type="text"
              style={css.urlInput}
              value={this.state.urlInput}
              onChange={this.onInputChange}
              onKeyDown={this.onKeyDown}
              onPaste={this.onPaste}
              placeholder="Enter a URL..."
            />
          </div>
        </div>
      )
    }
    if (!data) {
      return (
        <div style={css.urlCard}>
          <p style={css.title}>Fetching...</p>
          <p style={css.link}><a style={css.titleAnchor} href={url}>{url}</a></p>
        </div>
      )
    }
    return (
      <div style={css.urlCard}>
        {this.state.imageHyperfileUrl ?
          <img
            style={css.img}
            src={this.state.imageHyperfileUrl}
            alt={data.description}
          />
          : null }
        <p style={css.title}>
          <a style={css.titleAnchor} href={url}>{data.title}</a>
        </p>
        { data.error ? <p style={css.error}>(URL did not load.)</p> : null }
        <p style={css.text}>{data.description}</p>
        <p style={css.link}>
          <a style={css.titleAnchor} href={data.canonicalLink || url}>
            {data.canonicalLink || url}
          </a>
        </p>
      </div>
    )
  }
}

ContentTypes.register({
  component: UrlContent,
  type: 'url',
  name: 'URL',
  icon: 'chain',
  resizable: true
})

const css = {
  urlCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    overflow: 'auto',
    position: 'relative',
    padding: 12,
    flex: '1 1 auto',
    border: '1px solid var(--colorPaleGrey)'
  },
  img: {
    WebkitUserDrag: 'none',
    height: '192px',
    display: 'block',
    objectFit: 'cover',
    marginBottom: 12,
    marginLeft: -12,
    marginTop: -12,
    marginRight: -12,
  },
  title: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '18px',
    lineHeight: '24px',
    color: 'black',
    textDecoration: 'none',
    marginBottom: 12,
    maxHeight: 72,
    overflowY: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 0
  },
  titleAnchor: {
    WebkitUserDrag: 'none',
    color: 'inherit',
    textDecoration: 'none'
  },
  text: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '12px',
    lineHeight: '16px',
    color: '#637389',
    marginBottom: 12,
    flex: 1,
  },
  error: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '10px',
    lineHeight: 1.2,
    color: '#637389'
  },
  link: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '10px',
    lineHeight: 1.2,
    color: '#637389',
    justifySelf: 'flex-end',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 0
  },
  urlInput: {
    backgroundColor: 'white',
    padding: '4px',
    height: 20,
    flex: 1,
    width: 'calc(100% -32px)'
  },
  inputGroup: {
    display: 'flex',
    flex: '1 0 auto',
    alignItems: 'center'
  },
  inputGroupIcon: {
    fontSize: 24,
    flex: 'none',
    color: '#637389'
  }
}
