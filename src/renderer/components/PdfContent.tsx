import React, { useState } from 'react'

import { Document, Page } from 'react-pdf/dist/entry.webpack'

import ContentTypes from '../ContentTypes'
import { ContentProps } from './Content'
import { useDocument, useHyperfile, useConfirmableInput } from '../Hooks'

interface PdfDoc {
  title?: string
  hyperfileUrl: string
}

PdfContent.minWidth = 3
PdfContent.minHeight = 3
PdfContent.defaultWidth = 18
// no default height to allow it to grow
// suggestion: no max/min width on images, we dont
// know what aspect ratios people will be using day to day
PdfContent.maxWidth = 72

export default function PdfContent(props: ContentProps) {
  const [pdf, changePdf] = useDocument<PdfDoc>(props.hypermergeUrl)
  const pdfData = useHyperfile(pdf && pdf.hyperfileUrl)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)

  const [pageInputValue, onInput] = useConfirmableInput(String(pageNum), (str) => {
    const nextPageNum = Number.parseInt(str, 10)

    if (nextPageNum > 0 && nextPageNum <= numPages) {
      setPageNum(nextPageNum)
      return String(nextPageNum)
    }

    return String(pageNum)
  })

  function goForward() {
    if (pageNum < numPages) {
      setPageNum(pageNum + 1)
    }
  }

  function goBack() {
    if (pageNum > 1) {
      setPageNum(pageNum - 1)
    }
  }

  function onDocumentLoadSuccess(result: any) {
    const { numPages } = result

    result.getMetadata().then(onDocumentMetadata)

    setNumPages(numPages)
  }

  function onDocumentMetadata(metadata: any) {
    const { info = {} } = metadata
    const { Title } = info

    if (Title && pdf && !pdf.title) {
      changePdf((doc) => {
        doc.title = Title
      })
    }
  }

  if (!pdf) {
    return null
  }

  const { context } = props

  const forwardDisabled = pageNum >= numPages
  const backDisabled = pageNum <= 1

  const header =
    context === 'workspace' ? (
      <div className="PDFCardHeader">
        <button disabled={backDisabled} type="button" onClick={goBack} className="ButtonAction">
          <i className="fa fa-angle-left" />
        </button>
        <input
          className="PDFCardHeader__input"
          value={pageInputValue}
          type="number"
          min="1"
          max={numPages}
          onChange={onInput}
          onKeyDown={onInput}
        />
        <div className="PDFCardHeader__numPages">/ {numPages}</div>
        <button
          disabled={forwardDisabled}
          type="button"
          onClick={goForward}
          className="ButtonAction"
        >
          <i className="fa fa-angle-right" />
        </button>
      </div>
    ) : null

  return (
    <div className="PDFCard">
      {header}
      {pdfData ? (
        <Document file={{ data: pdfData }} onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            pageNumber={pageNum}
            className="PDFCard__page"
            width={1600}
            renderTextLayer={false}
          />
        </Document>
      ) : null}
    </div>
  )
}

function initializeDocument(pdf, { hyperfileUrl }) {
  pdf.hyperfileUrl = hyperfileUrl
}

ContentTypes.register({
  type: 'pdf',
  name: 'PDF',
  icon: 'book',
  contexts: {
    workspace: PdfContent,
    board: PdfContent,
  },
  initializeDocument,
})
