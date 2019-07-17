import React, { Component } from 'react'
import PropTypes from 'prop-types'

// eslint-disable-next-line react/prefer-stateless-function
class DropdownTrigger extends Component {
  render() {
    const { children, className, ...dropdownTriggerProps } = this.props
    dropdownTriggerProps.className = `dropdown__trigger ${className}`

    // eslint-disable-next-line react/jsx-filename-extension
    return <a {...dropdownTriggerProps}>{children}</a>
  }
}

DropdownTrigger.displayName = 'DropdownTrigger'

DropdownTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

DropdownTrigger.defaultProps = {
  className: '',
}

export default DropdownTrigger
