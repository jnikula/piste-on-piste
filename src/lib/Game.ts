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

  save_game_name(): string {
    return `piste-on-piste-save-${this.save_game_slot}`;
  }

  _save(): void {
    localStorage.setItem(this.save_game_name(), JSON.stringify(this.undo_stack));
  }

  get can_undo(): boolean {
    return this.undo_index > 0;
  }

  _undo(): void {
    console.assert(this.can_undo);

    this.state = this.undo_stack[--this.undo_index];
  }

  get can_redo(): boolean {
    return this.undo_index + 1 < this.undo_stack.length;
  }

  _redo(): void {
    console.assert(this.can_redo);

    this.state = this.undo_stack[++this.undo_index];
  }
};

function create_game(_game: Game) {
  let { set, update, subscribe } = writable(_game);

  return {
    set,
    update,
    subscribe,
    undo: () => update((val) => { val._undo(); return val; }),
    redo: () => update((val) => { val._redo(); return val; }),
    save: () => update((val) => { val._save(); return val; }),
  };
}

export const game = create_game(new Game());
