/* eslint-disable jsx-a11y/alt-text */
import React from 'react'
import './Badge.css'

// The `icon` prop should be the class name of the font awesome icon without the "fa-" prefix
// e.g. For the icon "fa-files-o" pass "files-o".
type Circle = 'circle'
type Square = 'square'
export type BadgeShape = Circle | Square

type Huge = 'huge'
type Large = 'large'
type Medium = 'medium'
type Small = 'small'
type Tiny = 'tiny'
export type BadgeSize = Huge | Large | Medium | Small | Tiny

export interface Props {
  icon?: string
  img?: string
  hover?: string
  color?: string
  backgroundColor?: string
  shape?: BadgeShape
  size?: BadgeSize
}

export default React.forwardRef((props: Props, ref: React.Ref<HTMLDivElement>) => {
  const { icon, color, backgroundColor, size = 'large', shape = 'circle', img, hover } = props
  return (
    <div
      ref={ref}
      className={`Badge Badge--${size} Badge--${shape} ${img ? 'Badge--image' : null} ${
        hover ? 'Badge--hover' : null
      }`}
      style={{ color, backgroundColor, backgroundImage: img ? `url(${img})` : undefined }}
      data-hover={hover}
    >
      <i className={`fa fa-${icon}`} />
    </div>
  )
})
