import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { RIEInput } from 'riek'

import ContentTypes from '../content-types'

const log = Debug('pushpin:board-title')

export default class BoardTitle extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired,
  }

  constructor() {
    super()
    this.setTitle = this.setTitle.bind(this)
  }

  setTitle({ title }) {
    log('onChangeTitle')
    this.handle.change((b) => {
      b.title = title
    })
  }

  componentWillMount() {
    log('componentWillMount')
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange(doc => this.setState({ doc }))
  }

  render() {
    return (<RIEInput
      value={this.state.doc.title || ''}
      change={this.setTitle}
      propName="title"
      className="TitleBar__titleText"
      classLoading="TitleBar__titleText--loading"
      classInvalid="TitleBar__titleText--invalid"
    />)
  }
}

ContentTypes.register({
  component: BoardTitle,
  type: 'board-title',
  name: 'Board Title',
  icon: 'sticky-note',
  unlisted: true,
})
