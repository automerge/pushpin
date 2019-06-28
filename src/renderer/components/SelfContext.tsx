import React from 'react'
import { PushpinUrl } from '../ShareLink';

// createContext requires a default value...
// which we don't really have a sensible answer for
const SelfContext = React.createContext<PushpinUrl>('')

export default SelfContext
