import assert from 'assert'
import { configure, shallow, mount, render } from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import * as React from 'react'

import * as Card from '../src/components/card'

configure({ adapter: new Adapter() })

describe('Array', () => {
  describe('#indexOf()', () => {
    it('should return -1 when the value is not present', () => {
      assert.equal([1, 2, 3].indexOf(4), -1)
    })
  })
})

describe('<Card />', () => {
  describe('should be instantiable', () => {
    const props = {
      card: {
        type: 'text',
        id: 1,
        x: 0,
        y: 0,
        height: 10,
        width: 24,
        text: ''
      },
      dragState: {
        moveX: 0,
        moveY: 0,
        resizeWidth: 48,
        resizeHeight: 48
      }
    }

    const wrapper = shallow(<Card.default {...props} />)

    it('should equal itself', () => {
      assert.equal(wrapper, wrapper)
    })
  })
})
