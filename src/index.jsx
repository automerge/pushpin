import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Hypermerge from 'hypermerge';
import RAM from 'random-access-memory';

import { RootState, Reducer } from './model';
import { INITIALIZE_IF_EMPTY, CARD_DELETED, DOCUMENT_READY, DOCUMENT_UPDATED } from './action-types';
import HashForm from './components/hash-form';
import Board from './components/board';
// The debug module wants to cache the env['DEBUG'] config, but they get it
// wrong, at least for the render process. Delete the attempted cache so it
// doesn't confuse future instances.
localStorage.removeItem('debug');

const onKeyDown = (e, store) => {
  if (e.key === 'Backspace') {
    const state = store.getState();
    for (const id in state.board.cards) {
      const card = state.board.cards[id];
      if ((id === state.selected) && (card.type !== 'text')) {
        store.dispatch({ type: CARD_DELETED, id: card.id });
      }
    }
  }
};

const centerOnStart = () => {
  const board = document.getElementById('board');
  window.scrollTo((board.clientWidth / 2) - (window.innerWidth / 2), 0);
};

const init = () => {
  const hm = new Hypermerge({ path: RAM, port: 0 });
  hm.once('ready', () => {
    hm.joinSwarm();

    const store = createStore(Reducer(hm), RootState);

    hm.on('document:ready', (docId, doc) => {
      store.dispatch({ type: DOCUMENT_READY, docId, doc });
      store.dispatch({ type: INITIALIZE_IF_EMPTY });
    });

    hm.on('document:updated', (docId, doc) => {
      store.dispatch({ type: DOCUMENT_UPDATED, docId, doc });
    });

    hm.create();

    render(store);
  });
};

const render = (store) => {
  ReactDOM.render(
    <Provider store={store}>
      <div>
        <HashForm />
        <Board />
      </div>
    </Provider>,
    document.getElementById('container'),
  );

  document.addEventListener('keydown', (e) => { onKeyDown(e, store); });

  centerOnStart();
};

init();
