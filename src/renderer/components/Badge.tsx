import React from 'react'
import './Badge.css'

// The `icon` prop should be the class name of the font awesome icon without the "fa-" prefix
// e.g. For the icon "fa-files-o" pass "files-o".
type Circle = 'circle'
type Square = 'square'
export type BadgeShape = Circle | Square

export interface Props {
  icon: string
  backgroundColor?: string
  shape?: BadgeShape
}

export default React.forwardRef(
  ({ icon, backgroundColor, shape = 'circle' }: Props, ref: React.Ref<HTMLElement>) => (
    <i
      ref={ref}
      className={`Badge Badge--${shape} fa fa-${icon}`}
      style={{ background: backgroundColor }}
    />
  )
)
