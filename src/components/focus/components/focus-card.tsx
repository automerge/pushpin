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
      <div className="FocusCard">
        <input
          className="FocusCard-title"
          placeholder="Title..."
          type="text"
          onChange={this.onTitleChange}
          value={doc.title}
        />
        <textarea
          className="FocusCard-description"
          placeholder="Description..."
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
