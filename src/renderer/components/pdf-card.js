import React from 'react'
import PropTypes from 'prop-types'
import pdfjs from 'pdfjs-dist'

import path from 'path'
import * as Hyperfile from '../hyperfile'
import ContentTypes from '../content-types'

pdfjs.GlobalWorkerOptions.workerSrc = path.join(__static, '/pdf.worker.js')

export default class PDFCard extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired
  }

  static initializeDocument = (pdf, { hyperfileUrl }) => {
    pdf.hyperfileUrl = hyperfileUrl
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
    currentHyperfileUrl: '',
    newPageNum: 1,
    pageNum: 1
  }

  pdfViewport = React.createRef()
  input = React.createRef()


  // This is the New Boilerplate
  componentWillMount = () => this.refreshHandle(this.props.hypermergeUrl)
  componentWillUnmount = () => this.handle.close()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.hypermergeUrl !== this.props.hypermergeUrl) {
      this.refreshHandle(this.props.hypermergeUrl)
    }
  }

  refreshHandle = (hypermergeUrl) => {
    if (this.handle) {
      this.handle.close()
    }
    this.handle = window.repo.watch(hypermergeUrl, (doc) => this.onChange(doc))
  }

  onChange = (doc) => {
    if (doc.hyperfileUrl && doc.hyperfileUrl !== this.state.currentHyperfileUrl) {
      this.loadPDF(doc.hyperfileUrl)
    }
    this.setState({ ...doc })
  }

  loadPDF = (hyperfileUrl) => {
    Hyperfile.fetch(hyperfileUrl, (pdfData) => {
      pdfjs.getDocument({ data: pdfData }).then((pdf) => {
        // Check if the card has been deleted by the time we get here
        /* if (!this.mounted) {
          return
        } */

        this.setState({ currentHyperfileUrl: hyperfileUrl, pdfDocument: pdf })
      })
    })
  }

  disableForward = () => this.pageNum >= this.state.pdfDocument.numPages
  forward = () => {
    let { pageNum } = this.state
    if (pageNum < this.state.pdfDocument.numPages) {
      pageNum += 1
    }

    this.setState({ pageNum, newPageNum: pageNum })
  }

  disableBack = () => this.pageNum <= 0
  back = () => {
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
    const { hyperfileUrl, pdfDocument, pageNum, newPageNum } = this.state
    if (pdfDocument) {
      // trigger a fresh PDF render
      setTimeout(() => this.renderPDF(this.pdfViewport.current, pdfDocument, pageNum), 0)

      return (
        <div className="PDFCard">
          <div className="PDFCardHeader">
            <button
              disabled={this.disableBack()}
              type="button"
              onClick={this.back}
              className="ButtonAction"
            >
              <i className="fa fa-angle-left" />
            </button>
            <input
              className="PDFCardHeader__input"
              ref={this.input}
              value={newPageNum}
              type="number"
              min="1"
              max={this.state.pdfDocument.numPages}
              onChange={this.handleInputChange}
              onKeyDown={this.handleInputKey}
            />
            <div className="PDFCardHeader__numPages">/ {pdfDocument.numPages}</div>
            <button disabled={this.disableForward()} type="button" onClick={this.forward} className="ButtonAction">
              <i className="fa fa-angle-right" />
            </button>
          </div>
          <div className="PDFCard__content" tabIndex="0" onKeyDown={this.onKeyDown} ref={this.pdfViewport} />
        </div>
      )
    }
    return (
      <div className="PDFCard">
        <span className="PDFCard__loading">Loading PDF content from {hyperfileUrl}...</span>
      </div>
    )
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
      this.renderedWidth = container.parentNode.clientWidth - 8
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
