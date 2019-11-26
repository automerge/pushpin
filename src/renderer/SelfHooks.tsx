import React, { useContext } from 'react'
import { HypermergeUrl } from './ShareLink'
import { ContactDoc } from './components/content-types/contact'
import { ChangeFn, useDocument } from './Hooks'

// createContext requires a default value...
// which we don't really have a sensible answer for
const SelfContext = React.createContext<HypermergeUrl>('' as HypermergeUrl)

export default SelfContext

export function useSelfId(): HypermergeUrl {
  return useContext(SelfContext)
}

export function useSelf(): [Readonly<ContactDoc> | null, ChangeFn<ContactDoc>] {
  const selfId = useSelfId()
  return useDocument<ContactDoc>(selfId)
}
