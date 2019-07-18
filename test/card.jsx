import assert from 'assert'
import { configure, shallow/* , mount, render */ } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import * as React from 'react'

import Card from '../src/renderer/components/board/board-card'

configure({ adapter: new Adapter() })

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

    const wrapper = shallow(<Card {...props} />)

    it('should equal itself', () => {
      assert.equal(wrapper, wrapper)
    })
  })
})
