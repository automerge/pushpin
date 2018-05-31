import { expect } from 'chai'
import * as Model from '../src/models/model'
import Hypermerge from '../src/hypermerge'

describe('Model', () => {
  const originalState = Model.empty
  describe('should be empty to begin with', () => {
    it('should have a set of starting fields', () => {
      expect(originalState).to.have.all.keys(
        'board', 'workspace', 'contacts', 'hm'
      )
    })
  })

  describe('initialization', () => {
    const state = Model.init(originalState)

    it('should create a hypermerge', () => {
      expect(state.hm).to.be.an.instanceof(Hypermerge)
    })

    it('and an empty requested workspace', () => {
      expect(state.requestedWorkspace).to.have.lengthOf(0)
    })
  })
})
