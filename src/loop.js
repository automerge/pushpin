import Debug from 'debug'

var loopSingleton = {}

const log = Debug('loop')

const init = (state, view, render) => {
  loopSingleton.state = state
  loopSingleton.view = view
  loopSingleton.render = render
  display(loopSingleton)
}

const dispatch = (fn, args) => {
  if ((typeof fn) !== 'function') {
    throw new Error(`Expected function, got ${fn}`)
  }
  if (!fn.name) {
    throw new Error(`Expected named function, got ${fn}`)
  }
  if (args && ((typeof args) !== 'object')) {
    throw new Error(`Expected args object, got ${args}`)
  }

  log('dispatch', fn.name, args)
  const newState = fn(loopSingleton.state, args)

  if ((typeof newState) !== 'object') {
    throw new Error(`Expected state object, got ${newState}`)
  }

  loopSingleton.state = newState
  display(loopSingleton)
}

const display = (ls) => {
  const vdom = ls.view(ls.state)
  ls.render(vdom)
}

export default { init, dispatch }
