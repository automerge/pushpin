import React from "react";
import { cardDimensions } from "../logic/constants";
import FocusCard from "./focus-card";
import * as model from "../logic/model";

export interface Props {
  cards: model.Card[];
}

const styles = {
  host: {
    "box-sizing": "border-box" as "border-box",
    width: "100%",
    height: "100%",
    position: "relative" as "relative",
    padding: "10px",
    "background-color": "blue",
    display: "grid",
    "grid-template-columns": `repeat(
          auto-fill,
          ${cardDimensions.width}px
        )`,
    "grid-gap": "10px",
    "justify-content": "center",
    "overflow-y": "auto"
  }
};

export default class FocusCardSpread extends React.PureComponent<Props> {
  cards: model.Card[] = [];

  onDragOver(event: any) {
    event.preventDefault();
  }

  onDrop(event: any) {
    event.preventDefault();
    const card = event.dataTransfer.getData("text/plain");
    this.cards = [card, ...this.cards];
  }

  render() {
    return (
      <div style={styles.host}>
        {this.cards.map(card => (
          <FocusCard card={card} />
        ))}
      </div>
    );
  }
}
