import React from 'react'
import PropTypes from 'prop-types'

import { CustomPicker } from 'react-color'
import { Swatch } from 'react-color/lib/components/common'

/* This class is adapted from the react-color TwitterPicker
   by stripping out most of the functionality and just leaving swatches */
class ColorPicker extends React.PureComponent {
  static defaultProps = {
    colors: [],
    onChange: () => {}
  }

  static propTypes = {
    colors: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func
  }

  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(hexcode, e) {
    this.props.onChange({
      hex: hexcode,
      source: 'hex',
    }, e)
  }

  render() {
    const swatches = this.props.colors.map((c) => (
      <div key={c} className="ColorPicker__swatch">
        <Swatch
          color={c}
          hex={c}
          onClick={this.handleChange}
          focusStyle={{ boxShadow: `0 0 4px ${c}` }}
        />
      </div>
    ))

    return (
      <div className="ColorPicker" >
        { swatches }
      </div>
    )
  }
}

export default CustomPicker(ColorPicker)
