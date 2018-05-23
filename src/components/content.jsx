import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import CodeMirrorEditor from './code-mirror-editor'
import ImageCard from './image-card'
import Board from './board'

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

    // State directly affects the rendered view.
    this.state = {
      loading: true
    }
  }

  getHypermergeDoc(docId, cb) {
    if (window.hm.has(docId)) {
      const doc = window.hm.find(docId)
      if (doc) {
        cb(null, doc)
        return
      }
    }
    window.hm.open(docId)
    window.hm.on('document:ready', (id, doc) => {
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
    const TypeToTag = {
      text: CodeMirrorEditor,
      image: ImageCard,
      board: Board
    }
    const TagName = TypeToTag[this.props.card.type]

    if (this.state.loading) {
      // stand-in content could go here
      return <p>Loading...</p>
    }

    return (<TagName
      cardId={this.props.card.id}
      docId={this.props.card.docId}
      cardHeight={this.props.card.height}
      uniquelySelected={this.props.uniquelySelected}
      doc={this.state.doc}
    />) // how do we push other props down?
  }
}
