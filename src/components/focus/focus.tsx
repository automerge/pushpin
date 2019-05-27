import React from "react";
import Debug from "debug";

import ContentTypes from "../../content-types";
import Content from "../content";

import CardSpread from "./components/focus-card-spread";
import FocusCard from "./components/focus-card";
import withDocument from "./withDocument";

const log = Debug("pushpin:focus");

export interface Props {
  doc: any;
  change: Function;
}

export default class Focus extends React.PureComponent<Props> {
  static contentType = "focus";
  static contentName = "Focus";
  static initializeDocument(focus, typeAttrs) {
    log("initializeDocument:Focus");
    focus.cards = {};
    focus.plan = [];
    focus.deck = [];
    focus.discard = [];
    focus.complete = [];
  }

  // TODO: this is terrible
  onCardDrop(area: string) {
    return (event: any) => {
      let url = event.dataTransfer.getData("application/pushpin-url");
      const dragOrigin = event.dataTransfer.getData(
        "application/focus-drag-origin"
      );
      if (!dragOrigin) {
        // TODO: support drag from outside Focus.
        // For now, bail.
        return;
      }

      // Don't do anything if dropping in the same area the drag
      // started.
      if (dragOrigin === area) {
        return;
      }

      const isNewCard = dragOrigin === "new";

      if (!url && isNewCard) {
        url = Content.create(FocusCard.contentType);
      }

      if (url) {
        log(`dropping card: ${url}`);
        this.props.change(draft => {
          draft[area].push(url);
          if (dragOrigin && !isNewCard) {
            draft[dragOrigin] = draft[dragOrigin].filter(card => card != url);
          }
        });
      }
    };
  }

  onCardSpreadDrop = (event: any) => {};
  onCardDrag(area: string) {
    return (event: any, cardUrl: string) => {
      event.dataTransfer.setData("application/pushpin-url", cardUrl);
      event.dataTransfer.setData("application/focus-drag-origin", area);
    };
  }

  onNewCardDrag = (event: any) => {
    event.dataTransfer.setData("application/focus-drag-origin", "new");
  };

  render = () => {
    log("render");
    const { doc } = this.props;
    return (
      <div className="Focus">
        <div className="Focus-plan">
          <CardSpread
            onDrop={this.onCardDrop("plan")}
            onCardDrag={this.onCardDrag("plan")}
            cards={doc.plan}
          />
        </div>
        <div className="Focus-deck">
          <CardSpread
            onDrop={this.onCardDrop("deck")}
            onCardDrag={this.onCardDrag("deck")}
            cards={doc.deck}
          />
        </div>
        <div className="Focus-complete">
          <CardSpread
            onDrop={this.onCardDrop("complete")}
            onCardDrag={this.onCardDrag("complete")}
            cards={doc.complete}
          />
        </div>
        <div className="Focus-discard">
          <CardSpread
            onDrop={this.onCardDrop("discard")}
            onCardDrag={this.onCardDrag("discard")}
            cards={doc.discard}
          />
        </div>
        <div className="Focus-new">
          <div draggable onDragStart={this.onNewCardDrag} className="FocusCard">
            <h2>New Card +</h2>
          </div>
        </div>
      </div>
    );
  };
}

ContentTypes.register({
  component: withDocument(Focus, Focus.initializeDocument),
  type: Focus.contentType,
  name: Focus.contentName,
  icon: "focus"
});
