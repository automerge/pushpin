import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import ContentTypes from '../content-types'
import { parseDocumentLink } from '../share-link'

const log = Debug('pushpin:content')
const FILTERED_PROPS = ['type', 'docId']

export default class Content extends React.PureComponent {
  static propTypes = {
    url: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.onChange = this.onChange.bind(this)

    const { docId } = parseDocumentLink(this.props.url)
    this.handle = window.hm.openHandle(docId)

    // State directly affects the rendered view.
    this.state = {
      doc: this.handle.get()
    }
  }

  static initializeContentDoc(type, typeAttrs = {}) {
    const { hm } = window // still not a great idea
    const contentType = ContentTypes
      .list({ withUnlisted: true })
      .find(contentType => contentType.type === type)

    const documentInitializationFunction = contentType.component.initializeDocument

    let doc = hm.create()
    const docId = hm.getId(doc)

    const onChange = (cb) => {
      doc = hm.change(doc, cb)
    }

    documentInitializationFunction(onChange, typeAttrs)

    return docId
  }

  onChange(changeBlock) {
    // We can read the old version of th doc from this.state.doc because
    // setState is not immediate and so this.state may not yet reflect the
    // latest version of the doc.
    const doc = this.handle.change(changeBlock)
    this.setState({ doc })
  }

  componentDidMount() {
    this.mounted = true

    this.handle.onChange(doc => {
      if (!this.mounted) {
        return
      }
      this.setState({ doc })
    })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.url !== this.props.url) {
      const { docId } = parseDocumentLink(this.props.url)
      this.handle = window.hm.openHandle(docId)
      this.handle.onChange(doc => {
        if (!this.mounted) {
          return
        }
        this.setState({ doc })
      })
    }
  }

  componentWillUnmount() {
    this.mounted = false
  }

  filterProps(props) {
    const filtered = {}
    Object.keys(props)
      .filter(key => !FILTERED_PROPS.includes(key))
      .forEach(key => {
        filtered[key] = props[key]
      })
    return filtered
  }

  render() {
    log('render')

    if (!this.props.url) {
      return null
    }

    const { type, docId } = parseDocumentLink(this.props.url)

    const contentType = ContentTypes
      .list({ withUnlisted: true })
      .find((ct) => ct.type === type)

    if (!contentType) {
      return missingType(type)
    }

    if (!this.state.doc) {
      return null
    }

    const filteredProps = this.filterProps(this.props)

    return (
      <contentType.component
        docId={docId}
        onChange={this.onChange}
        doc={this.state.doc}
        {...filteredProps}
      />
    )
  }
}

const missingType = type => (
  <div>
    <i className="fa fa-exclamation-triangle" />
    Component of type &quot;{type}&quot; not found.
  </div>
)
