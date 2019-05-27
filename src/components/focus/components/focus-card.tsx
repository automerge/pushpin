import React from "react";
import ContentTypes from "../../../content-types";
import uuid from "uuid/v4";

import * as model from "../logic/model";
import withDocument from "../withDocument";

export interface Props {
  url: string;
  doc: model.Card;
  change: Function;
}

export default class FocusCard extends React.PureComponent<Props> {
  static contentType = "FocusCard";
  static contentName = "Focus Card";
  static initializeDocument(doc, attrs) {
    doc.title = attrs.title || null;
    doc.description = attrs.description || null;
    doc.id = attrs.id || uuid();
  }

  onDragStart = (event: any) => {
    console.log("drag start");
    console.log(this.props);
    event.dataTransfer.setData("application/pushpin-url", this.props.url);
  };

  onTitleChange = (event: any) => {
    this.props.change(draft => {
      draft.title = event.target.value;
    });
  };

  onDescriptionChange = (event: any) => {
    this.props.change(draft => {
      draft.description = event.target.value;
    });
  };

  render() {
    const { doc } = this.props;
    return (
      <div draggable onDragStart={this.onDragStart} className="FocusCard">
        <input
          className="FocusCard-title"
          type="text"
          onChange={this.onTitleChange}
          value={doc.title}
        />
        <textarea
          className="FocusCard-description"
          onChange={this.onDescriptionChange}
          value={doc.description}
        />
      </div>
    );
  }
}

// TODO: Should this be a ContentType?
ContentTypes.register({
  component: withDocument(FocusCard, FocusCard.initializeDocument),
  type: FocusCard.contentType,
  name: FocusCard.contentName,
  icon: "focus"
});
