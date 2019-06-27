import React from 'react'
import PropTypes from 'prop-types'

import { Document, Page } from 'react-pdf/dist/entry.webpack'

import * as Hyperfile from '../hyperfile'
import ContentTypes from '../content-types'

export default class PDFCard extends React.PureComponent {
  static propTypes = {
    hypermergeUrl: PropTypes.string.isRequired,
    context: PropTypes.string.isRequired
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
    pageInputValue: 1,
    pageNum: 1,
    numPages: 0
  }

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
    Hyperfile.fetch(hyperfileUrl, (hyperfileContents) => {
      this.setState({
        currentHyperfileUrl: hyperfileUrl,
        reactPDFData: { data: hyperfileContents }
      })
    })
  }

  disableForward = () => this.pageNum >= this.state.numPages
  forward = () => {
    let { pageNum } = this.state
    if (pageNum < this.state.numPages) {
      pageNum += 1
    }

    this.setState({ pageNum, pageInputValue: pageNum })
  }

  disableBack = () => this.pageNum <= 1
  back = () => {
    let { pageNum } = this.state
    if (pageNum > 1) {
      pageNum -= 1
    }

    this.setState({ pageNum, pageInputValue: pageNum })
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
    const { pageInputValue, pageNum, numPages } = this.state

    if (e.key === 'Enter') {
      const nextPageNum = Number.parseInt(pageInputValue, 10)
      if (nextPageNum > 0 && nextPageNum <= numPages) {
        this.setState({ pageNum: nextPageNum })
      } else {
        this.setState({ pageInputValue: pageNum })
      }
      e.target.blur()
    }

    if (e.key === 'Backspace') {
      e.stopPropagation()
    }

    if (e.key === 'Escape') {
      e.target.blur()
      this.setState({ pageInputValue: pageNum })
    }
  }

  handleInputChange = (e) => {
    this.setState({ pageInputValue: e.target.value })
  }

  onDocumentLoadSuccess = (result) => {
    const { numPages } = result

    result.getMetadata().then(metadata => this.onDocumentMetadata(metadata))

    this.setState({ numPages })
  }

  onDocumentMetadata = (metadata) => {
    const { info = {} } = metadata
    const { Title } = info

    if (Title) {
      this.handle.change((doc) => {
        doc.title = Title
      })
    }
  }

  render = () => {
    const { reactPDFData, numPages, pageInputValue } = this.state
    const { context } = this.props

    const header = (context === 'workspace')
      ? (
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
            value={pageInputValue}
            type="number"
            min="1"
            max={this.state.numPages}
            onChange={this.handleInputChange}
            onKeyDown={this.handleInputKey}
          />
          <div className="PDFCardHeader__numPages">/ {numPages}</div>
          <button disabled={this.disableForward()} type="button" onClick={this.forward} className="ButtonAction">
            <i className="fa fa-angle-right" />
          </button>
        </div>
      )
      : null

    return (
      <div className="PDFCard">
        {header}
        {reactPDFData
          ? (
            <Document
              file={reactPDFData}
              onLoadSuccess={this.onDocumentLoadSuccess}
            >
              <Page
                pageNumber={this.state.pageNum}
                className="PDFCard__page"
                width={1600}
                renderTextLayer={false}
              />
            </Document>
          ) : null
        }
      </div>
    )
  }
}

ContentTypes.register({
  type: 'pdf',
  name: 'PDF',
  icon: 'book',
  contexts: {
    workspace: PDFCard,
    board: PDFCard
  }
})
