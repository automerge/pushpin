import React from "react";
import Debug from "debug";

import ContentTypes from "../../content-types";
import Content from "../content";

import { cardDimensions } from "./logic/constants";
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

  onCardSpreadDrop = (event: any) => {
    const url = event.dataTransfer.getData("application/pushpin-url");
    if (!url) return;
    log(`dropping card: ${url}`);
    this.props.change(draft => {
      draft.discard.push(url);
    });
  };

  render = () => {
    log("render");
    const storedCards = localStorage.getItem("cards");
    let cards;
    if (storedCards) {
      cards = JSON.parse(storedCards);
    }
    if (!storedCards) {
      cards = [
        Content.create(FocusCard.contentType, {
          title: "Card title",
          description: "Description"
        }),
        Content.create(FocusCard.contentType, {
          title: "Card title",
          description: "Description"
        }),
        Content.create(FocusCard.contentType, {
          title: "Card title",
          description: "Description"
        }),
        Content.create(FocusCard.contentType, {
          title: "Card title",
          description: "Description"
        })
      ];
      localStorage.setItem("cards", JSON.stringify(cards));
    }

    return (
      <div className="Focus">
        <div className="Focus-plan">
          <CardSpread onDrop={this.onCardSpreadDrop} cards={cards} />
        </div>
        <div className="Focus-deck">
          <CardSpread onDrop={this.onCardSpreadDrop} cards={cards} />
        </div>
        <div className="Focus-complete">
          <CardSpread onDrop={this.onCardSpreadDrop} cards={cards} />
        </div>
        <div className="Focus-discard">
          <CardSpread
            onDrop={this.onCardSpreadDrop}
            cards={this.props.doc.discard}
          />
        </div>
        <div className="Focus-new" />
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
