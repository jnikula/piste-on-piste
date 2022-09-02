// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2022 Jani Nikula <jani@nikula.org>

import * as timeutil from './time-util';

class Player {
  _initialize(pid, pos, name) {
    // game
    this.pid = pid;
    this.name = name;
    this.frame_1st = 0;
    this.frame_2nd = 0;
    this.frame_3rd = 0;

    this.game_high_break = 0;
    this.game_balls = 0;

    // frame
    this.points = 0;
    this.pos = pos;
    this.winner = false;
    this.loser = false;

    this.frame_high_break = 0;
    this.frame_balls = 0;
    this._frame_time = 0;

    // turn
    this._cur_break = [];
    this._last_break = [];
  }

  _copy(source) {
    Object.assign(this, source);
  }

  constructor(pid, pos, name, source=null) {
    this._initialize(pid, pos, name);
    if (source)
      this._copy(source);
  }

  pot_points(points) {
    this.points += points;
    this._cur_break.push(points);

    const cur_break = this._cur_break.reduce((a, b) => a + b);

    // game stats
    this.game_balls++;
    this.game_high_break = Math.max(this.game_high_break, cur_break);

    // frame stats
    this.frame_balls++;
    this.frame_high_break = Math.max(this.frame_high_break, cur_break);
  }

  log_foul(points) {
    this._cur_break.push(-points);
  }

  _break_size(b) {
    b = b.filter((v) => v > 0);

    if (b.length === 0)
      return 0;

    return b.reduce((a, b) => a + b);
  }

  get cur_break() {
    return this._break_size(this._cur_break);
  }

  get last_break() {
    return this._break_size(this._last_break);
  }

  end_turn() {
    this._last_break = [...this._cur_break];
    this._cur_break = [];
  }

  get frame_time() {
    return timeutil.format_ms(this._frame_time);
  }

  log_time(duration) {
    this._frame_time += duration;
  }

  new_frame(pos) {
    this.end_turn();

    this.points = 0;
    this.pos = pos;
    this.winner = false;
    this.loser = false;

    this.frame_high_break = 0;
    this.frame_balls = 0;
    this._frame_time = 0;
  }

  compare(other) {
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
