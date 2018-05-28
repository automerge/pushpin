import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import ContentTypes from '../content-types'

const log = Debug('pushpin:content')
const FILTERED_PROPS = ['type', 'docId']

export default class Content extends React.PureComponent {
  static propTypes = {
    type: PropTypes.string.isRequired,
    docId: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.onChange = this.onChange.bind(this)

    // State directly affects the rendered view.
    this.state = {
      loading: true
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
    const doc = window.hm.change(window.hm.find(this.props.docId), changeBlock)
    this.setState({ ...this.state, doc })
    return doc
  }

  getHypermergeDoc(docId, cb) {
    window.hm.openHandle(docId)
      .then(handle => {
        handle.on('updated', (handle) => cb(null, handle.doc()))
        cb(null, handle.doc)
      }, err => {
        cb(err)
      })
  }

  componentDidMount() {
    this.mounted = true

    this.getHypermergeDoc(this.props.docId, (error, doc) => {
      if (error) {
        log(error)
      }

      // This card may have been deleted by the time fetchHypermergeDoc returns,
      // so check here to see if the component is still mounted
      if (!this.mounted) {
        return
      }
      this.setState({ loading: false, doc })
    })
  }

  componentWillUpdate(nextProps, nextState) {
    log('componentWillUpdate')

    if (nextProps.docId !== this.props.docId) {
      this.getHypermergeDoc(nextProps.docId, (error, doc) => {
        if (error) {
          log(error)
        }

        this.setState({ loading: false, doc })
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
    const contentType = ContentTypes
      .list({ withUnlisted: true })
      .find(ct => ct.type === this.props.type)

    if (!contentType) {
      return missingType(this.props.type)
    }

    if (this.state.loading) {
      return null
    }

    const filteredProps = this.filterProps(this.props)

    return (
      <contentType.component
        docId={this.props.docId}
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
