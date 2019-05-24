import React from "react";
import Debug from "debug";

import ContentTypes from "../../content-types";
import { cardDimensions } from "./logic/constants";

const log = Debug("pushpin:focus");

const css = {
  host: {
    "box-sizing": "border-box",
    width: "100%",
    height: "100%",
    position: "relative",
    "background-color": "red",
    display: "grid",
    "grid-template-columns": `1fr 1fr 1fr minmax(
        ${cardDimensions.width + 25}px,
        1fr
      )`,
    "grid-template-rows": "1fr 1fr 1fr",
    "grid-template-areas":
      '"Plan Plan Plan Deck" "Plan Plan Plan Deck" "Complete Discard Discard New"',
    "grid-gap": "1px"
  },

  plan: {
    "grid-area": "Plan"
  },

  deck: {
    "grid-area": "Deck"
  },

  new: {
    "grid-area": "New"
  },

  discard: {
    "grid-area": "Discard"
  },

  complete: {
    "grid-area": "Complete"
  }
};

//export interface Props {
//  docId: string;
//}

export default class Focus extends React.PureComponent {
  static initializeDocument(focus, typeAttrs) {
    log("initializeDocument:Focus");
    focus.cards = {};
    focus.plan = [];
    focus.deck = [];
    focus.discard = [];
    focus.complete = [];
  }

  state = {};
  handle: any;

  onChange = doc => {
    this.setState({ ...doc });
  };

  refreshHandle = docId => {
    if (this.handle) {
      this.handle.close();
    }
    this.handle = (window as any).repo.watch(docId, doc => this.onChange(doc));
  };

  componentDidMount = () => {
    log("componentDidMount");
    this.refreshHandle((this.props as any).docId);
  };

  // If an ImageCard changes docId, React will re-use this component
  // and update the props instead of instantiating a new one and calling
  // componentDidMount. We have to check for prop updates here and
  // update our doc handle
  componentDidUpdate = prevProps => {
    log("componentWillReceiveProps");

    if (prevProps.docId !== (this.props as any).docId) {
      this.refreshHandle((this.props as any).docId);
    }
  };

  render = () => {
    log("render");

    return (
      <div>
        <h1>Focus</h1>
      </div>
    );
  };
}

ContentTypes.register({
  component: Focus,
  type: "focus",
  name: "Focus",
  icon: "focus"
});
