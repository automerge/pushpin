import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { ipcRenderer } from 'electron'

import ContentTypes from '../content-types'
import Content from './content'

const log = Debug('pushpin:app')

export default class App extends React.PureComponent {
  static propTypes = {
    doc: PropTypes.shape({
      boardId: PropTypes.string.isRequired,
      selfId: PropTypes.string.isRequired
    }).isRequired,
    docId: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)

    ipcRenderer.on('newDocument', () => {
      const docId = Content.initializeContentDoc('board', { selfId: this.props.doc.selfId })
      this.props.onChange(d => { d.boardId = docId })
    })
  }

  render() {
    log('render')

    return (
      <div>
        <Content type="title-bar" docId={this.props.docId} />
        <Content type="board" docId={this.props.doc.boardId} />
      </div>
    )
  }
}

ContentTypes.register({
  component: App,
  type: 'app',
  name: 'App',
  icon: 'sticky-note',
  unlisted: true,
})
