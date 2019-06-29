import React from 'react'

import { Document, Page } from 'react-pdf/dist/entry.webpack'

import { Handle } from 'hypermerge'
import * as Hyperfile from '../hyperfile'
import ContentTypes from '../ContentTypes'
import { ContentProps } from './Content'

interface PdfDoc {
  hyperfileUrl: string
}

interface State {
  currentHyperfileUrl: string
  reactPDFData?: object
  pageInputValue: string
  pageNum: number
  numPages: number
  doc?: PdfDoc
}

export default class PDFCard extends React.PureComponent<ContentProps, State> {
  static minWidth = 3
  static minHeight = 3
  static defaultWidth = 18
  // no default height to allow it to grow
  // suggestion: no max/min width on images, we dont
  // know what aspect ratios people will be using day to day
  //
  static maxWidth = 72

  private handle?: Handle<PdfDoc>
  state: State = {
    currentHyperfileUrl: '',
    reactPDFData: {},
    pageInputValue: '1',
    pageNum: 1,
    numPages: 0,
  }

  // This is the New Boilerplate
  componentWillMount = () =>
    window.repo.watch<PdfDoc>(this.props.hypermergeUrl, (doc) => this.onChange(doc))
  componentWillUnmount = () => this.handle && this.handle.close()

  onChange = (doc: PdfDoc) => {
    if (doc.hyperfileUrl && doc.hyperfileUrl !== this.state.currentHyperfileUrl) {
      this.loadPDF(doc.hyperfileUrl)
    }
    this.setState({ doc })
  }

  loadPDF = (hyperfileUrl) => {
    Hyperfile.fetch(hyperfileUrl, (hyperfileContents) => {
      this.setState({
        currentHyperfileUrl: hyperfileUrl,
        reactPDFData: { data: hyperfileContents },
      })
    })
  }

  disableForward = () => this.state.pageNum >= this.state.numPages
  forward = () => {
    let { pageNum } = this.state
    if (pageNum < this.state.numPages) {
      pageNum += 1
    }

    this.setState({ pageNum, pageInputValue: String(pageNum) })
  }

  disableBack = () => this.state.pageNum <= 1
  back = () => {
    let { pageNum } = this.state
    if (pageNum > 1) {
      pageNum -= 1
    }

    this.setState({ pageNum, pageInputValue: String(pageNum) })
  }

  onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      this.back()
      e.stopPropagation()
    } else if (e.key === 'ArrowRight') {
      this.forward()
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
        this.setState({ pageInputValue: String(pageNum) })
      }
      e.target.blur()
    }

    if (e.key === 'Backspace') {
      e.stopPropagation()
    }

    if (e.key === 'Escape') {
      e.target.blur()
      this.setState({ pageInputValue: String(pageNum) })
    }
  }

  handleInputChange = (e) => {
    this.setState({ pageInputValue: e.target.value })
  }

  onDocumentLoadSuccess = (result) => {
    const { numPages } = result

    result.getMetadata().then((metadata) => this.onDocumentMetadata(metadata))

    this.setState({ numPages })
  }

  onDocumentMetadata = (metadata) => {
    const { info = {} } = metadata
    const { Title } = info

    if (Title && this.handle) {
      this.handle.change((doc) => {
        doc.title = Title
      })
    }
  }

  render = () => {
    const { reactPDFData, numPages, pageInputValue } = this.state
    const { context } = this.props

    const header =
      context === 'workspace' ? (
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
          <button
            disabled={this.disableForward()}
            type="button"
            onClick={this.forward}
            className="ButtonAction"
          >
            <i className="fa fa-angle-right" />
          </button>
        </div>
      ) : null

    return (
      <div className="PDFCard">
        {header}
        {reactPDFData ? (
          <Document file={reactPDFData} onLoadSuccess={this.onDocumentLoadSuccess}>
            <Page
              pageNumber={this.state.pageNum}
              className="PDFCard__page"
              width={1600}
              renderTextLayer={false}
            />
          </Document>
        ) : null}
      </div>
    )
  }
}

function initializeDocument(pdf, { hyperfileUrl }) {
  pdf.hyperfileUrl = hyperfileUrl
}

ContentTypes.register({
  type: 'pdf',
  name: 'PDF',
  icon: 'book',
  contexts: {
    workspace: PDFCard,
    board: PDFCard,
  },
  initializeDocument,
})
