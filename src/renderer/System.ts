import { createContext, useContext, useEffect } from 'react'
import Queue from 'hypermerge/dist/Queue'
import { DocUrl } from 'hypermerge'

/**
 * The "System" is the renderer's representation of non-UI concepts:
 * e.g. the OS, main, and background processes.
 *
 * We don't want components or ContentTypes to be concerned with the backend architecture
 * or IPC, but they still require communication. The System allows this communication
 * between components and the internals of the background processes. All that the components need to
 * know is that there is some concept of a "system" outside of the UI.
 */

export type ToSystemMsg = NavigatedMsg
export type FromSystemMsg = NewDocumentMsg | IncomingUrlMsg

interface NavigatedMsg {
  type: 'Navigated'
  url: DocUrl
}

interface NewDocumentMsg {
  type: 'NewDocument'
}

interface IncomingUrlMsg {
  type: 'IncomingUrl'
  url: string
}

export const SystemContext = createContext<System | null>(null)

export function useSystem(
  receive?: (msg: FromSystemMsg) => void,
  deps: any[] = []
): (msg: ToSystemMsg) => void {
  const system = useContext(SystemContext)
  if (!system) throw new Error('No System available.')

  useEffect(() => {
    if (receive) system.fromSystemQ.subscribe(receive)

    return () => {
      if (receive) system.fromSystemQ.unsubscribe()
    }
  }, deps)

  return system.toSystemQ.push
}

export default class System {
  toSystemQ = new Queue<ToSystemMsg>()
  // TODO: this only allows a single subscriber:
  fromSystemQ = new Queue<FromSystemMsg>()
}
