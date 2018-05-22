import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import CodeMirrorEditor from './code-mirror-editor'
import * as ImageCard from '../models/image-card'

const log = Debug('pushpin:content')

export default class Content extends React.PureComponent {
  static propTypes = {
    uniquelySelected: PropTypes.bool.isRequired,
    card: PropTypes.shape({
      type: PropTypes.string,
      id: PropTypes.string,
      height: PropTypes.number,
      hyperfile: PropTypes.object.isOptional,
      doc: CodeMirrorEditor.propTypes.doc.isOptional,
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
    window.hm.on('document:ready', (id, doc) => {
      if(id !== docId) {
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

    if (this.props.card.type === 'image') {
      this.setState({ loading: true }, () => {
        ImageCard.fetchImage(this.props.card.hyperfile, (error, imagePath) => {
          if (error) {
            log(error)
          }

          // This card may have been deleted by the time fetchImage returns,
          // so check here to see if the component is still mounted
          if (!this.mounted) {
            return
          }

          this.setState({ loading: false, imagePath: `../${imagePath}` })
        })
      })
    }
  }

  componentWillUnmount() {
    this.mounted = false
  }

  render() {
    if (this.props.card.type === 'image') {
      return <p>Images not yet supported.</p>
    }

    const TypeToTag = {
      text: CodeMirrorEditor
    }
    const TagName = TypeToTag[this.props.card.type]

    if (this.state.loading) {
      return <p>Loading...</p> // stand-in content could go here
    }

    return (<TagName
      cardId={this.props.card.id}
      docId={this.props.card.docId}
      cardHeight={this.props.card.height}
      uniquelySelected={this.props.uniquelySelected}
      doc={this.state.doc}
    />) // how do we push other props down?
  }

  renderImageInner(state) {
    if (state.loading) {
      return <h3>Loading</h3>
    }
    return <img className="image" alt="" src={state.imagePath} />
  }
}
