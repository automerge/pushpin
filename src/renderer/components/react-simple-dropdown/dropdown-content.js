import React, { Component } from 'react'
import PropTypes from 'prop-types'

/* eslint-disable-next-line react/prefer-stateless-function  */
class DropdownContent extends Component {
  render() {
    const { children, className, ...dropdownContentProps } = this.props
    dropdownContentProps.className = `dropdown__content ${className}`

    // eslint-disable-next-line react/jsx-filename-extension
    return <div {...dropdownContentProps}>{children}</div>
  }
}

DropdownContent.displayName = 'DropdownContent'

DropdownContent.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

DropdownContent.defaultProps = {
  className: '',
}

export default DropdownContent
