import React, { useState, useCallback, useMemo } from 'react'

import { Document, Page } from 'react-pdf/dist/entry.webpack'
import { FileDoc } from '.'

import ContentTypes from '../../../ContentTypes'
import { ContentProps } from '../../Content'
import { useDocument, useConfirmableInput, useHyperfile } from '../../../Hooks'
import './PdfContent.css'

export default function PdfContent(props: ContentProps) {
  const [pdf, changePdf] = useDocument<FileDoc>(props.hypermergeUrl)
  const [pdfHeader, pdfStream] = useHyperfile(pdf && pdf.hyperfileUrl)
  const fileData = useMemo(() => ({ data: pdfStream }), [pdfStream]) // xxx: this definitely won't work
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)

  const [pageInputValue, onPageInput] = useConfirmableInput(String(pageNum), (str) => {
    const nextPageNum = Number.parseInt(str, 10)

    setPageNum(Math.min(numPages, Math.max(1, nextPageNum)))
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

  const onDocumentLoadSuccess = useCallback(
    (result: any) => {
      const { numPages } = result

      setNumPages(numPages)

      result.getMetadata().then((metadata: any) => {
        const { info = {} } = metadata
        const { Title } = info

        if (Title && pdf && !pdf.title) {
          changePdf((doc) => {
            doc.title = Title
          })
        }
      })
    },
    [changePdf]
  )

  if (!pdf) {
    return null
  }

  const { context } = props

  const forwardDisabled = pageNum >= numPages
  const backDisabled = pageNum <= 1

  const header =
    context === 'workspace' ? (
      <div className="PdfContent-header">
        <button
          disabled={backDisabled}
          type="button"
          onClick={goBack}
          className="PdfContent-navButton"
        >
          <i className="fa fa-angle-left" />
        </button>
        <input
          className="PdfContent-headerInput"
          value={pageInputValue}
          type="number"
          min={1}
          max={numPages}
          onChange={onPageInput}
          onKeyDown={onPageInput}
        />
        <div className="PdfContent-headerNumPages">/ {numPages}</div>
        <button
          disabled={forwardDisabled}
          type="button"
          onClick={goForward}
          className="PdfContent-navButton"
        >
          <i className="fa fa-angle-right" />
        </button>
      </div>
    ) : null

  return (
    <div className="PdfContent">
      {header}
      {pdfHeader ? (
        <Document file={fileData} onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            loading=""
            pageNumber={pageNum}
            className="PdfContent-page"
            width={1600}
            renderTextLayer={false}
          />
        </Document>
      ) : null}
    </div>
  )
}

const supportsMimeType = (mimeType) => !!mimeType.match('application/pdf')

ContentTypes.register({
  type: 'pdf',
  name: 'PDF',
  icon: 'file-pdf-o',
  unlisted: true,
  contexts: {
    workspace: PdfContent,
    board: PdfContent,
  },
  supportsMimeType,
})
