import React from 'react'
import './Badge.css'

// The `icon` prop should be the class name of the font awesome icon without the "fa-" prefix
// e.g. For the icon "fa-files-o" pass "files-o".
export interface Props {
  icon: string
  backgroundColor?: string
}

export default React.forwardRef((props: Props, ref: React.Ref<HTMLElement>) => {
  return (
    <i
      ref={ref}
      className={`Badge fa fa-${props.icon}`}
      style={{ background: props.backgroundColor }}
    />
  )
})
