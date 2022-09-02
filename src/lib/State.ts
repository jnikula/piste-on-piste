// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2022 Jani Nikula <jani@nikula.org>

import Player from './Player';

const MAX_BALLS = 15 + 6;

const permutations = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
  [0, 2, 1],
  [1, 0, 2],
  [2, 1, 0]
]

class State {
  _initialize(names) {
    // game
    this.cur_perm = 0; // FIXME: start random
    this.num_frames = 0;

    // frame
    this.timestamp = Date.now();
    this.turn_timestamp = this.timestamp;
    this._num_balls = MAX_BALLS;

    this.cur_pos = 0;
    this.cur_pid = 0;
    this.prev_pid = -1;
    this.red = false;
    this.foul = false;
    this.retake = false;

    this.players = []
    for (let pid of [0,1,2]) {
      let name;

      if (names && pid < names.length && names[pid].name && names[pid].name.length > 0)
	name = names[pid].name;
      else
	name = `player ${pid}`;

      let pos = permutations[this.cur_perm].indexOf(pid);

      if (pos === this.cur_pos)
	this.cur_pid = pid;

      let p = new Player(pid, pos, name);

      this.players.push(p)
    }

  }

  _copy(source) {
    // this will override players
    Object.assign(this, source);

    for (let i in this.players)
      this.players[i] = new Player(0, 0, '', this.players[i]);
  }

  constructor(names=null, source=null) {
    this._initialize(names);
    if (source)
      this._copy(source);
  }

  deepcopy() {
    let source = JSON.parse(JSON.stringify(this));

    return new State(null, source);
  }

  _get_player_by_pid(pid) {
    for (let p of this.players) {
      if (p.pid == pid)
	return p;
    }

    console.assert(false, 'player by pid ' + pid + ' not found');

    return null;
  }

  _get_player_by_pos(pos) {
    for (let p of this.players) {
      if (p.pos === pos)
	return p;
    }

    console.assert(false, 'player by pos ' + pos + ' not found');

    return null;
  }

  previous_player() {
    return this._get_player_by_pid(this.prev_pid);
  }

  current_player() {
    return this._get_player_by_pid(this.cur_pid);
  }

  // All the statuses
  num_reds() {
    if (this._num_balls > 6)
      return this._num_balls - 6;
    else
      return 0
  }

  num_colors() {
    if (this._num_balls > 6)
      return 6;
    else
      return this._num_balls;
  }

  num_balls(value) {
    if (value === 0)
      return this._num_balls;
    else if (value === 1)
      return this.num_reds();
    else if (this.num_colors() - (7 - value + 1) >= 0)
      return 1;
    else
      return 0;
  }

  num_points() {
    if (this.num_colors() === 0)
      return 0;

    const reds_and_blacks = this.num_reds() * (1 + 7);
    const colors = [2, 3, 4, 5, 6, 7].slice(-this.num_colors()).reduce((a, b) => a + b);

    return reds_and_blacks + colors;
  }

  get_players() {
    return [...this.players].sort((p1, p2) => p1.pos - p2.pos);
  }

  // All the actions

  can_concede(pid) {
    if (this._is_frame_over())
      return false;

    let p = this._get_player_by_pid(pid);

    // current player can't concede
    if (this.is_current_player(pid))
      return false;

    // players still in the game
    const players = this.players.filter((p) => !p.loser && !p.winner).sort((p1, p2) => p1.compare(p2));

    // only the last player can concede
    if (players[0].points != p.points)
      return false;

    // the last player can concede only if snookers required
    if (players[1].points - players[0].points <= this.num_points())
      return false;

    return true;
  }

  concede(pid) {
    let p = this._get_player_by_pid(pid);
    p.loser = true;
  }

  can_declare_winner(pid) {
    if (this._is_frame_over())
      return false;

    let p = this._get_player_by_pid(pid);

    // current player can't be declared winner
    if (this.is_current_player(pid))
      return false;

    // players still in the game
    const players = this.players.filter((p) => !p.loser && !p.winner).sort((p1, p2) => p1.compare(p2));

    // can declare winner only if everyone still in the game
    if (players.length != 3)
      return false;

    // only the first player can be declared winner
    if (players[2].points != p.points)
      return false;

    // the first player can be declared winner only if snookers required
    if (players[2].points - players[1].points <= this.num_points())
      return false;

    return true;
  }

  declare_winner(pid) {
    let p = this._get_player_by_pid(pid);
    p.winner = true;
  }

  is_current_player(pid) {
    if (this._is_frame_over())
      return false;

    let p = this.current_player();
    return pid === p.pid;
  }

  is_previous_player(pid) {
    if (this._is_frame_over())
      return false;

    let p = this.previous_player();
    return pid === p.pid;
  }

  _out_of_reach(p1, p2) {
    if (this.num_colors() > 1)
      return false;

    return Math.abs(p1.points - p2.points) > this.num_points();
  }

  _num_players_left() {
    return this.players.filter((p) => !p.loser && !p.winner).length;
  }

  _have_winner() {
    return this.players.filter((p) => p.winner).length > 0;
  }

  _have_loser() {
    return this.players.filter((p) => p.loser).length > 0;
  }

  _is_frame_over() {
    return this._have_winner() && this._have_loser();
  }

  _detect_win_lose() {
    // players still in the game
    const players = this.players.filter((p) => !p.loser && !p.winner).sort((p1, p2) => p1.compare(p2));

    // win/lose conditions
    if (players.length == 3) {
      if (this._out_of_reach(players[0], players[1]))
	players[0].loser = true;
      if (this._out_of_reach(players[1], players[2]))
	players[2].winner = true;
    } else if (players.length == 2) {
      if (this._out_of_reach(players[0], players[1])) {
	if (this._have_winner())
	  players[0].loser = true;
	else
	  players[1].winner = true;
      }
    }
  }

  _sorted_players() {
    return [...this.players].sort((p1, p2) => p1.compare(p2));
  }

  _log_player_time() {
    const now = Date.now();
    const turn_duration = now - this.turn_timestamp;

    this.turn_timestamp = now;

    let p = this.current_player();
    p.log_time(turn_duration);
  }

  _end_turn() {
    this._log_player_time();

    let p = this.current_player();
    p.end_turn();

    let retake = this.retake;

    this.prev_pid = this.cur_pid;
    this.red = false;
    this.foul = false;
    this.retake = false;

    this._detect_win_lose();

    if (this._num_players_left() === 1) {
      for (const [pos, p] of this._sorted_players().entries())
	p.pos = pos;
    } else if (retake) {
      p = this._get_player_by_pos(this.cur_pos);
      this.cur_pid = p.pid;
    } else if (this._num_players_left() === 3) {
      this.cur_pos++;

      // New round
      if (this.cur_pos >= 3) {
	for (const [pos, p] of this._sorted_players().entries())
	  p.pos = pos;
	this.cur_pos = 0;
      }

      p = this._get_player_by_pos(this.cur_pos);
      this.cur_pid = p.pid;
    } else if (this._num_players_left() === 2) {
      let player;

      while (true) {
	this.cur_pos++;
	if (this.cur_pos >= 3)
	  this.cur_pos = 0;
	player = this._get_player_by_pos(this.cur_pos);
	if (player.winner || player.loser)
	  continue;
	else
	  break;
      }

      // sort
      for (const [pos, p] of this._sorted_players().entries())
	p.pos = pos;

      this.cur_pid = player.pid;
      this.cur_pos = player.pos;
    }
  }

  _pot_points(points) {
    this.foul = false;

    let p = this.current_player();
    p.pot_points(points);

    // game over
    if (this.num_points() === 0)
      this._end_turn();
  }

  _can_pot_red() {
    // Note: Can pot two reds at a time!
    return this.num_reds() > 0;
  }

  _pot_red() {
    console.assert(this._can_pot_red());

    this._num_balls--;
    this.red = true;

    this._pot_points(1);
  }

  _can_pot_color(value) {
    if (this.red)
      return true;

    if (this.num_reds() > 0)
      return false;

    return this.num_colors() - (7 - value + 1) === 0;
  }

  _pot_color(value) {
    console.assert(this._can_pot_color(value));

    if (this.num_reds() === 0 && !this.red)
      this._num_balls--;

    this.red = false;

    this._pot_points(value);
  }

  can_pot_ball(value) {
    if (value === 1)
      return this._can_pot_red();
    else
      return this._can_pot_color(value);
  }

  pot_ball(value) {
    console.log('pot ball: ' + value)

    if (value === 1)
      this._pot_red();
    else
      this._pot_color(value);
  }

  can_commit_foul(value) {
    return this.num_colors() - (7 - value + 1) >= 0;
  }

  commit_foul(value) {
    console.assert(this.can_commit_foul(value));

    let player = this.current_player();
    if (this.prev_pid === -1 ||
	player._cur_break.length > 0 ||
	this.retake ||
	this.prev_pid === this.cur_pid) {
      for (let p of this.players)
	if (p.pid != this.cur_pid)
	  p.points += value;
    } else {
      let p = this.previous_player();
      p.points += value;
    }

    player.log_foul(value);

    this._end_turn();

    this.foul = true;
  }

  can_end_turn() {
    return !this._is_frame_over();
  }

  end_turn() {
    this._end_turn();
  }

  _end_frame() {
    this.num_frames++;

    for (let p of this.players) {
      if (p.pos == 0)
	p.frame_3rd++;
      else if (p.pos == 1)
	p.frame_2nd++;
      else
	p.frame_1st++;
    }
  }

  can_new_frame() {
    return this._is_frame_over();
  }

  new_frame() {
    // FIXME: this should happen earlier, when frame is over
    this._end_frame();

    // game
    this.cur_perm++;
    if (this.cur_perm >= permutations.length)
      this.cur_perm = 0;

    // frame
    this.timestamp = Date.now();
    this.turn_timestamp = this.timestamp;
    this._num_balls = MAX_BALLS;

    this.cur_pos = 0;
    this.cur_pid = 0; // updated below
    this.prev_pid = -1;
    this.red = false;
    this.foul = false;
    this.retake = false;

    for (let p of this.players) {
      let pos = permutations[this.cur_perm].indexOf(p.pid);

      p.new_frame(pos);

      if (pos === 0)
	this.cur_pid = p.pid;
    }
  }

  can_plus_balls() {
    return this._num_balls < MAX_BALLS;
  }

  plus_balls() {
    console.log('plus balls');
    console.assert(this.can_plus_balls());

    this._num_balls++;
  }

  can_minus_balls() {
    return this._num_balls > 0;
  }

  minus_balls() {
    console.log('minus balls');
    console.assert(this.can_minus_balls());

    this._num_balls--;
  }

  can_foul_retake() {
    return this.foul && !this._is_frame_over();
  }

  foul_retake() {
    console.assert(this.can_foul_retake());

    this._log_player_time()

    this.retake = true;
    this.foul = false;

    // Note: prev_pid will match cur_pid for retakes
    this.cur_pid = this.prev_pid;

    // Note: No end turn!
  }
}

export default State;
