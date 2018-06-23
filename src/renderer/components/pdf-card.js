import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
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

  state = {
    currentHyperfileId: '',
    newPageNum: 1,
    pageNum: 1
  }

  pdfViewport = React.createRef()
  input = React.createRef()

  onChange = (doc) => {
    console.log(doc)
    if (doc.hyperfileId && doc.hyperfileId !== this.state.currentHyperfileId) {
      this.loadPDF(doc.hyperfileId)
    }
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
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  loadPDF = (hyperfileId) => {
    Hyperfile.fetch(hyperfileId, (error, pdfData) => {
      if (error) {
        log(error)
      }
      pdfjs.getDocument({ data: pdfData }).then((pdf) => {
        // Check if the card has been deleted by the time we get here
        /* if (!this.mounted) {
          return
        } */

        this.setState({ currentHyperfileId: hyperfileId, pdfDocument: pdf })
      })
    })
  }

  nextPage = () => {
    let { pageNum } = this.state
    if (pageNum < this.state.pdfDocument.numPages) {
      pageNum += 1
    }

    this.setState({ pageNum, newPageNum: pageNum })
  }

  prevPage = () => {
    let { pageNum } = this.state
    if (pageNum > 1) {
      pageNum -= 1
    }

    this.setState({ pageNum, newPageNum: pageNum })
  }

  onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      this.prevPage()
      e.stopPropagation()
    } else if (e.key === 'ArrowRight') {
      this.nextPage()
      e.stopPropagation()
    }
  }

  handleInputKey = (e) => {
    const { newPageNum, pageNum, pdfDocument } = this.state

    if (e.key === 'Enter') {
      const nextPageNum = Number.parseInt(newPageNum, 10)
      if (nextPageNum > 0 && nextPageNum <= pdfDocument.numPages) {
        this.setState({ pageNum: nextPageNum })
      } else {
        this.setState({ newPageNum: pageNum })
      }
      this.input.current.blur()
    }

    if (e.key === 'Backspace') {
      e.stopPropagation()
    }

    if (e.key === 'Escape') {
      this.input.current.blur()
      this.setState({ newPageNum: pageNum })
    }
  }

  handleInputChange = (e) => {
    this.setState({ newPageNum: e.target.value })
  }

  render = () => {
    const { pdfDocument, pageNum, newPageNum } = this.state
    if (pdfDocument) {
      // trigger a fresh PDF render
      setTimeout(() => this.renderPDF(this.pdfViewport.current, pdfDocument, pageNum), 0)

      return (
        <div className="pdf-card">
          <button onClick={this.prevPage}>Prev</button>
          <input
            ref={this.input}
            value={newPageNum}
            onChange={this.handleInputChange}
            onKeyDown={this.handleInputKey}
          />
          of {pdfDocument.numPages}
          <button onClick={this.nextPage}>Next</button>
          <div tabIndex="0" onKeyDown={this.onKeyDown} ref={this.pdfViewport} />
        </div>
      )
    }
    return <div className="pdf-card">Loading PDF content from {this.hyperfileId}...</div>
  }

  renderPDF = (container, pdfDocument, pageNum) => {
    if (!container) {
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

    pdfDocument.getPage(pageNum).then((page) => {
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
}


ContentTypes.register({
  component: PDFCard,
  type: 'pdf',
  name: 'PDF',
  icon: 'book'
})
