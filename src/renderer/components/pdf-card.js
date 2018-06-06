import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import uuid from 'uuid/v4'
import PDF from 'react-pdf-js'

import * as Hyperfile from '../hyperfile'
import ContentTypes from '../content-types'

const log = Debug('pushpin:pdf-card')

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
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => {
      this.setState({ doc })
    })
  }

  componentDidMount() {
    log('componentDidMount')
    this.workPDF()
    this.mounted = true
  }

  componentWillUnmount() {
    log('componentWillUnmount')
    this.mounted = false
  }

  componentDidUpdate() {
    log('componentDidUpdate')
    this.workPDF()
  }

  workPDF() {
    if (this.state.doc.path) {
      this.uploadPDF()
    }

    if (this.state.doc.hyperfile) {
      this.fetchPDF()
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

  fetchPDF() {
    Hyperfile.fetch(this.state.doc.hyperfile, (error, pdfPath) => {
      if (error) {
        log(error)
      }

      // This card may have been deleted by the time fetchPDF returns,
      // so check here to see if the component is still mounted
      if (!this.mounted) {
        return
      }

      this.setState({ pdfContentReady: true, pdfPath: `../${pdfPath}` })
    })
  }

  render() {
    if (this.state.pdfContentReady) {
      return <PDF file={this.state.pdfPath} />
    } else {
      return null
    }
  }
}


ContentTypes.register({
  component: PDFCard,
  type: 'pdf',
  name: 'PDF',
  icon: 'sticky-note',
  resizable: false
})
