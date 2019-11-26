import React from 'react'

import { ContentProps } from '../../Content'

import { useSelfId } from '../../../SelfHooks'

import ContactViewer from './ContactViewer'
import ContactEditor from './ContactEditor'
import './ContactWorkspace.css'

export default function ContactWorkspace(props: ContentProps) {
  const { hypermergeUrl: contactUrl } = props
  const selfId = useSelfId()
  const isSelf = selfId === contactUrl
  return (
    <div className="ContactWorkspace">
      {isSelf ? <ContactEditor {...props} /> : <ContactViewer {...props} />}
    </div>
  )
}
