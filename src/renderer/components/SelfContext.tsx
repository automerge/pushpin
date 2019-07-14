import React from 'react'
import { HypermergeUrl } from '../ShareLink'

// createContext requires a default value...
// which we don't really have a sensible answer for
const SelfContext = React.createContext<HypermergeUrl>('' as HypermergeUrl)

export default SelfContext
