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
      loading: false
    }
  }

  componentDidMount() {
    this.mounted = true

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
    return this.props.card.type === 'text' ? this.renderTextInner(this.props.card) : this.renderImageInner(this.state)
  }

  renderTextInner() {
    if (this.props.card.doc) {
      return (
        <CodeMirrorEditor
          cardId={this.props.card.id}
          cardHeight={this.props.card.height}
          uniquelySelected={this.props.uniquelySelected}
          doc={this.props.card.doc}
        />
      )
    }

    return <p>Loading...</p>
  }

  renderImageInner(state) {
    if (state.loading) {
      return <h3>Loading</h3>
    }
    return <img className="image" alt="" src={state.imagePath} />
  }
}
