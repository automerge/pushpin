import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import ContentTypes from '../content-types'

// Import these even though we don't use them, to be sure they register with ContentTypes.
import CodeMirrorEditor from './code-mirror-editor'
import ImageCard from './image-card'
import Toggle from './toggle'

const log = Debug('pushpin:content')
const FILTERED_PROPS = ['card']

export default class Content extends React.PureComponent {
  static propTypes = {
    card: PropTypes.shape({
      type: PropTypes.string,
      id: PropTypes.string,
      height: PropTypes.number,
      docId: PropTypes.string,
    }).isRequired
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
    const contentType = ContentTypes.list().find(contentType => contentType.type === type)
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
    const doc = window.hm.change(window.hm.find(this.props.card.docId), changeBlock)
    this.setState({ ...this.state, doc })
    return doc
  }

  getHypermergeDoc(docId, cb) {
    window.hm.open(docId)
      .then(doc => {
        cb(null, doc)
      }, err => {
        cb(err)
      })
    // XXX fixme: lol
    window.hm.on('document:updated', (id, doc) => {
      if (id !== docId) {
        return
      }

      // unregister listener
      cb(null, doc)
    })
  }

  componentDidMount() {
    this.mounted = true

    this.getHypermergeDoc(this.props.card.docId, (error, doc) => {
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

    if (nextProps.card.docId !== this.props.card.docId) {
      this.getHypermergeDoc(nextProps.card.docId, (error, doc) => {
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
    Object.keys(props).filter(key => !FILTERED_PROPS.includes(key)).forEach(key => {
      filtered[key] = props[key]
    })
    return filtered
  }

  render() {
    log('render')
    const contentType = ContentTypes.list().find((ct) => ct.type === this.props.card.type)

    if (!contentType) {
      throw new Error(`Could not find component of type ${this.props.card.type}`)
    }

    if (this.state.loading) {
      return null
    }

    const filteredProps = this.filterProps(this.props)

    return (
      <contentType.component
        cardId={this.props.card.id}
        docId={this.props.card.docId}
        cardHeight={this.props.card.height}
        onChange={this.onChange}
        doc={this.state.doc}
        {...filteredProps}
      />
    )
  }
}
