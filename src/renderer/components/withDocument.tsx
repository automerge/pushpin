import React from 'react'
import { Handle } from 'hypermerge';

type changeFn = (doc: any) => void

interface WrappedComponentProps {
  doc: any
  change: (changeFn: changeFn) => void
  [k: string]: any
}

interface WrappedComponent
  extends React.Component<WrappedComponentProps, any> { }
type WrappedComponentClass = {
  new(...k: any[]): WrappedComponent;
};

type DocumentInitializer = (doc: any, attrs: { [k: string]: any }) => any;

export interface Props {
  url: string
}

export default function withDocument(
  WrappedComponent: WrappedComponentClass,
  documentInitializer: DocumentInitializer
) {
  const DocumentContainer = class extends React.PureComponent<Props> {
    static initializeDocument = documentInitializer

    handle?: Handle<any>
    state = { doc: null }

    componentWillMount = () => {
      this.handle = window.repo.watch(this.props.url, doc =>
        this.onChange(doc))
    };

    componentWillUnmount = () => {
      if (this.handle) {
        this.handle.close()
      }
    };

    onChange = (doc: any) => {
      this.setState({ doc })
    };

    change = (changeFn: changeFn) => {
      this.handle && this.handle.change(changeFn)
    }

    render() {
      if (!this.state.doc) {
        return null
      }

      return (
        <WrappedComponent
          {...this.props}
          doc={this.state.doc}
          change={this.change}
        />
      )
    }
  }
  return DocumentContainer
}
