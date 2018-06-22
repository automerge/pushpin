import React from 'react'
import PropTypes from 'prop-types'

export default class BoardTitleInput extends React.PureComponent {
  static propTypes = {
    defaultValue: PropTypes.string.isRequired,
    active: PropTypes.bool,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    onClick: PropTypes.func
  }

  static defaultProps = {
    active: false,
    onSubmit: () => {},
    onCancel: () => {},
    onClick: () => {}
  }

  state = { newTitle: null, updated: false }
  input = React.createRef()

  componentDidUpdate = (prevProps) => {
    if (this.props.active && !prevProps.active) {
      this.input.current.focus()
    }
  }

  handleKey = (e) => {
    const { newTitle } = this.state

    if (e.key === 'Enter') {
      if (newTitle) {
        this.props.onSubmit(newTitle)
        this.setState({ newTitle: null, updated: true }, () => {
          setTimeout(() => this.setState({ updated: false }), 1000)
        })
      } else {
        this.setState({ newTitle: null })
        this.props.onCancel()
      }

      this.input.current.blur()
    }

    if (e.key === 'Escape') {
      this.props.onCancel()
      this.input.current.blur()
      this.setState({ newTitle: null })
    }
  }

  handleChange = (e) => {
    this.setState({ newTitle: e.target.value })
  }

  render = () => {
    let titleInputClasses = 'TitleBar__titleText'
    if (this.state.updated) {
      titleInputClasses += ' TitleBar__titleText--updated'
    }

    let title = ''
    if (this.state.newTitle !== null) {
      title = this.state.newTitle
    } else if (this.props.defaultValue) {
      title = this.props.defaultValue
    }

    return (
      <input
        ref={this.input}
        type="text"
        className={titleInputClasses}
        value={title}
        onChange={this.handleChange}
        onKeyDown={this.handleKey}
        onClick={this.props.onClick}
      />
    )
  }
}
