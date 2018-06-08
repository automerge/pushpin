import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import uuid from 'uuid/v4'

import * as Hyperfile from '../hyperfile'
import ContentTypes from '../content-types'

const log = Debug('pushpin:image-card')

export default class ImageCard extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument = (image, { path }) => {
    image.path = path
  }

  state = { imageContentReady: false }

  componentDidMount = () => {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => this.setState({ ...doc, path: doc.path }))

    log('componentDidMount')
    this.workImage()
    this.mounted = true
  }

  componentWillUnmount = () => {
    log('componentWillUnmount')
    this.mounted = false
  }

  componentDidUpdate = () => {
    log('componentDidUpdate')
    this.workImage()
  }

  workImage = () => {
    if (this.state.path) {
      this.uploadImage()
    }
  }

  uploadImage = () => {
    const fileId = uuid()
    Hyperfile.writePath(fileId, this.state.path, (err, hyperfile) => {
      if (err) {
        log(err)
      }

      this.handle.change(d => {
        delete d.path
        d.hyperfile = hyperfile
      })
    })
  }

  render = () => {
    log('render')
    if (!this.state.hyperfile) {
      // we used to show some kind of stand-in value but we don't have a design
      // for one that works everywhere the image works, so for now: nothing.
      return null
    }

    const fileUri =  `hyperfile://${this.state.hyperfile.fileId}/${this.state.hyperfile.key}`
    return <img className="image" alt="" src={fileUri} />
  }
}

ContentTypes.register({
  component: ImageCard,
  type: 'image',
  name: 'Image',
  icon: 'image'
})
