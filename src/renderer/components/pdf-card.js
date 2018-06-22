import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import uuid from 'uuid/v4'
import pdfjs from 'pdfjs-dist'

import * as Hyperfile from '../hyperfile'
import ContentTypes from '../content-types'

const log = Debug('pushpin:pdf-card')

pdfjs.GlobalWorkerOptions.workerSrc = '../node_modules/pdfjs-dist/build/pdf.worker.js'

export default class PDFCard extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument = (pdf, { hyperfileId }) => {
    pdf.hyperfileId = hyperfileId
  }

  static minWidth = 3
  static minHeight = 3
  static defaultWidth = 18
  // no default height to allow it to grow
  // suggestion: no max/min width on images, we dont
  // know what aspect ratios people will be using day to day
  //
  static maxWidth = 72

  state = { pdfContentReady: false }
  pdfViewport = React.createRef()

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

    // not sure this is the best way to solve this
    this.loadPDF()
    this.renderPDF()

    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  loadPDF = () => {
    if (this.state.pdfContentReady) {
      return
    }
    Hyperfile.fetch(this.state.hyperfileId, (error, pdfData) => {
      if (error) {
        log(error)
      }
      pdfjs.getDocument({ data: pdfData }).then((pdf) => {
        // Check if the card has been deleted by the time we get here
        /* if (!this.mounted) {
          return
        } */

        this.setState({ pdfContentReady: true, pdfDocument: pdf })
      })
    })
  }

  renderPDF = () => {
    const container = this.pdfViewport.current
    if (!this.state.pdfContentReady || container.clientWidth === this.renderedWidth) {
      return
    }

    // Measure the width of the card. Cards that have been resized have an explicit CSS width
    // attribute, which determines the width. New cards have no width attribute, so their size is
    // determined by the content. If we don't have the content yet, put a temporary spacer element
    // in place so that the card is created with a sensible default size.
    if (container.firstChild) {
      this.renderedWidth = container.parentNode.clientWidth
    } else {
      const spacer = document.createElement('div')
      spacer.style.width = '250px'
      container.appendChild(spacer)
      this.renderedWidth = container.parentNode.clientWidth
      container.removeChild(spacer)
      container.parentNode.style.width = `${this.renderedWidth}px`
    }

    this.state.pdfDocument.getPage(1).then((page) => {
      const resolution = window.devicePixelRatio || 1
      const scalingFactor = resolution * this.renderedWidth / (page.view[2] - page.view[0])
      const viewport = page.getViewport(scalingFactor)

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = '100%'
      page.render({ canvasContext: canvas.getContext('2d'), viewport })

      if (container.firstChild) {
        container.removeChild(container.firstChild)
      }
      container.appendChild(canvas)
    })
  }

  render = () => {
    if (this.state.pdfContentReady) {
      return <div ref={this.pdfViewport} className="pdf-card" />
    }
    return <div className="pdf-card">Loading...</div>
  }
}


ContentTypes.register({
  component: PDFCard,
  type: 'pdf',
  name: 'PDF',
  icon: 'book'
})
