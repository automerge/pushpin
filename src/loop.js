import Debug from 'debug'

const log = Debug('pushpin:loop')

const loopSingleton = {
  state: null,
  view: null,
  render: null,
  queue: [],
  ticking: false,
}

const init = (state, view, render) => {
  // Check arguments.
  if ((typeof state) !== 'object') {
    throw new Error(`Expected state object, got ${state}`)
  }
  if ((typeof view) !== 'function') {
    throw new Error(`Expected view function, got ${view}`)
  }
  if ((typeof render) !== 'function') {
    throw new Error(`Expected render function, got ${render}`)
  }

  log('init')
  loopSingleton.state = state
  loopSingleton.view = view
  loopSingleton.render = render
  display(loopSingleton)
}

const dispatch = (fn, args) => {
  // Check arguments.
  if ((typeof fn) !== 'function') {
    throw new Error(`Expected action fn, got ${fn}`)
  }
  if (!fn.name) {
    throw new Error(`Expected named action fn, got ${fn}`)
  }
  if (args && ((typeof args) !== 'object')) {
    throw new Error(`Expected args object, got ${args}`)
  }

  log('dispatch', fn.name)
  loopSingleton.queue.push([fn, args])
  tick(loopSingleton)
}

const tick = (ls) => {
  // Reentrancy.
  if (ls.ticking) {
    return
  }

  log('tick')
  ls.ticking = true
  while (ls.queue.length > 0) {
    const [fn, args] = ls.queue.shift()
    try {
      const startState = ls.state
      const startActive = startState.activeDocId
      const startClock = startActive && (startActive !== '') && startState.board._state.getIn(['opSet', 'clock'])
      //log('action.start', fn.name, shortClock(startClock))
      log('action.start', fn.name, args || {})
      const endState = fn(startState, args)
      if ((typeof endState) !== 'object') {
        throw new Error(`Expected state object, got ${endState}`)
      }
      const endActive = endState.activeDocId
      const endClock = endActive && (endActive !== '') && endState.board._state.getIn(['opSet', 'clock'])
      if (startClock && endClock && (startActive === endActive) && !lessOrEqual(startClock, endClock)) {
        throw new Error(`Dispatch took us backward?!`)
      }
      ls.state = endState
      // log('action.success', fn.name, shortClock(startClock), shortClock(endClock))
      log('action.success', fn.name)
    } catch (e) {
      log('action.error', fn.name, e)
      debugger
    }
    display(ls)
  }
  ls.ticking = false
}

const display = (ls) => {
  log('display')
  const vdom = ls.view(ls.state)
  ls.render(vdom)
}


// Clock debug helpers.

function lessOrEqual(clock1, clock2) {
  return clock1.keySeq().concat(clock2.keySeq()).reduce(
    (result, key) => (result && clock1.get(key, 0) <= clock2.get(key, 0)),
    true)
}

function shortId(docId) {
  return docId.slice(0, 6)
}

function shortClock(clock) {
  if (!clock) {
    return clock
  }
  return clock.mapEntries((entry) => { return [shortId(entry[0]), entry[1]] }).toJS()
}


// Exports.

export default { init, dispatch }
