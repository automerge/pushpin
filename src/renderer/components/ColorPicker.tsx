import React from 'react'
import Debug from 'debug'

import { CustomPicker } from 'react-color'
import { Swatch } from 'react-color/lib/components/common'

const log = Debug('pushpin:ColorPicker')

interface Props {
  colors: string[]
  onChange(color: { hex: string; source: 'hex' }, e: React.MouseEvent): void
}

/* This class is adapted from the react-color TwitterPicker
   by stripping out most of the functionality and just leaving swatches */
class ColorPicker extends React.PureComponent<Props> {
  static defaultProps = {
    colors: [],
    onChange: () => {},
  }

  handleChange = (hexcode: string, e: React.MouseEvent) => {
    this.props.onChange(
      {
        hex: hexcode,
        source: 'hex',
      },
      e
    )
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

    return <div className="ColorPicker">{swatches}</div>
  }
}

export default CustomPicker(ColorPicker)
