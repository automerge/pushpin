import React from 'react'
import Debug from 'debug'
import { Handle } from 'hypermerge'

import { ContentProps } from './Content'
import ContentTypes from '../content-types'

const log = Debug('pushpin:image-card')

interface ImageDoc {
  hyperfileUrl: string
}

interface State {
  doc?: ImageDoc
}

export default class ImageContent extends React.PureComponent<ContentProps, State> {
  static initializeDocument(image: ImageDoc, { hyperfileUrl }) {
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

  private handle?: Handle<any>
  state: State = {}


  componentDidMount() {
    log('componentDidMount')
    const { hypermergeUrl } = this.props
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  onChange(doc: any) {
    this.setState({ doc })
  }

  componentWillUnmount() {
    if (this.handle) {
      this.handle.close()
    }
  }
  

  render() {
    log('render')

    const { doc } = this.state

    if (!doc || !doc.hyperfileUrl) {
      // we used to show some kind of stand-in value but we don't have a design
      // for one that works everywhere the image works, so for now: nothing.
      return null
    }

    return <img className="image" alt="" src={doc.hyperfileUrl} />
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
