import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import ContentTypes from '../content-types'

// Import these even though we don't use them, to be sure they register with ContentTypes.
import CodeMirrorEditor from './code-mirror-editor'
import ImageCard from './image-card'
import Toggle from './toggle'

const log = Debug('pushpin:content')

export default class Content extends React.PureComponent {
  static propTypes = {
    uniquelySelected: PropTypes.bool.isRequired,
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

  onChange(changeBlock) {
    const doc = window.hm.change(this.state.doc, changeBlock)
    this.setState({ ...this.state, doc })
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

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    const contentType = ContentTypes.list().find((contentType) => contentType.type === this.props.card.type)
    if (!contentType) {
      throw new Error(`Could not find component of type ${this.props.card.type}`)
    }

    if (this.state.loading) {
      // stand-in content could go here
      return <p>Loading...</p>
    }

    return (<contentType.component
      cardId={this.props.card.id}
      docId={this.props.card.docId}
      cardHeight={this.props.card.height}
      uniquelySelected={this.props.uniquelySelected}
      onChange={this.onChange}
      doc={this.state.doc}
    />) // how do we push other props down?
  }
}
