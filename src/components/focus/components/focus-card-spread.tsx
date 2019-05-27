import React from "react";
import { cardDimensions } from "../logic/constants";
import Content from "../../content";

import * as model from "../logic/model";

export interface Props {
  cards: string[]; //card doc urls
  onDrop: (event: any) => void;
}

export default class FocusCardSpread extends React.PureComponent<Props> {
  onDragOver = (event: any) => {
    event.preventDefault();
  };

  onDrop = (event: any) => {
    event.preventDefault();
    this.props.onDrop(event);
  };

  render() {
    return (
      <div
        className="FocusCardSpread"
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}
      >
        {this.props.cards.map(card => (
          <Content key={card} url={card} />
        ))}
      </div>
    );
  }
}
