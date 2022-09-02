// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2022 Jani Nikula <jani@nikula.org>

import * as timeutil from './time-util';

class Player {
  // game
  readonly pid: number;
  readonly name: string;
  frame_1st: number = 0;
  frame_2nd: number = 0;
  frame_3rd: number = 0;

  game_high_break: number = 0;
  game_balls: number = 0;

  // frame
  pos: number;
  points: number = 0;
  winner: boolean = false;
  loser: boolean = false;
  frame_high_break: number = 0;
  frame_balls: number = 0;
  _frame_time: number = 0;

  // turn
  _cur_break: number[] = [];
  _last_break: number[] = [];

  _copy(source: Object): void {
    Object.assign(this, source);
  }

  constructor(pid: number, pos: number, name: string, source: Object = null) {
    this.pid = pid;
    this.pos = pos;
    this.name = name;

    if (source)
      this._copy(source);
  }

  pot_points(points: number): void {
    this.points += points;
    this._cur_break.push(points);

    const cur_break: number = this._cur_break.reduce((a, b) => a + b);

    // game stats
    this.game_balls++;
    this.game_high_break = Math.max(this.game_high_break, cur_break);

    // frame stats
    this.frame_balls++;
    this.frame_high_break = Math.max(this.frame_high_break, cur_break);
  }

  log_foul(points: number): void {
    this._cur_break.push(-points);
  }

  _break_size(b: number[]): number {
    b = b.filter((v) => v > 0);

    if (b.length === 0)
      return 0;

    return b.reduce((a, b) => a + b);
  }

  get cur_break(): number {
    return this._break_size(this._cur_break);
  }

  get last_break(): number {
    return this._break_size(this._last_break);
  }

  end_turn(): void {
    this._last_break = [...this._cur_break];
    this._cur_break = [];
  }

  get frame_time(): string {
    return timeutil.format_ms(this._frame_time);
  }

  log_time(duration: number): void {
    this._frame_time += duration;
  }

  new_frame(pos: number): void {
    this.end_turn();

    this.points = 0;
    this.pos = pos;
    this.winner = false;
    this.loser = false;

    this.frame_high_break = 0;
    this.frame_balls = 0;
    this._frame_time = 0;
  }

  compare(other: Player): number {
    if (this.winner || other.loser)
      return 1;
    else if (this.loser || other.winner)
      return -1;
    else if (this.points != other.points)
      return this.points - other.points;
    else
      return this.pos - other.pos;
  }
};

export default Player;
