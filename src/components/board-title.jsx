import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'
import { RIEInput } from 'riek'

import ContentTypes from '../content-types'

const log = Debug('pushpin:board-title')

export default class BoardTitle extends React.Component {
  static propTypes = {
    doc: PropTypes.shape({
      title: PropTypes.string,
    }).isRequired,
    onChange: PropTypes.func.isRequired,
  }

  constructor() {
    super()
    this.onChangeTitle = this.onChangeTitle.bind(this)
  }

  onChangeTitle({ title }) {
    log('onChangeTitle')
    this.props.onChange((b) => {
      b.title = title
    })
  }

  render() {
    return (<RIEInput
      value={this.props.doc.title || ''}
      change={this.onChangeTitle}
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
