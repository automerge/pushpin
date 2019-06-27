import React from 'react'
import PropTypes from 'prop-types'

import './Label.css'


export default function Label(props) {
  return (
    <div className="Label">{props.children}</div>
  )
}

Label.propTypes = {
  children: PropTypes.node.isRequired
}
