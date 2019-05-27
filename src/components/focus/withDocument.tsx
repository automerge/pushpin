import React from "react";

// HOC arg types
interface WrappedComponentProps {
  doc: any;
  change: Function;
  [k: string]: any;
}

interface WrappedComponent
  extends React.Component<WrappedComponentProps, any> {}
type WrappedComponentClass = {
  new (...k: any[]): WrappedComponent;
};

type DocumentInitializer = (doc: any, attrs: { [k: string]: any }) => any;

export interface DocumentContainerProps {
  docId: string;
  selfId: string;
}

export interface DocumentContainerState {
  doc: any;
}

export default function withDocument(
  WrappedComponent: WrappedComponentClass,
  documentInitializer: DocumentInitializer
) {
  const DocumentContainer = class extends React.PureComponent<
    DocumentContainerProps,
    DocumentContainerState
  > {
    static initializeDocument = documentInitializer;

    handle: any;
    state = { doc: null };

    componentWillMount = () => {
      this.refreshHandle(this.props.docId);
    };

    componentWillUnmount = () => {
      this.handle && this.handle.close();
    };

    componentDidUpdate = (prevProps, prevState, snapshot) => {
      if (prevProps.docId !== this.props.docId) {
        this.refreshHandle(this.props.docId);
      }
    };

    refreshHandle = docId => {
      if (this.handle) {
        this.handle.close();
      }
      this.handle = (window as any).repo.watch(docId, doc =>
        this.onChange(doc)
      );
    }; // onMessage!?

    onChange = doc => {
      this.setState({ doc });
    };

    render() {
      if (!this.state.doc) {
        return <h2>Loading...</h2>;
      }

      return (
        <WrappedComponent
          {...this.props}
          doc={this.state.doc}
          change={this.handle.change.bind(this.handle)}
        />
      );
    }

    renderLoading() {}
  };
  return DocumentContainer;
}
