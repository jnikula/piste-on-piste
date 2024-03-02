// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2024 Jani Nikula <jani@nikula.org>

import { writable } from 'svelte/store';
import State from './State';

export type SaveGameId = {
  slot: number;
  timestamp: number;
};

class Game {
  undo_stack: State[] = [];
  undo_index: number = -1;
  _save_game_slot: number = 0;
  saved_games: SaveGameId[];

  static _save_game_name_slot(slot: number): string {
    return `piste-on-piste-save-${slot}`;
  }

  constructor() {
    this._read_saved_games();
  }

  _read_saved_games(): void {
    let saved: SaveGameId[] = [];

    for (let slot of [0,1,2]) {
      let timestamp: number = 0;
      let json: string = localStorage.getItem(Game._save_game_name_slot(slot));

      if (json) {
	let source = JSON.parse(json);
	timestamp = source[0].timestamp; // first frame start time
      }

      saved.push({ slot: slot, timestamp: timestamp });
    }

    // newest to oldest, with unused (timestamp 0) being oldest
    saved.sort((s1: SaveGameId, s2: SaveGameId) => s2.timestamp - s1.timestamp);

    // save new game in the oldest slot
    this._save_game_slot = saved[saved.length - 1].slot;

    this.saved_games = saved;
  }

  save_game_name(): string {
    return Game._save_game_name_slot(this._save_game_slot);
  }

  _save(): void {
    localStorage.setItem(this.save_game_name(), JSON.stringify(this.undo_stack));
  }

  // FIXME: handle failure to load properly
  _load(slot: number): void {
    // save this in the same slot
    this._save_game_slot = slot;

    let json: string = localStorage.getItem(this.save_game_name());
    if (!json)
      return;

    let source = JSON.parse(json);

    for (let s of source)
      this.undo_stack.push(new State(null, s));

    this.undo_index = this.undo_stack.length - 1;
  }

  get state(): State {
    return this.undo_stack[this.undo_index];
  }

  get can_undo(): boolean {
    return this.undo_index > 0;
  }

  _undo(): void {
    console.assert(this.can_undo);

    this.undo_index--;
  }

  get can_redo(): boolean {
    return this.undo_index + 1 < this.undo_stack.length;
  }

  _redo(): void {
    console.assert(this.can_redo);

    this.undo_index++;
  }

  _push(s: State = null): void {
    if (s === null)
      s = this.state.deepcopy();
    this.undo_stack.splice(++this.undo_index, this.undo_stack.length, s);
  }

  _pot_ball(value: number): void {
    this._push();
    this.state.pot_ball(value);
    this._save();
  }

  _plus_balls(): void {
    this._push();
    this.state.plus_balls();
    this._save();
  }

  _minus_balls(): void {
    this._push();
    this.state.minus_balls();
    this._save();
  }

  _commit_foul(value: number): void {
    this._push();
    this.state.commit_foul(value);
    this._save();
  }

  _end_turn(): void {
    this._push();
    this.state.end_turn();
    this._save();
  }

  _foul_retake(): void {
    this._push();
    this.state.foul_retake();
    this._save();
  }

  _concede(pid: number): void {
    this._push();
    this.state.concede(pid);
    this._save();
  }

  _declare_winner(pid: number): void {
    this._push();
    this.state.declare_winner(pid);
    this._save();
  }

  _edit_points(pid: number, amount: number): void {
    this._push();
    this.state.player_edit_points(pid, amount);
    this._save();
  }

  _new_frame(): void {
    this._push();
    this.state.new_frame();
    this._save();
  }

  // FIXME: use real type
  _new_game(names: any[]): void {
    this._push(new State(names));
    // Note: Don't autosave before first shot
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
    load: (slot: number) => update((val) => { val._load(slot); return val; }),
    save: () => update((val) => { val._save(); return val; }),
    pot_ball: (value: number) => update((val) => { val._pot_ball(value); return val; }),
    plus_balls: () => update((val) => { val._plus_balls(); return val; }),
    minus_balls: () => update((val) => { val._minus_balls(); return val; }),
    commit_foul: (value: number) => update((val) => { val._commit_foul(value); return val; }),
    end_turn: () => update((val) => { val._end_turn(); return val; }),
    foul_retake: () => update((val) => { val._foul_retake(); return val; }),
    concede: (pid: number) => update((val) => { val._concede(pid); return val; }),
    declare_winner: (pid: number) => update((val) => { val._declare_winner(pid); return val; }),
    edit_points: (pid: number, amount: number) => update((val) => { val._edit_points(pid, amount); return val; }),
    new_frame: () => update((val) => { val._new_frame(); return val; }),
    new_game: (names: any[]) => update((val) => { val._new_game(names); return val; }),
  };
}

export const game = create_game(new Game());
