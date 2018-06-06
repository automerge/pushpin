import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'

export default class Whiteboard extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(doc) {
    doc.paths = []
  }

  constructor() {
    super()

    this.handle = null

    this.canvas = React.createRef()
    this.whiteboard = React.createRef()

    this.state = { paths: [], currentPath: [], drawing: false, width: 400, height: 400 }

    this.pointerDown = this.pointerDown.bind(this)
    this.pointerUp = this.pointerUp.bind(this)
    this.pointerMove = this.pointerMove.bind(this)
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => {
      this.setState({ paths: doc.paths })
    })
  }

  componentDidUpdate() {
    const ctx = this.canvas.current.getContext('2d')
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.state.paths) {
      this.state.paths.forEach(path => {
        this.drawPath(path)
      })
    }

    this.drawPath(this.state.currentPath, { lineWidth: 5, strokeStyle: '#CCC' })
  }

  drawPath(path, { lineWidth = 10, strokeStyle = "black" }={}) {
    const ctx = this.canvas.current.getContext('2d')
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeStyle

    ctx.beginPath()

    path.forEach(coord => {
      ctx.lineTo(coord[0], coord[1])
      ctx.stroke()
    })
  }

  pointerDown(e) {
    e.preventDefault()
    this.setState({ drawing: true })
  }

  pointerMove(e) {
    e.preventDefault()

    if (!this.state.drawing)
      return

    const { x, y } = this.canvas.current.getBoundingClientRect()
    const { clientX, clientY } = e

    const drawX = clientX - x
    const drawY = clientY - y

    const currentPath = [ ...this.state.currentPath, [drawX, drawY]]
    this.setState({ currentPath })
  }

  pointerUp(e) {
    e.preventDefault()

    const newPath  = this.state.currentPath
    const paths = [...this.state.paths, newPath ]
    const drawing = false

    this.setState({ drawing, paths, currentPath: [] }, () => {
      this.handle.change((doc) => {
        doc.paths.push(newPath)
      })
    })
  }

  render() {
    const style = {
      width: `${this.state.width}px`,
      height: `${this.state.height}px`,
    }

    return <div className="Whiteboard" ref={this.whiteboard} style={style}>
      <canvas
        width={this.state.width}
        height={this.state.height}
        ref={this.canvas}
        onPointerDown={this.pointerDown}
        onPointerMove={this.pointerMove}
        onPointerUp={this.pointerUp}
      />
    </div>
  }
}

ContentTypes.register({
  component: Whiteboard,
  type: 'whiteboard',
  name: 'Whiteboard',
  icon: 'paint-brush',
  resizable: false
})

