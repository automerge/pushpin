import React from "react";

export interface Props {
  url: string;
}

export interface BoardCardAttributes {
  minWidth: number;
  defaultWidth: number;
  maxWidth: number;
  minHeight: number;
  defaultHeight: number;
  maxHeight: number;
}

// TODO: this is mutable below!
const defaultCardAttributes: BoardCardAttributes = {
  minWidth: 4,
  minHeight: 6,
  defaultWidth: 6,
  defaultHeight: 6,
  maxWidth: 9,
  maxHeight: 9
};

export default function asBoardCard(
  WrappedComponent,
  cardAttributes: BoardCardAttributes = defaultCardAttributes
) {
  const BoardCardContainer = class extends React.PureComponent<Props> {
    static minWidth = cardAttributes.minWidth;
    static minHeight = cardAttributes.minHeight;
    static defaultWidth = cardAttributes.defaultWidth;
    static defaultHeight = cardAttributes.defaultHeight;
    static maxWidth = cardAttributes.maxWidth;
    static maxHeight = cardAttributes.maxHeight;

    state = {};

    handleDoubleClick = e => {
      e.stopPropagation();
      window.location = (this.props.url as unknown) as Location;
    };

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
  return BoardCardContainer;
}
