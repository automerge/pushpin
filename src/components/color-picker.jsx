import React from 'react'
import PropTypes from 'prop-types'
import reactCSS from 'reactcss'

import { CustomPicker } from 'react-color'
import { Swatch } from 'react-color/lib/components/common'

/* This class is adapted from the react-color TwitterPicker
   by stripping out the hex editor and tweaking styles a little */

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
    return (
      <div style={styles.card} className="ColorPicker">
        <div style={styles.body}>
          {this.props.colors.map((c) =>
            (<Swatch
              key={c}
              color={c}
              hex={c}
              style={styles.swatch}
              onClick={this.handleChange}
              focusStyle={{
                boxShadow: `0 0 4px ${c}`,
              }}
            />))
          }
          <div style={styles.clear} />
        </div>
      </div>
    )
  }
}

export default CustomPicker(ColorPicker)
