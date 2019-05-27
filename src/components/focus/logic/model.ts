import uuid from "uuid/v4";

export interface Card {
  id: number;
  title: string;
  description: string;
}

export function initFocus(focus, attrs) {
  focus.cards = attrs.cards || {};
  focus.plan = attrs.plan || [];
  focus.deck = attrs.deck || [];
  focus.discard = attrs.discard || [];
  focus.complete = attrs.complete || [];
}

export function initFocusCard(card, attrs) {
  card.id = attrs.id || uuid();
  card.title = attrs.title || null;
  card.description = attrs.description || null;
}
