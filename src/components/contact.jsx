import React from "react"

export default class Contact extends React.PureComponent {
  render() {
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
          <i className="fa fa-share-alt" />
        </div>
      </div>
    )
  }
}
