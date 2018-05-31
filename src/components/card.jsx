import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Debug from 'debug'

import Content from './content'
import ContentTypes from '../content-types'

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
      id: PropTypes.string,
      type: PropTypes.string,
      docId: PropTypes.string,
      x: PropTypes.number,
      y: PropTypes.number,
      height: PropTypes.number,
      width: PropTypes.number
    }).isRequired
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.stopPropagation = this.stopPropagation.bind(this)
  }

  stopPropagation(e) {
    e.stopPropagation()
  }

  render() {
    log('render')

    const { card, dragState } = this.props

    const style = {
      width: Number.isInteger(dragState.resizeWidth) ? dragState.resizeWidth : card.width,
      height: Number.isInteger(dragState.resizeHeight) ? dragState.resizeHeight : card.height,
      position: 'absolute',
      left: Number.isInteger(dragState.moveX) ? dragState.moveX : card.x,
      top: Number.isInteger(dragState.moveY) ? dragState.moveY : card.y
    }

    const { type } = card
    const contentType = ContentTypes
      .list({ withUnlisted: true })
      .find(contentType => contentType.type === type)

    return (
      <div
        id={`card-${card.id}`}
        className={classNames('card', card.type, this.props.selected ? 'selected' : 'unselected')}
        style={style}
        onContextMenu={this.stopPropagation}
      >
        <Content
          type={this.props.card.type}
          docId={this.props.card.docId}
          uniquelySelected={this.props.uniquelySelected}
        />
        { contentType.resizable !== false && <span className="cardResizeHandle" /> }
      </div>
    )
  }
}
