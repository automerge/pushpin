import React from "react";
import Content from "../../content";

export interface Props {
  cards: string[]; //card doc urls
  onDrop: (event: any) => void;
  onCardDrag: (event: any, card: string) => void;
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
          <div
            draggable
            onDragStart={event => this.props.onCardDrag(event, card)}
          >
            <Content key={card} url={card} />
          </div>
        ))}
      </div>
    );
  }
}
