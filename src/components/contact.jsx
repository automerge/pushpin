import React from 'react'
import PropTypes from 'prop-types'

export default class Contact extends React.PureComponent {
  static propTypes = {
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    actions: PropTypes.arrayOf(PropTypes.string)
  }

  static defaultProps = {
    actions: []
  }

  render() {
    const actions = []
    if (this.props.actions.includes('share')) {
      actions.push(<i key='share' className='fa fa-share-alt' />)
    }

    if (this.props.actions.includes('unshare')) {
      actions.push(<i key='unshare' className='fa fa-ban' />)
    }

    return (
      <div className='Contact'>
        <div className='Contact__avatar'><img src={this.props.avatar} /></div>
        <div className='Contact__info'>
          <div className='Contact__info__name'>
            { this.props.name }
          </div>
        </div>

        <div className='Contact__actions'> { actions } </div>
      </div>
    )
  }
}
