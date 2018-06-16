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

  state = {}

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
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
