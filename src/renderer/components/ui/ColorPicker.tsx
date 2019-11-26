import React from 'react'

import { CustomPicker } from 'react-color'
import { Swatch } from 'react-color/lib/components/common'
import './ColorPicker.css'

interface Props {
  color?: string
  colors: string[]
  onChange(color: { hex: string; source: 'hex' }, e: React.MouseEvent): void
}

ColorPicker.defaultProps = {
  colors: [],
  onChange: () => {},
}

/* This component is adapted from the react-color TwitterPicker
   by stripping out most of the functionality and just leaving swatches */
function ColorPicker(props: Props) {
  function handleChange(hexcode: string, e: React.MouseEvent) {
    props.onChange(
      {
        hex: hexcode,
        source: 'hex',
      },
      e
    )
  }

  const swatches = props.colors.map((c) => {
    const isSelected = props.color && c.toLowerCase() === props.color.toLowerCase()
    const borderStyle = { border: '1px solid #333' }
    return (
      <div key={c} className="ColorPicker__swatch">
        <Swatch
          color={c}
          hex={c}
          onClick={handleChange}
          style={isSelected ? borderStyle : { border: '1px solid transparent' }}
          focusStyle={borderStyle}
        />
      </div>
    )
  })

  return <div className="ColorPicker">{swatches}</div>
}

export default CustomPicker(ColorPicker)
