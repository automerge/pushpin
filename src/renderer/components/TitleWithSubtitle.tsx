import React from 'react'
import './Heading.css'
import Heading from './Heading'
import SecondaryText from './SecondaryText'
import TitleEditor from './TitleEditor'
import { HypermergeUrl } from '../ShareLink'
import './TitleWithSubtitle.css'

export interface Props {
  title: string
  wrapTitle?: boolean
  titleEditorField?: string // for StoragePeer, which has a name, not a title
  subtitle?: string
  editable?: boolean
  href?: string // this is because URL Content wants to have a link as its secondary text :/
  hypermergeUrl: HypermergeUrl
}

export default function TitleWithSubtitle(props: Props) {
  const {
    title,
    wrapTitle,
    titleEditorField,
    editable = false,
    subtitle,
    href,
    hypermergeUrl,
  } = props

  return (
    <div className="TitleWithSubtitle">
      {editable ? (
        <TitleEditor field={titleEditorField} url={hypermergeUrl} />
      ) : (
        <Heading wrap={wrapTitle}>{title}</Heading>
      )}
      <SecondaryText>{href ? <a href={href}>{subtitle}</a> : subtitle}</SecondaryText>
    </div>
  )
}
