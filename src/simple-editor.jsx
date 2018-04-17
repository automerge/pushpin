import React from 'react'
import { connect } from 'react-redux'
import Rnd from 'react-rnd'
import classNames from 'classnames'
import { Editor, EditorState } from 'draft-js'
import Draggable, { DraggableCore } from 'react-draggable'

const RESIZE_HANDLE_SIZE = 14

class SimpleEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      x: 100,
      y: 50,
      width: 300,
      height: 200,
      minWidth: 100,
      minHeight: 100,
      slackWidth: 0,
      slackHeight: 0,
      lockAspectRatio: false,
      resizing: false,
      moving: false,
      editorState: EditorState.createEmpty()
    }
    this.onChange = (editorState) => {
      console.log('onChange')
      this.setState(Object.assign({}, this.state, {editorState: editorState}))
    }
    this.onMouseDown = (e) => {
      console.log('onMouseDown')
    }

    this.onStart = (e, d) => {
      console.log('onStart')
      if (d.deltaX != 0 || d.deltaY != 0) {
        throw new Error(`Did not expect delta in onStart`)
      }
      const resizing = ((d.lastX >= (this.state.x + this.state.width - RESIZE_HANDLE_SIZE)) &&
                        (d.lastX <= (this.state.x + this.state.width)) &&
                        (d.lastY >= (this.state.y + this.state.height - RESIZE_HANDLE_SIZE)) &&
                        (d.lastY <= (this.state.y + this.state.height)))
      const moving = !resizing
      this.setState(Object.assign({}, this.state, {resizing: resizing, moving: moving}))
    }

    this.onDrag = (e, d) => {
      console.log('onDrag')
      if (!this.state.resizing && !this.state.moving) {
        throw new Error(`Did not expect drag without resize or move`)
      }

      if (this.state.resizing) {
        let preMinWidth = this.state.width + d.deltaX
        let preMinHeight = this.state.height + d.deltaY

        if (this.state.lockAspectRatio) {
          const ratio = this.state.width / this.state.height
          preMinHeight = preMinWidth / ratio
          preMinWidth = preMinHeight * ratio
        }

        // Add slack to the values used to calculate bound position. This will
        // ensure that if we start removing slack, the element won't react to
        // it right away until it's been completely removed.
        let newWidth = preMinWidth + this.state.slackWidth
        let newHeight = preMinHeight + this.state.slackHeight

        newWidth = Math.max(this.state.minWidth, newWidth)
        newHeight = Math.max(this.state.minHeight, newHeight)

        // If the numbers changed, we must have introduced some slack.
        // Record it for the next iteration.
        const newSlackWidth = this.state.slackWidth + preMinWidth - newWidth
        const newSlackHeight = this.state.slackHeight + preMinHeight - newHeight

        this.setState(Object.assign({}, this.state, {
          width: newWidth,
          height: newHeight,
          slackWidth: newSlackWidth,
          slackHeight: newSlackHeight
        }))
        return
      }

      if (this.state.moving) {
        const newX = this.state.x + d.deltaX
        const newY = this.state.y + d.deltaY
        this.setState(Object.assign({}, this.state, {x: newX, y: newY}))
        return
      }
    }

    this.onStop = (e, d) => {
      console.log('onStop')
      if (d.deltaX != 0 || d.deltaY != 0) {
        throw new Error(`Did not expect delta in onStart: ${d}`)
      }
      this.setState(Object.assign({}, this.state, {resizing: false, moving: true}))
    }

    this.focus = () => {
      console.log('focus')
      this.refs.editor.focus()
    }
  }

  render() {
    return (
      <div className='board'>
        <DraggableCore
          allowAnyClick={false}
          disabled={false}
          enableUserSelectHack={false}
          onStart={this.onStart}
          onDrag={this.onDrag}
          onStop={this.onStop}
          onMouseDown={this.onMouseDown}
        >
          <div
            className={classNames('card', 'selected')}
            style={{
              width: this.state.width,
              height: this.state.height,
              position: 'absolute',
              left: this.state.x,
              top: this.state.y
            }}>
            <div
              className='editorWrapper'
              onClick={this.focus}
              ref='editorWrapper'>
              <Editor
                className='editor'
                editorState={this.state.editorState}
                onChange={this.onChange}
                ref='editor'
              />
            </div>
            <span className='cardResizeHandle' />
          </div>
        </DraggableCore>
      </div>
    )
  }
}

export default SimpleEditor