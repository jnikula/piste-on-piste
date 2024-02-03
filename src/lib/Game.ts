// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2024 Jani Nikula <jani@nikula.org>

import { writable } from 'svelte/store';
import type State from './State';

class Game {
  undo_stack: State[] = [];
  undo_index: number = -1;
  save_game_slot: number = 0;
  state: State;

  constructor() {
  }
};

function create_game(_game: Game) {
  let { set, update, subscribe } = writable(_game);

  return { set, update, subscribe };
}

export const game = create_game(new Game());
