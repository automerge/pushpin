import React from "react"
import PropTypes from "prop-types"

export default class Share extends React.Component {
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

      return (
        <div key={id} className="Author">
          <div className="Author__avatar"><img src={author.avatar} /></div>
          <div className="Author__info">
            <div className="Author__info__name">
              { author.name }
            </div>

            <div className="Author__info__lastSeen">
              Last seen 2 days ago
            </div>
          </div>
          <div className="Author__actions">
            <i className="fa fa-share-alt" />
          </div>
        </div>
      )
    })

    return (
      <div className="Share">
        { authors }
      </div>
    )
  }
}
