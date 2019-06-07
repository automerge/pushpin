import assert from 'assert'
import { configure, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import * as React from 'react'

import Board from '../src/components/board/board'

configure({ adapter: new Adapter() })

describe('<Board />', () => {
  describe('should be instantiable', () => {
    const props = {
      cards: [{
        type: 'text',
        id: 'imaginary-card-id',
        x: 0,
        y: 0,
        height: 10,
        width: 24,
        text: ''
      }],
      backgroundColor: '#fff',
      selected: ['imaginary-card-id']
    }

    const wrapper = mount(<Board {...props} />)

    it('should equal itself', () => {
      assert.equal(wrapper, wrapper)
    })
  })
})
