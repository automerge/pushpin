import React from 'react'
import { connect } from 'react-redux'
import { DraggableCore } from 'react-draggable'
import classNames from 'classnames'
import Path from 'path'
import Fs from 'fs'
import Debug from 'debug'

const USER = process.env.NAME || "userA"
const USER_PATH = Path.join(".", USER)
const HYPERFILE_DATA_PATH = Path.join(USER_PATH, "hyperfile")
const CACHE_PATH = Path.join(USER_PATH, "hyperfile-cache")

if(!Fs.existsSync(USER_PATH))
  Fs.mkdirSync(USER_PATH)

if(!Fs.existsSync(CACHE_PATH))
  Fs.mkdirSync(CACHE_PATH)

import { snapToGrid, BOARD_WIDTH, BOARD_HEIGHT, GRID_SIZE, CARD_MIN_WIDTH, CARD_MIN_HEIGHT, RESIZE_HANDLE_SIZE } from '../model'
import InlineEditor from './inline-editor'
import { CARD_UNIQUELY_SELECTED, CARD_MOVED, CARD_RESIZED } from '../action-types'
import HyperFile from "../hyper-file"

function copyFile(source, destination, callback) {
  Fs.readFile(source, (err, data) => {
    Fs.writeFile(destination, data, (err) => {
      callback()
    })
  })
}

const log = Debug('pushpin:card')

class CardPresentation extends React.Component {

  constructor(props) {
    super(props)
    log('constructor')
    this.state = {
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
      loading: false,
      imagePath: null
    }

    if(props.card.hypercore.imageId) {
      this.state.loading = true
      this.loadHypercoreData()
    }
  }

  loadHypercoreData() {
    let card = this.props.card

    HyperFile.fetch(HYPERFILE_DATA_PATH, card.hypercore.imageId, card.hypercore.key, (error, blobPath) => {
      if(error)
        log(error)

      const imagePath = Path.join(CACHE_PATH, card.hypercore.imageId + card.hypercore.imageExt)
      copyFile(blobPath, imagePath, () => {
        this.setState({ loading: false, imagePath: "../" + imagePath })
      })
    })
  }

  componentWillReceiveProps(props) {
    log('componentWillReceiveProps')
  }

  onMouseDown(e) {
    log('onMouseDown')
  }

  onStart(e, d) {
    log('onStart')

    if (d.deltaX != 0 || d.deltaY != 0) {
      throw new Error(`Did not expect delta in onStart`)
    }

    const clickX = d.lastX
    const clickY = d.lastY
    const card = this.props.card
    const resizing = ((clickX >= (card.x + card.width - RESIZE_HANDLE_SIZE)) &&
                      (clickX <= (card.x + card.width)) &&
                      (clickY >= (card.y + card.height - RESIZE_HANDLE_SIZE)) &&
                      (clickY <= (card.y + card.height)))

    const updates = {}
    updates.resizing = resizing
    updates.moving = !resizing
    updates.totalDrag = 0

    if (updates.moving) {
      updates.moveX = card.x
      updates.moveY = card.y
      updates.slackX = 0
      updates.slackY = 0
    }

    if (updates.resizing) {
      updates.resizeWidth = card.width
      updates.resizeHeight = card.height
      updates.slackWidth = 0
      updates.slackHeight = 0
    }

    this.setState(updates)
  }

  onDrag(e, d) {
    log('onDrag')

    if (!this.state.resizing && !this.state.moving) {
      throw new Error(`Did not expect drag without resize or move`)
    }
    if (this.state.resizing && this.state.moving) {
      throw new Error(`Did not expect drag with both resize and move`)
    }

    const deltaX = d.deltaX
    const deltaY = d.deltaY
    if ((deltaX === 0) && (deltaY === 0)) {
      return
    }

    const card = this.props.card
    const updates = {}

    if (this.state.moving) {
      // First guess at change in location given mouse movements.
      let preClampX = this.state.moveX + deltaX
      let preClampY = this.state.moveY + deltaY

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newX = preClampX + this.state.slackX
      let newY = preClampY + this.state.slackY

      // Clamp to ensure card doesn't move beyond the board.
      newX = Math.max(newX, 0)
      newX = Math.min(newX, BOARD_WIDTH - card.width)
      newY = Math.max(newY, 0)
      newY = Math.min(newY, BOARD_HEIGHT - card.height)

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      const newSlackWidth = this.state.slackX + preClampX - newX
      const newSlackHeight = this.state.slackY + preClampY - newY

      updates.moveX = newX
      updates.moveY = newY
      updates.slackX = newSlackWidth
      updates.slackY = newSlackHeight
    }

    if (this.state.resizing) {
      // First guess at change in dimensions given mouse movements.
      let preClampWidth = this.state.resizeWidth + deltaX
      let preClampHeight = this.state.resizeHeight + deltaY

      // Maintain aspect ratio on image cards.
      if (card.type !== 'text') {
        const ratio = this.state.resizeWidth / this.state.resizeHeight
        preClampHeight = preClampWidth / ratio
        preClampWidth = preClampHeight * ratio
      }

      // Add slack to the values used to calculate bound position. This will
      // ensure that if we start removing slack, the element won't react to
      // it right away until it's been completely removed.
      let newWidth = preClampWidth + this.state.slackWidth
      let newHeight = preClampHeight + this.state.slackHeight

      // Clamp to ensure card doesn't resize beyond the board or min dimensions.
      newWidth = Math.max(CARD_MIN_WIDTH, newWidth)
      newWidth = Math.min(BOARD_WIDTH - card.x, newWidth)
      newHeight = Math.max(CARD_MIN_HEIGHT, newHeight)
      newHeight = Math.min(BOARD_HEIGHT - card.y, newHeight)

      // If the numbers changed, we must have introduced some slack.
      // Record it for the next iteration.
      const newSlackWidth = this.state.slackWidth + preClampWidth - newWidth
      const newSlackHeight = this.state.slackHeight + preClampHeight - newHeight

      updates.resizeWidth = newWidth
      updates.resizeHeight = newHeight
      updates.slackWidth = newSlackWidth
      updates.slackHeight = newSlackHeight
    }

    updates.totalDrag = this.state.totalDrag + Math.abs(deltaX) + Math.abs(deltaY)

    this.setState(updates)
  }

  onStop(e, d) {
    log('onStop')

    if (d.deltaX != 0 || d.deltaY != 0) {
      throw new Error(`Did not expect delta in onStart`)
    }

    const card = this.props.card
    const minDragSelection = this.state.totalDrag < GRID_SIZE/2

    if (!this.props.selected && minDragSelection) {
      this.props.onSelected(card.id)
    }

    const updates = {}

    if (this.state.moving) {
      const snapX = snapToGrid(this.state.moveX)
      const snapY = snapToGrid(this.state.moveY)
      this.props.onMoved(card.id, snapX, snapY)
      updates.moveX = null
      updates.moveY = null
      updates.slackX = null
      updates.slackY = null
    }

    else if (this.state.resizing) {
      const snapWidth = snapToGrid(this.state.resizeWidth)
      const snapHeight = snapToGrid(this.state.resizeHeight)
      this.props.onResized(card.id, snapWidth, snapHeight)
      updates.resizeWidth = null
      updates.resizeHeight = null
      updates.slackWidth = null
      updates.slackHeight = null
    }

    updates.resizing = false
    updates.moving = false
    updates.totalDrag = null

    this.setState(updates)
  }

  render() {
    log('render')

    const card = this.props.card

    if(this.state.loading)
      return <div 
        className={ classNames('card', card.type, this.props.selected ? 'selected' : 'unselected') }
        style={{
          width: this.state.resizeWidth || card.width,
          height: this.state.resizeHeight || card.height,
          position: 'absolute',
          left: this.state.moveX || card.x,
          top: this.state.moveY || card.y
        }}
      >
        <h3>Loading</h3>
      </div>

    return (
      <DraggableCore
        allowAnyClick={false}
        disabled={false}
        enableUserSelectHack={false}
        onMouseDown={this.onMouseDown.bind(this)}
        onStart={this.onStart.bind(this)}
        onDrag={this.onDrag.bind(this)}
        onStop={this.onStop.bind(this)}
      >
        <div
          id={`card-${card.id}`}
          className={classNames('card', card.type, this.props.selected ? 'selected' : 'unselected')}
          style={{
            width: this.state.resizeWidth || card.width,
            height: this.state.resizeHeight || card.height,
            position: 'absolute',
            left: this.state.moveX || card.x,
            top: this.state.moveY || card.y
          }}>
          { card.type === 'text' ? this.renderTextInner(card) : this.renderImageInner(card) }
          <span className='cardResizeHandle' />
        </div>
      </DraggableCore>
    )
  }

  onLocalHeight(resizeHeight) {
    log('onLocalheight', resizeHeight)
    this.setState({resizeHeight: resizeHeight})
  }

  renderTextInner() {
    return (
      <InlineEditor
        cardId={this.props.card.id}
        text={this.props.card.text}
        selected={this.props.selected}
        onLocalHeight={this.onLocalHeight.bind(this)}
        cardHeight={this.props.card.height}
      />
    )
  }

  renderImageInner() {
    return (
      <img
        className='image'
        src={this.state.imagePath}
      />
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onSelected: (id) => {
      dispatch({type: CARD_UNIQUELY_SELECTED, id: id})
    },
    onMoved: (id, x, y) => {
      dispatch({type: CARD_MOVED, id: id, x: x, y: y})
    },
    onResized: (id, width, height) => {
      dispatch({type: CARD_RESIZED, id: id, width: width, height: height})
    }
  }
}

const Card = connect(null, mapDispatchToProps)(CardPresentation)

export default Card
