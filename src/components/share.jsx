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
      return <Contact key={id} name={author.name} avatar={author.avatar} actions={["unshare"]} />
    })

    const contacts = Object.keys(this.props.contacts).map(id => {
      const contact = this.props.contacts[id]
      return <Contact key={id} name={contact.name} avatar={contact.avatar} actions={["share"]} />
    })

    return (
      <div className='Share'>
        <h6>On Board</h6>
        <div className='Share__section'>
          <div className='Share__authors'> 
            { authors } 
          </div>
        </div>

        <h6>All</h6>
        <div className='Share__section'>
          <div className='Share__contacts'> 
            { contacts } 
          </div>
        </div>
      </div>
    )
  }
}
