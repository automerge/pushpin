import React from "react";
import Debug from "debug";

import ContentTypes from "../../content-types";

import withDocument from "./withDocument";
import asBoardCard from "./asBoardCard";
import Focus from "./focus";

const log = Debug("pushpin:focus");

export interface Props {
  doc: any;
  change: Function;
}

export default class FocusInBoard extends React.PureComponent<Props> {
  render = () => {
    log("render");
    return (
      <div style={{ background: "#fff", width: "100%", height: "100%" }}>
        <h2>Focus</h2>
      </div>
    );
  };
}

ContentTypes.register({
  component: asBoardCard(withDocument(FocusInBoard, Focus.initializeDocument)),
  type: Focus.contentType,
  context: "board",
  name: Focus.contentName,
  icon: "sticky-note",
  resizable: true
});
