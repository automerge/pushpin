import React from 'react'
import Debug from 'debug'

import ContentTypes, { Context } from '../ContentTypes'
import { parseDocumentLink } from '../ShareLink'
import SelfContext from './SelfContext'

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
  context: Context
  [arbitraryProp: string]: any
}

interface State {
  contentCrashed: boolean
}

export default class Content extends React.PureComponent<Props, State> {
  static initializeContentDoc = (type, typeAttrs = {}) => {
    const { repo } = window // still not a great idea
    const contentType = ContentTypes.lookup({ type, context: 'workspace' })

    if (!contentType) throw new Error(`Type not found in registry: ${type}`)
    const { component } = contentType as any

    const initializeDocumentWithAttrs = (doc) => {
      component.initializeDocument(doc, typeAttrs)
    }

    const url = repo.create()
    repo.change(url, initializeDocumentWithAttrs)

    return url
  }

  state = { contentCrashed: false }

  componentDidCatch = (e) => {
    this.setState({ contentCrashed: e })
  }

  filterProps = (props) => {
    const filtered = {}
    Object.keys(props)
      .filter(key => !FILTERED_PROPS.includes(key))
      .forEach(key => {
        filtered[key] = props[key]
      })
    return filtered
  }

  render() {
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
