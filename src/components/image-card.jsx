import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import uuid from 'uuid/v4'

import * as Hyperfile from '../hyperfile'
import ContentTypes from '../content-types'

const log = Debug('pushpin:image-card')

export default class ImageCard extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      path: PropTypes.string,
      hyperfile: PropTypes.shape({
        key: PropTypes.string
      })
    }).isRequired,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    log('constructor')
    this.state = { imageContentReady: false }
  }

  static initializeDocument(image, { path }) {
    image.path = path
  }

  componentDidMount() {
    log('componentDidMount')
    this.workImage()
    this.mounted = true
  }

  componentWillUnmount() {
    log('componentWillUnmount')
    this.mounted = false
  }

  componentDidUpdate() {
    log('componentDidUpdate')
    this.workImage()
  }

  workImage() {
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

  render() {
    log('render')
    if (!this.state.imageContentReady) {
      // we used to show some kind of stand-in value but we don't have a design
      // for one that works everywhere the image works, so for now: nothing.
      return null
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
