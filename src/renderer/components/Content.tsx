import React from 'react'
import Debug from 'debug'

import ContentTypes from '../content-types'
import { parseDocumentLink } from '../share-link'
import SelfContext from './self-context'

const log = Debug('pushpin:content')
const FILTERED_PROPS = ['type', 'hypermergeUrl']

// this is the interface imported by Content types
export interface ContentProps {
  context: string
  url: string 
  type: string
  hypermergeUrl: string
  selfId: string
}

// These are the props the generic Content wrapper receives
interface Props {
  url: string
  context: string
}

interface State {
  contentCrashed: boolean
}

export default class Content extends React.PureComponent<Props, State> {
  static initializeContentDoc = (type, typeAttrs = {}) => {
    const { repo } = window // still not a great idea
    const contentType = ContentTypes.lookup({ type, context: 'workspace' })

    const initializeDocumentWithAttrs = (doc) => {
      contentType.component.initializeDocument(doc, typeAttrs)
    }

    const url = repo.create()
    repo.change(url, initializeDocumentWithAttrs)

    return url
  }

  component = React.createRef()
  state = { contentCrashed: false }

  componentDidCatch = (e) => {
    this.setState({ contentCrashed: e })
  }

  // XXX this will make a child type very angry/sad later when we reach it
  filterProps = (props) => {
    const filtered = {}
    Object.keys(props)
      .filter(key => !FILTERED_PROPS.includes(key))
      .forEach(key => {
        filtered[key] = props[key]
      })
    return filtered
  }

  render = () => {
    log('render')
    const { context, url } = this.props

    if (!url) {
      return null
    }

    const { type, hypermergeUrl } = parseDocumentLink(url)

    const contentType = ContentTypes.lookup({ type, context })

    if (!contentType) {
      return renderMissingType(type, context)
    }

    if (this.state.contentCrashed) {
      return renderError(type, this.state.contentCrashed)
    }

    const filteredProps = this.filterProps(this.props)

    return (
      <SelfContext.Consumer>
        {selfId => (
          <contentType.component
            key={url}
            ref={this.component}
            context={context}
            url={url}
            type={type}
            hypermergeUrl={hypermergeUrl}
            selfId={selfId}
            {...filteredProps}
          />
        )
        }
      </SelfContext.Consumer>
    )
  }
}

const renderError = (type, error) => (
  <div>
    <i className="fa fa-exclamation-triangle" />
    A &quot;{type}&quot; threw an error during render.
  </div>
)

const renderMissingType = (type, context) => (
  <div>
    <i className="fa fa-exclamation-triangle" />
    Component of type &quot;{type}&quot; in context &quot;{context}&quot; not found.
  </div>
)
