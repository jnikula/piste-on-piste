// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 Jani Nikula <jani@nikula.org>

import { Options } from './Options.svelte.ts';
import { SaveGame } from './SaveGame.svelte.ts';
import { State } from './State.ts';

export class Game {
  undo_stack: State[] = $state([]);
  undo_index: number = $state(-1);
  save_game_slot: number = $state(0);

  constructor() {
  }

  save(): void {
    SaveGame.save(this.undo_stack, this.save_game_slot);
  }

  // FIXME: handle failure to load properly
  load(slot: number): void {
    let undo_stack: State[] = [];

    undo_stack = SaveGame.load(slot);
    if (!undo_stack)
      return;

    this.undo_stack = undo_stack;
    this.undo_index = undo_stack.length - 1;

    // save this in the same slot
    this.save_game_slot = slot;
  }

  get state(): State {
    return this.undo_stack[this.undo_index];
  }

  get can_undo(): boolean {
    return this.undo_index > 0;
  }

  undo(): void {
    console.assert(this.can_undo);

    this.undo_index--;
  }

  get can_redo(): boolean {
    return this.undo_index + 1 < this.undo_stack.length;
  }

  redo(): void {
    console.assert(this.can_redo);

    this.undo_index++;
  }

  _push(): void {
    let state: State = this.state.deepcopy();

    this.undo_stack.splice(++this.undo_index, this.undo_stack.length, state);
  }

  pot_ball(value: number): void {
    this._push();
    this.state.pot_ball(value);
    this.save();
  }

  plus_balls(): void {
    this._push();
    this.state.plus_balls();
    this.save();
  }

  minus_balls(): void {
    this._push();
    this.state.minus_balls();
    this.save();
  }

  commit_foul(value: number): void {
    this._push();
    this.state.commit_foul(value);
    this.save();
  }

  end_turn(): void {
    this._push();
    this.state.end_turn();
    this.save();
  }

  foul_retake(): void {
    this._push();
    this.state.foul_retake();
    this.save();
  }

  concede(pid: number): void {
    this._push();
    this.state.concede(pid);
    this.save();
  }

  declare_winner(pid: number): void {
    this._push();
    this.state.declare_winner(pid);
    this.save();
  }

  edit_points(pid: number, amount: number): void {
    this._push();
    this.state.player_edit_points(pid, amount);
    this.save();
  }

  new_frame(): void {
    this._push();
    this.state.new_frame();
    this.save();
  }

  // FIXME: use real type
  new_game(options: Options, slot: number): void {
    this.undo_stack = [new State(options)];
    this.undo_index = 0;
    this.save_game_slot = slot;
    // Note: Don't autosave before first shot
  }
};
