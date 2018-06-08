import React from 'react'
import PropTypes from 'prop-types'

import ContentTypes from '../content-types'

export default class Stamp extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(doc) {
    doc.stampedCards = []
  }

  constructor(props) {
    super(props)
    this.handle = null
	this.state = {stampedCards: []}
    this.handleMouseup = this.handleMouseup.bind(this)
    this.handleMousedown = this.handleMousedown.bind(this)
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => {
      this.setState({ stampedCards: doc.stampedCards })
    })
  }

  stampAllCards() {
    this.state.stampedCards.forEach((id) => {
	  var card = document.getElementById(id)
      if (card && !card.classList.contains('stamped'))
        this.displayStamp(card)
    })
  }

  displayStamp(card) {
	card.classList.add('stamped')
    var img = document.createElement("img")
    img.setAttribute('src', '../img/approved.png') // this should be a hyperfile but that was a can of worms
	img.style.overflow = 'visible' // I wasn't sure where to put this, and wanted it to be self contained in this component
    img.style.position = 'absolute'
    img.style.float = 'right'
    img.style.top = '-40px'
    img.style.right = '-45px'
    img.style.zIndex = '10'
    img.style.width = '200px'
    img.style.height = '126px'
    card.appendChild(img)
  }

  stamp(e) {
    var card = document.elementsFromPoint(e.pageX, e.pageY).slice(2).find( function(element) {
      // find the first card under the stamp (excluding the stamp which is always the first two elements)
      return (element.className.indexOf('card') != -1)
    })
    if (card) {
      this.handle.change((doc) => {
        // add card's docId
        doc.stampedCards.push(card.id)
      })
    }
  }

  handleMouseup(e) {
    if (this.downCoords[0] == e.pageX && this.downCoords[1] == e.pageY ) {
      // if this was a click (not a drag)
      this.stamp(e)
    }	
  }

  handleMousedown(e) {
	this.downCoords = [e.pageX, e.pageY]
  }

  render() {
    this.stampAllCards() // this is probably not the right way to do this

	var divStyle = { backgroundImage: 'url(../img/stamp.png)', width: '150px', height: '150px', zIndex: '12' }
    return <div onMouseUp={this.handleMouseup} onMouseDown={this.handleMousedown} style={divStyle}></div>
  }
}

ContentTypes.register({
  component: Stamp,
  type: 'stamp',
  name: 'Stamp',
  icon: 'toggle-off',
  resizable: false
})
