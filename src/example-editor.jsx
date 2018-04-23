import React from 'react'
import Plain from 'slate-plain-serializer'
import { Editor } from 'slate-react'

class ExampleEditor extends React.Component {
  constructor(props) {
    super(props)
    console.log('example.constructor', props)
    this.state = {
      value: Plain.deserialize(props.initialText)
    }
  }

  willReceiveProps(props) {
    console.log('example.willReceiveProps', props)
  }

  onChange(params) {
    console.log('example.onChange')
    const contentOps = params.operations.filter(o => o.type != 'set_selection' && o.type != 'set_value')
    contentOps.forEach((op) => {
      console.log('op', op.toJSON())
    })
    this.setState({value: params.value})
  }

  render() {
    return (
      <div className="exampleEditor">
        <Editor
          placeholder="Enter some plain text..."
          value={this.state.value}
          onChange={this.onChange.bind(this)}
        />
      </div>
    )
  }
}

export default ExampleEditor
