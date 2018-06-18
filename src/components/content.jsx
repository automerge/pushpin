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
    context: PropTypes.string
  }

  static defaultProps = {
    context: 'default'
  }

  static initializeContentDoc = (type, typeAttrs = {}) => {
    const { hm } = window // still not a great idea
    const contentType = ContentTypes.lookup({ type })

    const initializeDocumentWithAttrs = (doc) => {
      contentType.component.initializeDocument(doc, typeAttrs)
    }

    let doc = hm.create()
    const docId = hm.getId(doc)
    doc = hm.change(doc, initializeDocumentWithAttrs)

    return docId
  }

  state = {}

  componentDidCatch = (e) => {
    this.setState({ contentCrashed: e })
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
    const { context, url } = this.props

    if (!url) {
      return null
    }

    const { type, docId } = parseDocumentLink(url)

    const contentType = ContentTypes.lookup({ type, context })

    if (!contentType) {
      return renderMissingType(type)
    }

    if (this.state.contentCrashed) {
      return renderError(type, this.state.contentCrashed)
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

const renderError = (type, error) => (
  <div>
    <i className="fa fa-exclamation-triangle" />
    A &quot;{type}&quot; threw an error during render.
  </div>
)

const renderMissingType = type => (
  <div>
    <i className="fa fa-exclamation-triangle" />
    Component of type &quot;{type}&quot; not found.
  </div>
)
