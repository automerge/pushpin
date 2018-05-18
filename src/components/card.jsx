import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Debug from 'debug'

import CodeMirrorEditor from './code-mirror-editor'
import * as ImageCard from '../image'

const log = Debug('pushpin:card')

export default class Card extends React.PureComponent {
  static propTypes = {
    selected: PropTypes.bool.isRequired,
    uniquelySelected: PropTypes.bool.isRequired,
    dragState: PropTypes.shape({
      moveX: PropTypes.number,
      moveY: PropTypes.number,
      resizeWidth: PropTypes.number,
      resizeHeight: PropTypes.number,
    }).isRequired,
    card: PropTypes.shape({
      type: PropTypes.string,
      id: PropTypes.string,
      x: PropTypes.number,
      y: PropTypes.number,
      height: PropTypes.number,
      width: PropTypes.number,
      text: CodeMirrorEditor.propTypes.text.isOptional,
      hyperfile: PropTypes.object.isOptional,
    }).isRequired
  }

  constructor(props) {
    super(props)
    log('constructor')

    // Tracking is internal, ephemeral state that doesn't directly effect the
    // rendered view. It's used for move/resize state. We keep this seperate
    // from this.state below so that we don't need to deal with the fact that
    // setState is async, which makes computing iterative updates hard. We
    // do need to copy some resulting values (the properties in both tracking
    // and state) when they change, but these copies are idempotent and so
    // easier to reason about.
    this.tracking = {
      moving: false,
      resizing: false,
      moveX: null,
      moveY: null,
      slackX: null,
      slackY: null,
      resizeWidth: null,
      resizeHeight: null,
      slackWidth: null,
      slackHeight: null,
      totalDrag: null,
    }

    // State directly affects the rendered view.
    this.state = {
      moveX: null,
      moveY: null,
      resizeWidth: null,
      resizeHeight: null,
      loading: false,
      imagePath: null
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
    log('render')

    const { card, dragState } = this.props

    const style = {
      width: dragState.resizeWidth ? dragState.resizeWidth : card.width,
      height: dragState.resizeHeight ? dragState.resizeHeight : card.height,
      position: 'absolute',
      left: Number.isInteger(dragState.moveX) ? dragState.moveX : card.x,
      top: Number.isInteger(dragState.moveY) ? dragState.moveY : card.y
    }

    return (
      <div
        id={`card-${card.id}`}
        className={classNames('card', card.type, this.props.selected ? 'selected' : 'unselected')}
        style={style}
        onContextMenu={e => e.stopPropagation()}
      >
        {card.type === 'text' ? this.renderTextInner(card) : this.renderImageInner(this.state)}
        <span className="cardResizeHandle" />
      </div>
    )
  }

  renderTextInner() {
    return (
      <CodeMirrorEditor
        cardId={this.props.card.id}
        cardHeight={this.props.card.height}
        uniquelySelected={this.props.uniquelySelected}
        text={this.props.card.text}
      />
    )
  }

  renderImageInner(state) {
    if (state.loading) {
      return <h3>Loading</h3>
    }
    return <img className="image" alt="" src={state.imagePath} />
  }
}
