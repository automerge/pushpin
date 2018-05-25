import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import uuid from 'uuid/v4'

import * as Hyperfile from '../hyperfile'
import ContentTypes from '../content-types'

const log = Debug('pushpin:image-card')

export default class ImageCard extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    log('constructor')
    this.state = { imageContentReady: false }
  }

  static initializeDocument(onChange, { path, buffer }) {
    onChange((d) => {
      d.path = path
    })
  }

  componentDidMount() {
    this.mounted = true

    if (this.props.doc.path) {
      this.uploadImage()
    }

    if (this.props.doc.hyperfile) {
      this.fetchImage()
    }
  }

  componentWillUpdate() {
    if (this.props.doc.path) {
      this.uploadImage()
    }

    if (this.props.doc.hyperfile) {
      this.fetchImage()
    }
  }

  uploadImage() {
    const fileId = uuid()
    Hyperfile.writePath(fileId, this.props.doc.path, (err, hyperfile) => {
      if (err) {
        log(err)
      }

      this.props.onChange(d => {
        delete d.path
        d.hyperfile = hyperfile
      })
    })
  }

  fetchImage() {
    Hyperfile.fetch(this.props.doc.hyperfile, (error, imagePath) => {
      if (error) {
        log(error)
      }

      // This card may have been deleted by the time fetchImage returns,
      // so check here to see if the component is still mounted
      if (!this.mounted) {
        return
      }

      this.setState({ imageContentReady: true, imagePath: `../${imagePath}` })
    })
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    log('render')
    if (!this.state.imageContentReady) {
      return <p>Fetching {this.props.doc.path}</p>
      // we should put useful stand-in content here, like alt-text or a caption
    }
    return <img className="image" alt="" src={this.state.imagePath} />
  }
}

ContentTypes.register({
  component: ImageCard,
  type: 'image',
  name: 'Image',
  icon: 'image'
})
