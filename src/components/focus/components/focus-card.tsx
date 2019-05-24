import React from "react";
import { cardDimensions } from "../logic/constants";
import * as model from "../logic/model";

const styles = {
  host: {
    "box-sizing": "border-box" as "border-box",
    display: "block" as "block",
    padding: "10px",
    "background-color": "#e7e7e7",
    width: `${cardDimensions.width}px`,
    height: `${cardDimensions.height}px`
  },

  h1: {
    "margin-bottom": "5px",
    "font-size": "16px"
  }
};

export interface Props {
  card: model.Card;
}

export default class Card extends React.PureComponent<Props> {
  onDragStart(event: any) {
    console.log("drag start");
    event.dataTransfer.setData("text/plain", this.props.card.id);
  }

  render() {
    const { card } = this.props;
    return (
      <div style={styles.host}>
        <h1>${card.title}</h1>
        <p>${card.description}</p>
      </div>
    );
  }
}
