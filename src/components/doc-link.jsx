import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'
import { createDocumentLink } from '../share-link'

export default class DocLink extends React.PureComponent {
  static propTypes = {
    onClick: PropTypes.func
  }

  static defaultProps = {
    onClick: () => {}
  }

  constructor() {
    super()

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(e) {
    this.props.onClick(createDocumentLink('board', this.props.docId), e)
  }

  render() {
    return (
      <div className="DocLink" onClick={this.handleClick}>
        <i className="fa fa-files-o" style={{ background: this.props.doc.backgroundColor }} />
        <div className="DocLink__title">{ this.props.doc.title }</div>
      </div>
    )
  }
}

ContentTypes.register({
  component: DocLink,
  type: 'doc-link',
  name: 'Document Link',
  icon: 'sticky-note',
  unlisted: true,
})
