import React from 'react'
import TitleEditor from '../TitleEditor'
import { BoardDoc } from '.'
import { ContentProps } from '../Content'
import { Handle } from 'hypermerge'
 
interface EditableContentProps extends ContentProps {
  editable: boolean
}

interface State {
  doc?: BoardDoc
}

export default class BoardInList extends React.PureComponent<EditableContentProps, State> {
  state: State = {}

  private handle?: Handle<BoardDoc>
  private badgeRef = React.createRef<HTMLElement>()

  onDragStart = (e) => {
    e.dataTransfer.setData('application/pushpin-url', this.props.url)
    e.dataTransfer.setDragImage(this.badgeRef, 0, 0)
  }

  // This is the New Boilerplate
  componentWillMount = () => this.handle = window.repo.watch(
    this.props.hypermergeUrl,
    (doc) => this.onChange(doc)
  )
  componentWillUnmount = () => this.handle && this.handle.close()

  onChange = (doc) => {
    this.setState({ doc })
  }

  render = () => {
    if (!this.state || !this.state.doc) {
      return null
    }
    const { title, backgroundColor } = this.state.doc

    return (
      <div draggable onDragStart={this.onDragStart} className="DocLink">
        <i ref={this.badgeRef} className="Badge fa fa-files-o" style={{ background: backgroundColor }} />
    {this.props.editable ? (
      <TitleEditor url={this.props.hypermergeUrl} />
    ) : (
      <div className="DocLink__title">{title}</div>)}
    </div>)
  }
}
