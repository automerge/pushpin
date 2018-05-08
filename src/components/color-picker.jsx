import React from 'react'
import PropTypes from 'prop-types'
import reactCSS from 'reactcss'

import { CustomPicker } from 'react-color'
import { Swatch } from 'react-color/lib/components/common'

/* This class is adapted from the react-color TwitterPicker
   by stripping out the hex editor and tweaking styles a little */

const ColorPicker = ({ onChange, onSwatchHover, hex, colors, width }) => {
  const styles = reactCSS({
    default: {
      card: {
        width: '152px',
        background: '#fff',
        border: '0 solid rgba(0,0,0,0.25)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        borderRadius: '2px',
        position: 'relative',
      },
      body: {
        padding: '8px 0 0 8px',
      },
      swatch: {
        width: '28px',
        height: '28px',
        float: 'left',
        borderRadius: '4px',
        margin: '0 8px 8px 0',
      },
      clear: {
        clear: 'both',
      },
    }
  })

  const handleChange = (hexcode, e) => {
    onChange({
      hex: hexcode,
      source: 'hex',
    }, e)
  }

  return (
    <div style={styles.card} className="ColorPicker">
      <div style={styles.body}>
        {colors.map((c) =>
          (<Swatch
            key={c}
            color={c}
            hex={c}
            style={styles.swatch}
            onClick={handleChange}
            onHover={onSwatchHover}
            focusStyle={{
              boxShadow: `0 0 4px ${c}`,
            }}
          />)
          )
        }
        <div style={styles.clear} />
      </div>
    </div>
  )
}

ColorPicker.defaultProps = {
  width: 152,
  // We don't need default colors for our version, we'll always provide them.
  colors: [],
  onChange: () => {},
  onSwatchHover: () => {},
  hex: ''
}

ColorPicker.propTypes = {
  onChange: PropTypes.func,
  onSwatchHover: PropTypes.func,
  hex: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  colors: PropTypes.arrayOf(PropTypes.string),
}

export default CustomPicker(ColorPicker)
