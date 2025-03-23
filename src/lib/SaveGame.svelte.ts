// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 Jani Nikula <jani@nikula.org>

import { State } from './State.ts';

export type SaveGameId = {
  slot: number;
  timestamp: number;
};

export class SaveGame {
  saved_games: SaveGameId[] = $state();

  constructor() {
    this.saved_games = this._read_saved_games();
  }

  _read_saved_games(): SaveGameId[] {
    let saved: SaveGameId[] = [];

    for (let slot of [0,1,2]) {
      let timestamp: number = 0;
      let json: string = localStorage.getItem(SaveGame.save_game_name(slot));

      if (json) {
	let source = JSON.parse(json);
	timestamp = source[0].timestamp; // first frame start time
      }

      saved.push({ slot: slot, timestamp: timestamp });
    }

    // newest to oldest, with unused (timestamp 0) being oldest
    saved.sort((s1: SaveGameId, s2: SaveGameId) => s2.timestamp - s1.timestamp);

    return saved;
  }

  new_game_slot(): number {
    // save new game in the oldest slot
    return this.saved_games[this.saved_games.length - 1].slot;
  }

  private static save_game_name(slot: number): string {
    return `piste-on-piste-save-${slot}`;
  }

  static save(undo_stack: State[], slot: number): void {
    localStorage.setItem(this.save_game_name(slot), JSON.stringify(undo_stack));
  }

  static load(slot: number): State[] {
    let undo_stack: State[] = [];

    let json: string = localStorage.getItem(this.save_game_name(slot));
    if (!json)
      return null;

    let source = JSON.parse(json);

    for (let s of source)
      undo_stack.push(new State(null, s));

    return undo_stack;
  }
};
