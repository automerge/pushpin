import React from 'react'

interface Props {
  onCatch(error: Error, errorInfo: React.ErrorInfo): void
}

export default class Crashable extends React.PureComponent<Props> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onCatch(error, errorInfo)
  }

  render() {
    return this.props.children
  }
}
