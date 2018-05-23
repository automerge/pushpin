import Automerge from 'automerge'
import Loop from '../loop'

import * as Board from './board'

export function create(state, { x, y, selected, text }) {
  let doc = state.hm.create()
  doc = state.hm.change(doc, d => {
    d.text = new Automerge.Text()
    d.text.insertAt(0, ...text.split(''))
  })
  const docId = state.hm.getId(doc)

  Loop.dispatch(Board.cardCreated, { x, y, selected, type: 'text', docId, doc })

  return state
}

