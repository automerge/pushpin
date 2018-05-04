import Debug from 'debug'

const log = Debug('pushpin:loop')

const loopSingleton = {
  state: null,
  view: null,
  render: null,
  current: null,
}

const init = (state, view, render) => {
  loopSingleton.state = state
  loopSingleton.view = view
  loopSingleton.render = render
  display(loopSingleton)
}

const dispatch = (fn, args) => {
  // Avoid running dispatches within each other.
  if (loopSingleton.current) {
    process.nextTick(() => { dispatch(fn, args) })
    return
  }

  // Check arguments.
  if ((typeof fn) !== 'function') {
    throw new Error(`Expected function, got ${fn}`)
  }
  if (!fn.name) {
    throw new Error(`Expected named function, got ${fn}`)
  }
  if (args && ((typeof args) !== 'object')) {
    throw new Error(`Expected args object, got ${args}`)
  }

  loopSingleton.current = fn.name
  log('dispatch', fn.name, args)
  const newState = fn(loopSingleton.state, args)

  if ((typeof newState) !== 'object') {
    throw new Error(`Expected state object, got ${newState}`)
  }

  loopSingleton.state = newState
  display(loopSingleton)
  loopSingleton.current = null
}

const display = (ls) => {
  const vdom = ls.view(ls.state)
  ls.render(vdom)
}

export default { init, dispatch }
