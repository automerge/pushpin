import React from 'react'
import PropTypes from 'prop-types'
import * as ImageCardModel from '../models/image-card'
import Debug from 'debug'

const log = Debug('pushpin:image-card')

export default class ImageCard extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    log('constructor')
    this.state = { imageContentReady: false }
  }

  componentDidMount() {
    this.mounted = true
    this.setState({ imageContentReady: false }, () => {
      const hyperFile = {
        key: this.props.doc.hyperfileId,
        imageId: this.props.doc.imageId,
        imageExt: this.props.doc.imageExt
      }
      ImageCardModel.fetchImage(hyperFile, (error, imagePath) => {
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
    })
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    if (!this.state.imageContentReady) {
      return <p>Fetching {this.props.doc.imageId}</p>
      // we should put useful stand-in content here, like alt-text or a caption
    }
    return <img className="image" alt="" src={this.state.imagePath} />
  }
}
