import React from 'react'
import Content from '../../Content'
import { HypermergeUrl, createDocumentLink } from '../../../ShareLink'
import { useDocument } from '../../../Hooks'
import { ContactDoc } from '../contact'
import './Author.css'

interface Props {
  contactId: HypermergeUrl
  isPresent: boolean
}

export default function Author(props: Props) {
  const [contact] = useDocument<ContactDoc>(props.contactId)
  if (!contact) return null
  return (
    <div className="Author" data-name={contact.name}>
      <Content
        context="title-bar"
        url={createDocumentLink('contact', props.contactId)}
        isPresent={props.isPresent}
      />
    </div>
  )
}
