import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import ContentTypes from '../content-types'

const log = Debug('pushpin:image-card')

export default class ImageContent extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument = (image, { hyperfileId }) => {
    image.hyperfileId = hyperfileId
  }

  static minWidth = 3
  static minHeight = 3
  static defaultWidth = 18
  // no default height to allow it to grow
  // suggestion: no max/min width on images, we dont
  // know what aspect ratios people will be using day to day
  //
  // static maxWidth = 36
  // static maxHeight = 36

  state = {}

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      this.handle.release()
    }

    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  componentDidMount = () => {
    log('componentDidMount')
    this.refreshHandle(this.props.docId)
  }

  // If an ImageCard changes docId, React will re-use this component
  // and update the props instead of instantiating a new one and calling
  // componentDidMount. We have to check for prop updates here and
  // update our doc handle
  componentDidUpdate = (prevProps) => {
    log('componentWillReceiveProps')

    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  render = () => {
    log('render')

    if (this.state.hyperfile && this.state.hyperfile.key) {
      return (
        <p>
          Error: This image uses an outdated version of hyperfile,
          please delete and re-upload.
        </p>
      )
    }

    if (!this.state.hyperfileId) {
      // we used to show some kind of stand-in value but we don't have a design
      // for one that works everywhere the image works, so for now: nothing.
      return null
    }

    return <img className="image" alt="" src={`hyperfile://${this.state.hyperfileId}`} />
  }
}

ContentTypes.register({
  component: ImageContent,
  type: 'image',
  name: 'Image',
  icon: 'image'
})
