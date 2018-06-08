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

  static initializeDocument(pdfDoc, { path }) {
    pdfDoc.path = path
  }

  constructor(props) {
    super(props)
    this.handle = null
    this.pdfViewport = React.createRef()
    this.state = { pdfContentReady: false }
    this.cardResized = this.cardResized.bind(this)
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => {
      this.setState({ doc })
    })
  }

  componentDidMount() {
    this.workPDF()
    this.mounted = true
    document.addEventListener('cardResized', this.cardResized)
  }

  componentWillUnmount() {
    this.mounted = false
    document.removeEventListener('cardResized', this.cardResized)
  }

  componentDidUpdate() {
    this.workPDF()
    this.renderPDF()
  }

  cardResized(event) {
    if (this.props.cardId === event.detail.cardId) {
      this.renderPDF()
    }
  }

  workPDF() {
    if (this.state.doc.path && !this.uploading) {
      this.uploading = true
      this.uploadPDF()
    }

    if (this.state.doc.hyperfile && !this.loading) {
      this.loading = true
      this.loadPDF()
    }
  }

  uploadPDF() {
    const fileId = uuid()
    Hyperfile.writePath(fileId, this.state.doc.path, (err, hyperfile) => {
      if (err) {
        log(err)
      }

      this.handle.change(d => {
        delete d.path
        d.hyperfile = hyperfile
      })
    })
  }

  loadPDF() {
    Hyperfile.fetch(this.state.doc.hyperfile, (error, pdfPath) => {
      if (error) {
        log(error)
      }

      pdfjs.getDocument(`../${pdfPath}`).then((pdf) => {
        // Check if the card has been deleted by the time we get here
        if (!this.mounted) {
          return
        }

        this.setState({ pdfContentReady: true, pdfDocument: pdf })
      }, (err) => { log(err) })
    })
  }

  renderPDF() {
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
      container.parentNode.style.width = this.renderedWidth + 'px'
    }

    this.state.pdfDocument.getPage(1).then((page) => {
      const resolution = window.devicePixelRatio || 1
      const viewport = page.getViewport(resolution * this.renderedWidth / (page.view[2] - page.view[0]))

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

  render() {
    if (this.state.pdfContentReady) {
      return <div ref={this.pdfViewport} className="pdf-card"/>
    } else {
      return null
    }
  }
}


ContentTypes.register({
  component: PDFCard,
  type: 'pdf',
  name: 'PDF',
  icon: 'book'
})
