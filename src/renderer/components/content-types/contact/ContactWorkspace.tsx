import React from 'react'

import { ContentProps } from '../../Content'

import { useSelfId } from '../../../Hooks'

import ContactViewer from './ContactViewer'
import ContactEditor from './ContactEditor'

export default function ContactWorkspace(props: ContentProps) {
  const { hypermergeUrl: contactUrl } = props
  const selfId = useSelfId()
  const isSelf = selfId === contactUrl
  return isSelf ? <ContactEditor {...props} /> : <ContactViewer {...props} />
}
