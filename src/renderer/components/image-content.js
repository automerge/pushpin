import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import ContentTypes from '../content-types'

const log = Debug('pushpin:image-card')

export default class ImageContent extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired
  }

  static initializeDocument = (image, { hyperfileUrl }) => {
    image.hyperfileUrl = hyperfileUrl
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

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }


  componentDidMount = () => {
    log('componentDidMount')
    this.refreshHandle(this.props.hypermergeUrl)
  }

  // If an ImageCard changes hypermergeUrl, React will re-use this component
  // and update the props instead of instantiating a new one and calling
  // componentDidMount. We have to check for prop updates here and
  // update our doc handle
  componentDidUpdate = (prevProps) => {
    log('componentWillReceiveProps')

    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  render = () => {
    log('render')

    if (!this.state.hyperfileUrl) {
      // we used to show some kind of stand-in value but we don't have a design
      // for one that works everywhere the image works, so for now: nothing.
      return null
    }

    return <img className="image" alt="" src={this.state.hyperfileUrl} />
  }
}

ContentTypes.register({
  type: 'image',
  name: 'Image',
  icon: 'image',
  contexts: {
    workspace: ImageContent,
    board: ImageContent
  }
})
