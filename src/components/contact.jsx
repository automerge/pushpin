import React from "react"
import PropTypes from "prop-types"

export default class Contact extends React.PureComponent {
  static propTypes = {
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    share: PropTypes.string
  }

  static defaultProps = {
    share: "visible"
  }

  render() {
    let share
    if(this.props.share === "visible")
      share = <i className="fa fa-share-alt" />

    return (
      <div className="Contact">
        <div className="Contact__avatar"><img src={this.props.avatar} /></div>
        <div className="Contact__info">
          <div className="Contact__info__name">
            { this.props.name }
          </div>

          <div className="Contact__info__lastSeen">
            Last seen 2 days ago
          </div>
        </div>

        <div className="Contact__actions">
          { share }
        </div>
      </div>
    )
  }
}
