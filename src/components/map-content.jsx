import React from 'react'
import PropTypes from 'prop-types'
import { Map, TileLayer } from 'react-leaflet'
import { DomEvent } from 'leaflet'
import ContentTypes from '../content-types'

export default class MapContent extends React.PureComponent {
  static propTypes = {
    docId: PropTypes.string.isRequired
  }

  static initializeDocument = (mapDoc, something) => {
    if (mapDoc && !mapDoc.viewport) {
      mapDoc.viewport = { center: [51.505, -0.09], zoom: 13 };
    }
  }

  ref = React.createRef()

  static minWidth = 8
  static minHeight = 5
  static defaultWidth = 8

  state = {}

  // This is the New Boilerplate
  componentWillMount = () => { this.refreshHandle(this.props.docId) }
  componentWillUnmount = () => this.handle.release()
  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if (prevProps.docId !== this.props.docId) {
      this.refreshHandle(this.props.docId)
    }
  }

  componentDidMount = () => {
    DomEvent.disableScrollPropagation(this.ref.current)
    DomEvent.disableClickPropagation(this.ref.current)
  }

  refreshHandle = (docId) => {
    if (this.handle) {
      this.handle.release()
    }
    this.handle = window.hm.openHandle(docId)
    this.handle.onChange(this.onChange)
  }

  onChange = (doc) => {
    this.setState({ ...doc })
  }

  onViewportChanged = (viewport) => {
    this.handle.change((doc) => {
      doc.viewport = viewport
    })
    this.setState({ viewport })
  }

  render = () => {
    if (!this.state && this.state.locations) {
      return <div/>
    }
    return <div className="MapContent">
      <div className="MapContent__inner" ref={this.ref}>
        <Map
          viewport={this.state.viewport}
          onViewportChanged={this.onViewportChanged}>
          <TileLayer
            url="http://tile.stamen.com/toner/{z}/{x}/{y}.png"
            attribution={`Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.`}
          />
        </Map>
      </div>
    </div>
  }
}

ContentTypes.register({
  component: MapContent,
  type: 'map',
  name: 'Map',
  icon: 'map',
  resizable: true
})