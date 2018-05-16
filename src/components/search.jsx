import React from 'react'
import PropTypes from 'prop-types'

import Contact from './contact'

export default class Search extends React.PureComponent {
  static propTypes = {
    results: PropTypes.array
  }

  static defaultProps = {
    results: []
  }

  render() {
    const results = this.props.results.map(result => {
      if(result.type === "contact") {
        return <Contact key={"contact-" + result.name} name={result.name} avatar={result.avatar} />
      }

      return
    })

    return (
      <div className="Search">
        { results }
      </div>
    )
  }
}
