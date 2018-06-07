import React from 'react'
import PropTypes from 'prop-types'

import Content from './content'
import ContentTypes from '../content-types'
import { createDocumentLink } from '../share-link'

export default class BlackJack extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static freshDeck() {
    const rank = 'A234567890JQK'.split('')
    const suit = 'HDSC'.split('')
    const nested = rank.map(r => suit.map(s => r + s))
    const cards = [].concat(...nested)
    return cards
  }

  static initializeDocument(blackJack) {
    blackJack.cards = BlackJack.freshDeck()
    blackJack.discards = []
    blackJack.hands = {}
  }

  constructor() {
    super()
    this.handle = null
    this.shuffle = this.shuffle.bind(this)
    this.deal = this.deal.bind(this)
    this.draw = this.draw.bind(this)
    this.discard = this.discard.bind(this)
  }


  shuffle() {
    const cards = [...this.handle.get().cards] || BlackJack.freshDeck()

    let currentIndex = cards.length
    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1

      const temporaryValue = cards[currentIndex]
      cards[currentIndex] = cards[randomIndex]
      cards[randomIndex] = temporaryValue
    }

    this.handle.change((game) => {
      game.cards = cards
    })
  }

  deal() {
    this.handle.change((game) => {
      game.hands = {}
      game.discards = []
      game.cards = BlackJack.freshDeck()
    })
  }

  draw() {
    this.handle.change((game) => {
      const card = game.cards.shift()

      if (game.hands[window.selfId]) {
        game.hands[window.selfId].push(card)
      } else {
        game.hands[window.selfId] = [card]
      }
    })
  }

  discard() {
    this.handle.change((game) => {
      const card = game.hands[window.selfId].shift()
      if (game.discards) {
        game.discards.push(card)
      } else {
        game.discards = [card]
      }
    })
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => {
      this.setState({ ...doc })
    })
  }

  render() {
    if (!this.state.cards) {
      return null
    }

    return (
      <div><h2>Deck</h2>
        <p>[A deck of {
          this.state.cards.length
        } cards sits here]
        </p>
        <p>[Beside it, with {this.state.discards.slice(-1)[0]} atop, is a
            discard pile of {this.state.discards.length} cards.]
        </p>
        <h2>Hands</h2>
        {
          Object.entries(this.state.hands).map(([user, hand]) => {
              if (user === window.selfId) {
                return (
                  <div>
                    <Content url={createDocumentLink('contact', user)} />
                    <div>{ hand.map(card => <span>{card} </span>) }</div>
                  </div>)
                }

                return (
                  <div>
                    <Content url={createDocumentLink('contact', user)} />
                    <div>[They hold {hand.length} cards.]</div>
                  </div>
                  )
              })
        }
        <div>
          <button onClick={this.deal}>deal</button>
          <button onClick={this.shuffle}>shuffle</button>
          <button onClick={this.draw}>draw</button>
          <button onClick={this.discard}>discard</button>
        </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: BlackJack,
  type: 'blackjack',
  name: 'BlackJack',
  icon: 'card',
  resizable: false
})
