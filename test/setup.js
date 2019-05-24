import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'

import * as Model from '../src/models/model'

configure({ adapter: new Adapter() })


before((done) => {
  console.log('BEFORING')
  // we need to initialize the model to get loop configured
  Model.init()

  done()
})
