import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Debug from 'debug'

import Content from './content'
import ContentTypes from '../content-types'
import { parseDocumentLink } from '../share-link'

const log = Debug('pushpin:card')

export default class Card extends React.PureComponent {
  static propTypes = {
    selected: PropTypes.bool.isRequired,
    uniquelySelected: PropTypes.bool.isRequired,
    onCardClicked: PropTypes.func.isRequired,
    onCardDoubleClicked: PropTypes.func.isRequired,
    dragState: PropTypes.shape({
      moveX: PropTypes.number,
      moveY: PropTypes.number,
      resizeWidth: PropTypes.number,
      resizeHeight: PropTypes.number,
    }).isRequired,
    card: PropTypes.shape({
      id: PropTypes.string,
      url: PropTypes.string,
      x: PropTypes.number,
      y: PropTypes.number,
      height: PropTypes.number,
      width: PropTypes.number
    }).isRequired
  }

  constructor(props) {
    super(props)
    log('constructor')

    this.onClick = this.onClick.bind(this)
    this.onDoubleClick = this.onDoubleClick.bind(this)
    this.stopPropagation = this.stopPropagation.bind(this)
  }

  // We also delegate these actions to the board, because
  // the board is responsible for managing selection state.
  onClick(e) {
    this.props.onCardClicked(e, this.props.card)
  }
  onDoubleClick(e) {
    this.props.onCardDoubleClicked(e, this.props.card)
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

    const { type } = parseDocumentLink(card.url)
    const contentType = ContentTypes
      .list({ withUnlisted: true })
      .find(contentType => contentType.type === type)

    return (
      <div
        tabIndex="-1"
        id={`card-${card.id}`}
        className={classNames('card', card.type, this.props.selected ? 'selected' : 'unselected')}
        style={style}
        onClick={this.onClick}
        onContextMenu={this.stopPropagation}
      >
        <Content
          url={this.props.card.url}
          uniquelySelected={this.props.uniquelySelected}
        />
        {contentType && contentType.resizable !== false && <span className="cardResizeHandle" />}
      </div>
    )
  }
}
