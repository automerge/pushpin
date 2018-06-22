import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { DraggableCore } from 'react-draggable'
import classNames from 'classnames'

import Content from '../content'
import ContentTypes from '../../content-types'
import { parseDocumentLink } from '../../share-link'

const log = Debug('pushpin:board-card')

export default class BoardCard extends React.PureComponent {
  constructor(props) {
    super(props)
    log('constructor')
    this.onDrag = (e, d) => { this.props.onDrag(this.props.card, e, d) }
    this.onStop = (e, d) => { this.props.onStop(this.props.card, e, d) }
    this.onCardClicked = (e) => { this.props.onCardClicked(e, this.props.card) }
    this.onCardDoubleClicked = (e) => { this.props.onCardDoubleClicked(e, this.props.card) }
    this.setCardRef = (node) => { this.props.setCardRef(this.props.id, node) }
  }

  static propTypes = {
    selected: PropTypes.bool.isRequired,
    uniquelySelected: PropTypes.bool.isRequired,
    onDrag: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    onCardClicked: PropTypes.func.isRequired,
    onCardDoubleClicked: PropTypes.func.isRequired,
    setCardRef: PropTypes.func.isRequired,
    remoteSelected: PropTypes.arrayOf(PropTypes.string).isRequired,
    dragState: PropTypes.shape({
      moveX: PropTypes.number,
      moveY: PropTypes.number,
      resizeWidth: PropTypes.number,
      resizeHeight: PropTypes.number,
    }),
    id: PropTypes.string.isRequired,
    card: PropTypes.shape({
      id: PropTypes.string,
      url: PropTypes.string,
      x: PropTypes.number,
      y: PropTypes.number,
      height: PropTypes.number,
      width: PropTypes.number
    }).isRequired
  }

  static defaultProps = {
    dragState: {}
  }

  stopPropagation = (e) => {
    e.stopPropagation()
  }

  render = () => {
    log('render')

    const { card, dragState } = this.props

    const style = {
      width: Number.isInteger(dragState.resizeWidth) ? dragState.resizeWidth : card.width,
      height: Number.isInteger(dragState.resizeHeight) ? dragState.resizeHeight : card.height,
      position: 'absolute',
      left: Number.isInteger(dragState.moveX) ? dragState.moveX : card.x,
      top: Number.isInteger(dragState.moveY) ? dragState.moveY : card.y,
    }
    if (this.props.remoteSelected.length > 0) {
      const contactHandle = window.hm.openHandle(this.props.remoteSelected[0])
      const contact = contactHandle.get()
      if (contact) {
        style['--highlight-color'] = contact.color
      }
    }

    const { type } = parseDocumentLink(card.url)
    const context = 'board'
    const contentType = ContentTypes.lookup({ type, context })

    const selected = this.props.selected || this.props.remoteSelected.length > 0

    return (
      <DraggableCore
        key={this.props.id}
        allowAnyClick={false}
        disabled={false}
        enableUserSelectHack={false}
        onDrag={this.onDrag}
        onStop={this.onStop}
      >
        <div
          ref={this.setCardRef}
          tabIndex="-1"
          id={`card-${card.id}`}
          className={classNames('card', card.type, selected ? 'selected' : 'unselected')}
          style={style}
          onClick={this.onCardClicked}
          onDoubleClick={this.onCardDoubleClicked}
          onContextMenu={this.stopPropagation}
        >
          <Content
            context="board"
            url={this.props.card.url}
            uniquelySelected={this.props.uniquelySelected}
          />
          { contentType && contentType.resizable !== false && <span className="cardResizeHandle" /> }
        </div>
      </DraggableCore>
    )
  }
}
