import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { ipcRenderer } from 'electron'

import { USER } from '../constants'
import ContentTypes from '../content-types'
import Content from './content'

const log = Debug('pushpin:workspace')

export default class Workspace extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
    doc: PropTypes.shape({
      selfId: PropTypes.string,
      boardId: PropTypes.string,
      contactIds: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    onChange: PropTypes.func.isRequired
  }

  static initializeDocument(onChange) {
    const identity = window.hm.create()
    const selfId = window.hm.getId(identity)
    window.hm.change(identity, (i) => {
      i.name = `The Mysterious ${USER}`
      i.docId = selfId
    })

    const boardId = Content.initializeContentDoc('board', { selfId })

    onChange((ws) => {
      ws.selfId = selfId
      ws.boardId = 'pushpin://board/' + boardId
      ws.contactIds = []
    })
  }

  constructor() {
    log('constructor')
    super()

    ipcRenderer.on('newDocument', () => {
      const docId = Content.initializeContentDoc('board', { selfId: this.props.doc.selfId })
      this.props.onChange((ws) => {
        ws.boardId = docId
      })
    })
  }

  render() {
    log('render')
    return (
      <div>
        <Content url={`pushpin://title-bar/${this.props.docId}`} />
        <Content url={this.props.doc.boardId} />
      </div>
    )
  }
}

ContentTypes.register({
  component: Workspace,
  type: 'workspace',
  name: 'Workspace',
  icon: 'briefcase',
  resizable: false,
  unlisted: true,
})
