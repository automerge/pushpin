import React from 'react'
import { connect } from 'react-redux'
import { DraggableCore } from 'react-draggable'
import classNames from 'classnames'
import ReactMarkdown from 'react-markdown'

import InlineEditor from './inline-editor'
import { CARD_DRAG_STARTED, CARD_DRAG_MOVED, CARD_DRAG_STOPPED } from './action-types'

class CardPresentation extends React.Component {
  constructor(props) {
    super(props)
    this.lastHeight = 0
  }

  componentDidMount() {
    this.checkTextHeight()
  }

  componentDidUpdate() {
    this.checkTextHeight()
  }

  checkTextHeight() {
    if (this.props.card.get('type') === 'text') {
      // console.log(this.props, this.props.children)
      // const newHeight = this.props.children[0].clientHeight
      // if (this.lastHeight != newHeight) {
      //   this.props.onTextResized(props.card, newHeight)
      //   this.lastHeight = newHeight
      // }
    }
  }

  renderTextInner() {
    const card = this.props.card
    if (card.get('selected')) {
      return (
        <InlineEditor
          cardId={card.get('id')}
          editorState={card.get('editorState')}
          createFocus={card.get('selected')}
        />
      )
    } else {
      const mdText = card.get('editorState').getCurrentContent().getPlainText('\n')
      return (
        <ReactMarkdown
          source={mdText}
          className={'renderedMarkdown'}
        />
      )
    }
  }

  renderImageInner() {
    return (
      <img
        className='image'
        src={this.props.card.get('path')}
      />
    )
  }

  render() {
    const card = this.props.card
    return (
      <DraggableCore
        allowAnyClick={false}
        disabled={false}
        enableUserSelectHack={false}
        onStart={(e, d) => this.props.onStart(card, e, d)}
        onDrag={(e, d) => this.props.onDrag(card, e, d)}
        onStop={(e, d) => this.props.onStop(card, e, d)}
        onMouseDown={(e) => this.props.onMouseDown(card, e)}
      >
        <div
          id={`card-${card.get('id')}`}
          className={classNames('card', card.get('selected') ? 'selected' : 'unselected')}
          style={{
            width: card.get('width'),
            height: card.get('height'),
            position: 'absolute',
            left: card.get('x'),
            top: card.get('y')
          }}>
          { card.get('type') === 'text' ? this.renderTextInner(card) : this.renderImageInner(card) }
          <span className='cardResizeHandle' />
        </div>
      </DraggableCore>
    )
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onMouseDown: (card, e) => {
      console.log('card.onMouseDown')
    },
    onStart: (card, e, d) => {
      if (d.deltaX != 0 || d.deltaY != 0) {
        throw new Error(`Did not expect delta in onStart`)
      }
      console.log('card.onStart.start')
      dispatch({ type: CARD_DRAG_STARTED, id: card.get('id'), x: d.lastX, y: d.lastY })
      console.log('card.onStart.finish')
    },
    onDrag: (card, e, d) => {
      if (d.deltaX != 0 || d.deltaY != 0) {
        dispatch({ type: CARD_DRAG_MOVED, id: card.get('id'), deltaX: d.deltaX, deltaY: d.deltaY })
      }
    },
    onStop: (card, e, d) => {
      if (d.deltaX != 0 || d.deltaY != 0) {
        throw new Error(`Did not expect delta in onStart`)
      }
      console.log('card.onStop.start')
      dispatch({ type: CARD_DRAG_STOPPED, id: card.get('id') })
      console.log('card.onStop.finish')
    },
    onTextResized: (card, height) => {
      console.log('card.onTextResized.start')
      dispatch({type: CARD_TEXT_RESIZED, id: card.get('id'), height: height})
      console.log('card.onTextResized.finish')
    },
  }
}

const Card = connect(null, mapDispatchToProps)(CardPresentation)

export default Card
