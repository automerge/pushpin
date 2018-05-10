import React from 'react'
import PropTypes from 'prop-types'
import { DraggableCore } from 'react-draggable'
import classNames from 'classnames'
import Debug from 'debug'

import CodeMirrorEditor from './code-mirror-editor'
import Loop from '../loop'
import * as Model from '../model'

const log = Debug('pushpin:card')

export default class Card extends React.PureComponent {
  static propTypes = {
    selected: PropTypes.bool.isRequired,
    uniquelySelected: PropTypes.bool.isRequired,
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

    this.onStart = this.onStart.bind(this)
    this.onDrag = this.onDrag.bind(this)
    this.onStop = this.onStop.bind(this)
  }

  componentDidMount() {
    if (this.props.card.type === 'image') {
      this.setState({ loading: true }, () => {
        Model.fetchImage(this.props.card.hyperfile, (error, imagePath) => {
          if (error) {
            log(error)
          }

          this.setState({ loading: false, imagePath: `../${imagePath}` })
        })
      })
    }
  }

  // Copy view-relevant move/resize state over to React.
  setDragState() {
    if (this.tracking.moving) {
      this.setState({
        moveX: this.tracking.moveX,
        moveY: this.tracking.moveY
      })
    }

    if (this.tracking.resizing) {
      this.setState({
        resizeWidth: this.tracking.resizeWidth,
        resizeHeight: this.tracking.resizeHeight
      })
    }
  }

  onStart(e, d) {
    log('onStart')

    const clickX = d.lastX
    const clickY = d.lastY
    const { card } = this.props

    this.tracking.resizing = ((clickX >= (card.x + card.width - Model.RESIZE_HANDLE_SIZE)) &&
                              (clickX <= (card.x + card.width)) &&
                              (clickY >= (card.y + card.height - Model.RESIZE_HANDLE_SIZE)) &&
                              (clickY <= (card.y + card.height)))
    this.tracking.moving = !this.tracking.resizing

    this.tracking.totalDrag = 0

    if (this.tracking.moving) {
      this.tracking.moveX = card.x
      this.tracking.moveY = card.y
      this.tracking.slackX = 0
      this.tracking.slackY = 0
      this.effectDrag(d)
    }

    if (this.tracking.resizing) {
      this.tracking.resizeWidth = card.width
      this.tracking.resizeHeight = card.height
      this.tracking.slackWidth = 0
      this.tracking.slackHeight = 0
      this.effectDrag(d)
    }

    this.setDragState()
  }

  effectDrag(d) {
    if (!this.tracking.resizing && !this.tracking.moving) {
      throw new Error('Did not expect drag without resize or move')
    }
    if (this.tracking.resizing && this.tracking.moving) {
      throw new Error('Did not expect drag with both resize and move')
    }

    const { deltaX, deltaY } = d
    if ((deltaX === 0) && (deltaY === 0)) {
      return
    }

    this.tracking.totalDrag = this.tracking.totalDrag + Math.abs(deltaX) + Math.abs(deltaY)

    const { card } = this.props

    if (this.tracking.moving) {
      // First guess at change in location given mouse movements.
      const preClampX = this.tracking.moveX + deltaX
      const preClampY = this.tracking.moveY + deltaY

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newX = preClampX + this.tracking.slackX
      let newY = preClampY + this.tracking.slackY

      // Clamp to ensure card doesn't move beyond the board.
      newX = Math.max(newX, 0)
      newX = Math.min(newX, Model.BOARD_WIDTH - card.width)
      this.tracking.moveX = newX
      newY = Math.max(newY, 0)
      newY = Math.min(newY, Model.BOARD_HEIGHT - card.height)
      this.tracking.moveY = newY

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      this.tracking.slackX = this.tracking.slackX + preClampX - newX
      this.tracking.slackY = this.tracking.slackY + preClampY - newY
    }

    if (this.tracking.resizing) {
      // First guess at change in dimensions given mouse movements.
      let preClampWidth = this.tracking.resizeWidth + deltaX
      let preClampHeight = this.tracking.resizeHeight + deltaY

      // Maintain aspect ratio on image cards.
      if (card.type !== 'text') {
        const ratio = this.tracking.resizeWidth / this.tracking.resizeHeight
        preClampHeight = preClampWidth / ratio
        preClampWidth = preClampHeight * ratio
      }

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newWidth = preClampWidth + this.tracking.slackWidth
      let newHeight = preClampHeight + this.tracking.slackHeight

      // Clamp to ensure card doesn't resize beyond the board or min dimensions.
      newWidth = Math.max(Model.CARD_MIN_WIDTH, newWidth)
      newWidth = Math.min(Model.BOARD_WIDTH - card.x, newWidth)
      this.tracking.resizeWidth = newWidth
      newHeight = Math.max(Model.CARD_MIN_HEIGHT, newHeight)
      newHeight = Math.min(Model.BOARD_HEIGHT - card.y, newHeight)
      this.tracking.resizeHeight = newHeight

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      this.tracking.slackWidth = this.tracking.slackWidth + preClampWidth - newWidth
      this.tracking.slackHeight = this.tracking.slackHeight + preClampHeight - newHeight
    }
  }

  onDrag(e, d) {
    log('onDrag')
    this.effectDrag(d)
    this.setDragState()
  }

  onStop(e, d) {
    log('onStop')

    this.effectDrag(d)

    const { card } = this.props

    const minDragSelection = this.tracking.totalDrag < Model.GRID_SIZE / 2
    if (minDragSelection) {
      if (e.ctrlKey || e.shiftKey) {
        Loop.dispatch(Model.cardToggleSelection, { id: this.props.card.id })
      } else {
        Loop.dispatch(Model.cardUniquelySelected, { id: this.props.card.id })
      }
    }
    this.tracking.totalDrag = null

    if (this.tracking.moving) {
      this.tracking.moveX = Model.snapToGrid(this.tracking.moveX)
      this.tracking.moveY = Model.snapToGrid(this.tracking.moveY)
      this.setDragState()
      Loop.dispatch(Model.cardMoved, {
        id: card.id,
        x: this.tracking.moveX,
        y: this.tracking.moveY
      })
      this.tracking.moveX = null
      this.tracking.moveY = null
      this.tracking.slackX = null
      this.tracking.slackY = null
      this.tracking.moving = false
    }

    if (this.tracking.resizing) {
      this.tracking.resizeWidth = Model.snapToGrid(this.tracking.resizeWidth)
      this.tracking.resizeHeight = Model.snapToGrid(this.tracking.resizeHeight)
      this.setDragState()
      Loop.dispatch(Model.cardResized, {
        id: card.id,
        width: this.tracking.resizeWidth,
        height: this.tracking.resizeHeight
      })
      this.tracking.resizeWidth = null
      this.tracking.resizeHeight = null
      this.tracking.slackWidth = null
      this.tracking.slackHeight = null
      this.tracking.resizing = false
    }
  }

  render() {
    log('render')

    const { card } = this.props
    const style = {
      width: this.state.resizeWidth || card.width,
      height: this.state.resizeHeight || card.height,
      position: 'absolute',
      // move{X,Y} may be 0 which is falsy in JS, so can't use || here.
      left: this.state.moveX !== null ? this.state.moveX : card.x,
      top: this.state.moveY !== null ? this.state.moveY : card.y,
    }

    return (
      <DraggableCore
        allowAnyClick={false}
        disabled={false}
        enableUserSelectHack={false}
        onStart={this.onStart}
        onDrag={this.onDrag}
        onStop={this.onStop}
      >
        <div
          id={`card-${card.id}`}
          className={classNames('card', card.type, this.props.selected ? 'selected' : 'unselected')}
          style={style}
          onContextMenu={e => e.stopPropagation()}
        >
          {card.type === 'text' ? this.renderTextInner(card) : this.renderImageInner(this.state)}
          <span className="cardResizeHandle" />
        </div>
      </DraggableCore>
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
