import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import ReactToggle from 'react-toggle'

import ContentTypes from '../content-types'

export default class DrumKit extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument(drumKitDoc) {
    drumKitDoc.pattern = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
    drumKitDoc.ticker = 0
    drumKitDoc.playing = false
  }

  constructor(props) {
    super(props)
    this.state = { pattern: [], ticker: 0, playing: false}
    this.handle = null
    this.flipToggle = this.flipToggle.bind(this)
    this.startTicker = this.startTicker.bind(this)
    this.tick = this.tick.bind(this)
  }

  componentWillMount() {
    this.handle = window.hm.openHandle(this.props.docId)
    this.handle.onChange((doc) => {
      this.setState({ pattern: doc.pattern })
      this.setState({ ticker: doc.ticker })
      this.setState({ playing: doc.playing })
    })
    this.startTicker()
  }

  startTicker() {
    setInterval(this.tick, 100)
  }

  tick() {
    if (!this.state.playing) {
      return
    }
    if (!this.state.ticker) {
      this.state.ticker = 0
    }
    console.log("tick " + this.state.ticker)
    var frame = this.state.ticker % 32

    for (var i = 0; i < this.state.pattern.length; i++) {
      if (this.state.pattern[i][frame] === 1) {
        var audio: Audio = null
        switch (i) {
          case 0:
            audio = new Audio('./samples/hihat-plain.wav')
            break
          case 1:
            audio = new Audio('./samples/clap-tape.wav')
            break
          case 2:
            audio = new Audio('./samples/snare-808.wav')
            break
          case 3:
            audio = new Audio('./samples/kick-808.wav')
            break
        }
        audio.play();
      }
    }
    

    this.handle.change((doc) => {
      doc.ticker++
    })
  }

  flipToggle() {
    this.handle.change((doc) => {
      doc.playing = !doc.playing
    })
  }

  render() {
    if (!this.state.pattern) {
      return null
    }
    return <div className="drum-wrapper">
          <div className="drum-grid">
          {
            this.state.pattern.map((subPattern, i) => {
              const x = subPattern[0]
              return (
                subPattern.map((num, j) => {
                  const y = num
                  return (
                    <div className={ num === 1 ? num % 4 == 0 ? "drum-item highlight-on" : "drum-item on" : num % 4 == 0 ? "drum-item highlight" : "drum-item" } id={i + "-" + j} onClick={ e => {
                      this.handle.change((doc) => {
                        if (doc.pattern[i][j] == 0) {
                          doc.pattern[i][j] = 1
                        } else {
                          doc.pattern[i][j] = 0
                        }
                      })
                      }
                    }/>
                  )
                })
              )
            })
          }
          <ReactToggle checked={this.state.playing} onChange={this.flipToggle} />
          </div>
        </div>
  }
}

ContentTypes.register({
  component: DrumKit,
  type: 'drumkit',
  name: 'DrumKit',
  icon: 'toggle-off',
  resizable: true
})
