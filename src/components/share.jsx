import React from "react"
import PropTypes from "prop-types"

import Contact from "./contact"

export default class Share extends React.PureComponent {
  static propTypes = {
    authors: PropTypes.objectOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string.isOptional
      })
    ).isRequired
  }

  render() {
    const authors = Object.keys(this.props.authors).map(id => {
      const author = this.props.authors[id]

      return <Contact key={id} name={author.name} avatar={author.avatar} share="hidden" />
    })

    return (
      <div className='Share'>
        { authors }
      </div>
    )
  }
}
