import Debug from 'debug'

const log = Debug('pushpin:loop')

const loopSingleton = {
  state: null,
  view: null,
  render: null,
  queue: [],
  ticking: false,
}

function init(state, view, render) {
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

function dispatch(fn, args) {
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

  log('dispatch', fn.name, `[${loopSingleton.queue.map((p) => p[0].name).join(', ')}]`)
  loopSingleton.queue.push([fn, args])
  tick(loopSingleton)
}

function tick(ls) {
  // Reentrancy.
  if (ls.ticking) {
    return
  }

  log('tick')
  ls.ticking = true
  while (ls.queue.length > 0) {
    const [fn, args] = ls.queue.shift()
    try {
      log('action.start', fn.name, args)
      const startState = ls.state
      const endState = fn(startState, args)
      if ((typeof endState) !== 'object') {
        throw new Error(`Expected state object, got ${endState}`)
      }
      ls.state = endState
      log('action.success', fn.name)
    } catch (e) {
      log('action.error', fn.name, e)
      throw e
    }
    display(ls)
  }
  ls.ticking = false
}

function display(ls) {
  log('display')
  const vdom = ls.view(ls.state)
  ls.render(vdom)
}

export default { init, dispatch }
