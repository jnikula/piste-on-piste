// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2024 Jani Nikula <jani@nikula.org>

import type State from './State';

class Game {
  undo_stack: State[] = [];
  undo_index: number = -1;
  save_game_slot: number = 0;
  state: State;

  constructor() {
  }
};

export default Game;
