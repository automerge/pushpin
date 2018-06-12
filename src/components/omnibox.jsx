import React from 'react'

export default class Omnibox extends React.PureComponent {
  componentDidMount = () => {
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount = () => {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  state = { visible: false }

  onKeyDown = (e) => {
    if (e.metaKey && e.key === '/') {
      this.setState({ visible: !this.state.visible })
    }
  }

  render() {
    if (!this.state.visible) {
      return null
    }

    return <div className="Omnibox">
      <h1>Omnibox</h1>
    </div>
  }
}
