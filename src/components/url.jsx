import React from 'react'
import PropTypes from 'prop-types'
import Unfluff from 'unfluff'

import ContentTypes from '../content-types'

export default class Url extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument = (urlDoc, { url = '' }) => {
    urlDoc.url = url
    urlDoc.loaded = false // todo: use timestamps
  }

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
    if (doc.url && !doc.loaded) {
      this.refreshContent(doc)
    }
    this.setState({ ...doc })
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
          removeEmpty(data)
          doc.data = data
          doc.loaded = true
        })
      })
    })
  }

  render = () => {
    const { data, url } = this.state
    console.log(data)
    if (!data) {
      return (
        <div>
          <h3><a href={url}>{url}</a></h3>
        </div>
      )
    }

    return (
      <div style={css.urlCard}>
        <img style={css.img} src={data.image} />
        <a style={css.title} href={url}>{data.title}</a>
        <p style={css.text}>{data.text}</p>
        <a style={css.link} href={data.canonicalLink}>{data.canonicalLink}</a>
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
    backgroundColor: 'white',
    width: '100%',
    overflow: 'auto',
    height: '100%',
    margin: '8px',
  },
  img: {
    objectFit: 'cover',
    height: '50%',
    width: '100%',
  },
  title: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '18px',
    lineHeight: 1.33,
    color: 'black',
    textDecoration: 'none',
  },
  text: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '12px',
    lineHeight: 1.33,
    color: '#637389'
  },
  link: {
    fontFamily: 'IBM Plex Sans',
    fontSize: '10px',
    lineHeight: 1.6,
    color: '#637389'
  }
}
