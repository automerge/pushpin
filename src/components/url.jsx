import React from 'react'
import PropTypes from 'prop-types'
import Unfluff from 'unfluff'
import * as Hyperfile from '../hyperfile'

import ContentTypes from '../content-types'
import Content from './content'
import { createDocumentLink } from '../share-link'

export default class Url extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument = (urlDoc, { url = '' }) => {
    urlDoc.url = url
  }

  state = { urlInput: '' }

  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.docId)
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
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
        doc.url = this.state.urlInput
      })
    }
  }

  refreshContent = (doc) => {
    fetch(doc.url).then((response) => {
      response.text().then((text) => {
        const data = Unfluff(text)
        this.handle.change((doc) => {
          const removeEmpty = (obj) =>
            Object.entries(obj).forEach(([key, val]) => {
              if (val && typeof val === 'object') {
                removeEmpty(val)
              } else if (val == null) {
                delete obj[key]
              }
            })
          if (data.image) {
            const imageCanonicalUrl = new URL(data.image, this.state.url)
            fetch(imageCanonicalUrl).then((response => {
              response.arrayBuffer().then((buffer) => {
                // we need to convert the ArrayBuffer into a Uint8Buffer
                Hyperfile.writeBuffer(Buffer.from(buffer), (err, hyperfileId) => {
                  if (err) {
                    console.log(err)
                    return
                  }

                  this.handle.change((doc) => {
                    doc.imageHyperfileUrl = `hyperfile://${hyperfileId}`
                  })
                })
              })
            }))
          }
          removeEmpty(data)
          doc.data = data
        })
      })
    })
  }

  render = () => {
    const { data, url } = this.state
    if (!url) {
      return (
        <div style={css.urlCard}>
          <input
            type="text"
            style={css.input}
            value={this.state.urlInput}
            onChange={this.onInputChange}
            onKeyDown={this.onKeyDown}
            placeholder="Enter a URL..."
          />
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
    // I'm leaving this in here for a while to help
    // debug any surprising links we come across more easily.
    console.log(this.state)

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
  component: Url,
  type: 'url',
  name: 'URL',
  icon: 'chain',
  resizable: true
})

const css = {
  urlCard: {
    display: 'flex',
    maxWidth: '250px',
    flexDirection: 'column',
    backgroundColor: 'white',
    overflow: 'auto',
    position: 'relative',
    padding: 12,
    flex: '1 1 auto'
  },
  img: {
    maxHeight: '250px',
    display: 'block',
    objectFit: 'cover',
    height: '50%',
    marginBottom: 12,
    marginLeft: -12,
    marginTop: -12,
    marginRight: -12,
    minHeight: 96
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
  }
}
