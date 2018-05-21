import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Debug from 'debug'

import Content from './content'

const log = Debug('pushpin:card')

/**
 * Card
 *
 * A card's responsibility is to keep track of dragging, selection, and position,
 * and to host a piece of <Content/>.
 *
 */
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
      width: PropTypes.number
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
        <Content
          card={this.props.card}
          uniquelySelected={this.props.uniquelySelected}
        />
        <span className="cardResizeHandle" />
      </div>
    )
  }
}
