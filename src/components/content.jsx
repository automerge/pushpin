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

  static initializeContentDoc = (type, typeAttrs = {}) => {
    const { hm } = window // still not a great idea
    const contentType = ContentTypes
      .list({ withUnlisted: true })
      .find(contentType => contentType.type === type)

    const initializeDocumentWithAttrs = (doc) => {
      contentType.component.initializeDocument(doc, typeAttrs)
    }

    let doc = hm.create()
    const docId = hm.getId(doc)
    doc = hm.change(doc, initializeDocumentWithAttrs)

    return docId
  }

  // This is the New Boilerplate, adapted slightly for content
  state = {}
  componentWillMount = () => {
    const { docId } = parseDocumentLink(this.props.url)
    this.refreshHandle(docId)
  }
  componentWillUnmount = () => window.hm.releaseHandle(this.handle)
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.url !== this.props.url) {
      const { docId } = parseDocumentLink(this.props.url)
      this.refreshHandle(docId)
    }
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      window.hm.releaseHandle(this.handle)
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  onChange = (doc) => {
    this.setState({ hasDoc: true })
  }

  filterProps = (props) => {
    const filtered = {}
    Object.keys(props)
      .filter(key => !FILTERED_PROPS.includes(key))
      .forEach(key => {
        filtered[key] = props[key]
      })
    return filtered
  }

  render = () => {
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

    if (!this.state.hasDoc) {
      return null
    }

    const filteredProps = this.filterProps(this.props)

    return (
      <contentType.component
        docId={docId}
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
