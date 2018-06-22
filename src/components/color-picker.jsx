import React from 'react'
import PropTypes from 'prop-types'
import Debug from 'debug'

import { CustomPicker } from 'react-color'
import { Swatch } from 'react-color/lib/components/common'

const log = Debug('pushpin:color-picker')

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

  handleChange = (hexcode, e) => {
    this.props.onChange({
      hex: hexcode,
      source: 'hex',
    }, e)
  }

  render = () => {
    log('render')

    const swatches = this.props.colors.map((c) => (
      <div key={c} className="ColorPicker__swatch">
        <Swatch
          color={c}
          hex={c}
          onClick={this.handleChange}
          focusStyle={{ border: `0 0 4px ${c}` }}
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
