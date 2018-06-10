import React from 'react'
import PropTypes from 'prop-types'
import Base58 from 'bs58'

import {
  createConfig,
  createDeck,
  createPlayer,
  decryptCard,
  decryptDeck,
  encryptDeck,
} from 'mental-poker'

import Content from './content'
import ContentTypes from '../content-types'
import { createDocumentLink } from '../share-link'

const shuffle = (cards) => {
  let currentIndex = cards.length
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1

    const temporaryValue = cards[currentIndex]
    cards[currentIndex] = cards[randomIndex]
    cards[randomIndex] = temporaryValue
  }

  return cards
}

export const encode = str =>
  Base58.encode(hexToBuffer(str))

export const decode = str =>
  bufferToHex(Base58.decode(str))

export const hexToBuffer = key =>
  (Buffer.isBuffer(key)
    ? key
    : Buffer.from(key, 'hex'))

export const bufferToHex = key =>
  (Buffer.isBuffer(key)
    ? key.toString('hex')
    : key)

const CARD_COUNT = 20

export default class MentalPoker extends React.PureComponent {
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
    blackJack.cards = MentalPoker.freshDeck()
  }


  deal = () => {
    this.handle.change((game) => {
      game.hands = {}
      game.discards = []
      game.cards = MentalPoker.freshDeck()
    })
  }

  draw = () => {
    this.handle.change((game) => {
      const card = game.cards.shift()

      if (game.hands[window.selfId]) {
        game.hands[window.selfId].push(card)
      } else {
        game.hands[window.selfId] = [card]
      }
    })
  }

  discard = () => {
    this.handle.change((game) => {
      const card = game.hands[window.selfId].shift()
      if (game.discards) {
        game.discards.push(card)
      } else {
        game.discards = [card]
      }
    })
  }

  componentWillMount = () => {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => {
      this.setState({ ...doc })
    })
  }

  newGame = () => {
    const config = createConfig(CARD_COUNT)
    this.handle.change((doc) => {
      doc.config = config
      doc.players = {}
      doc.hands = {}
      doc.deck = []
      doc.cardCodewords = []
    })
  }

  joinGame = () => {
    this.handle.change((doc) => {
      if (!doc.players) {
        doc.players = {}
      }
      if (!doc.config) {
        alert('no config')
      }

      const playerData = createPlayer(doc.config)

      doc.players[window.selfId] = this.stringifyPlayerData(playerData)
    })
  }

  stringifyPlayerData = (playerData) => (
    {
      cardCodewordFragments: playerData.cardCodewordFragments.map((f) => Base58.encode(f)),
      keyPairs: playerData.keyPairs.map(kp => (
        {
          publicKey: Base58.encode(kp.publicKey),
          privateKey: Base58.encode(kp.privateKey)
        }))
    }
  )

  bufferizePlayerData = (playerData) => (
    {
      cardCodewordFragments: playerData.cardCodewordFragments.map((f) => Base58.decode(f)),
      keyPairs: playerData.keyPairs.map(kp => (
        {
          publicKey: Base58.decode(kp.publicKey),
          privateKey: Base58.decode(kp.privateKey)
        }))
    }
  )

  prepareDeck = () => {
    let { players = {} } = this.handle.get()

    players = Object.values(players).map(p => this.bufferizePlayerData(p))

    const cardCodewords = createDeck(players.map(player => player.cardCodewordFragments))
    let deck = cardCodewords

    // each player will have to do this with their local keys but we'll cheat for the moment
    players.forEach((player) => {
      deck = encryptDeck(shuffle(deck), player.keyPairs[CARD_COUNT].privateKey)
    })

    players.forEach((player) => {
      deck = encryptDeck(
        decryptDeck(deck, Buffer.from(player.keyPairs[CARD_COUNT].privateKey)),
        player.keyPairs.map(keyPair => Buffer.from(keyPair.privateKey)),
      )
    })

    this.handle.change((doc) => {
      doc.drawIndex = 0
      doc.cardCodewords = cardCodewords.map(Base58.encode)
      doc.deck = deck.map(Base58.encode)
    })
  }

  drawCard = () => {
    this.handle.change((doc) => {
      const { drawIndex } = doc
      const encryptedCard = doc.deck[drawIndex]

      // everyone else decrypts it
      const cardDecrypted = decryptCard(
        Base58.decode(encryptedCard),
        Object.entries(doc.players).filter(([player, data]) => player !== window.selfId)
          .map(([player, data]) => Base58.decode(data.keyPairs[drawIndex].privateKey)),
      )

      if (!doc.hands) {
        doc.hands = {}
      }

      if (!doc.hands[window.selfId]) {
        doc.hands[window.selfId] = []
      }
      doc.hands[window.selfId].push({
        drawIndex,
        selfEncryptedCard: Base58.encode(cardDecrypted) })

      doc.drawIndex = drawIndex + 1
    })
  }

  render = () => {
    if (!this.state) { return null }

    const { config, hands = {}, discards = [], players = {} } = this.state

    return (
      <div className="deckView">
        { (config) ?
          <div>
            <h2>Deck</h2>
            <p>[A deck of {config.cardCount} cards sits here]
            </p>
            <p>[Its contents are as follows:]</p>
            <div>
              {
                (this.state.cardCodewords) ?
                  this.state.cardCodewords.map((codeword, i) =>
                    <p key={codeword}>ID: {i} : {codeword} </p>)
                    : <p>[No cards as yet.]</p>
              }
            </div>
            <p>[Beside it, with {discards.slice(-1)[0]} atop, is a
            discard pile of {discards.length} cards.]
            </p>
          </div>
          : null
        }
        <h2>Hands</h2>
        {
          Object.entries(players).map(([player, data]) => {
            const hand = hands && hands[player] ? hands[player] : []
              return (
                <div>
                  <Content url={createDocumentLink('mini-avatar', player)} /><p>(You)</p>
                  { hand.map(({ selfEncryptedCard, drawIndex }) => {
                    const card = Base58.encode(decryptCard(
                        Base58.decode(selfEncryptedCard),
                        [Base58.decode(this.state.players[window.selfId].keyPairs[drawIndex].privateKey)]
                    ))
                    return (
                      <p>ID:
                        {
                          this.state.cardCodewords.findIndex(cardCodeword =>
                            cardCodeword === card)
                        } : { card }
                      </p>)
                  }) }
                </div>)
              })
        }
        <div>
          <button onClick={this.newGame}>new game</button>
          <button onClick={this.joinGame}>join game</button>
          <button onClick={this.prepareDeck}>prepare deck</button>
          <button onClick={this.drawCard}>draw top card</button>
        </div>
      </div>
    )
  }
}

ContentTypes.register({
  component: MentalPoker,
  type: 'mental-poker',
  name: 'Mental Poker',
  icon: 'card',
  resizable: false
})
