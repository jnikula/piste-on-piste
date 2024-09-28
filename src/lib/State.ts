// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2022 Jani Nikula <jani@nikula.org>

import Player from './Player';
import * as timeutil from './time-util';

const MAX_BALLS: number = 15 + 6;

const permutations = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
  [0, 2, 1],
  [1, 0, 2],
  [2, 1, 0]
]

class State {
  // game
  cur_perm: number = 0;
  num_frames: number = 0;

  // frame
  timestamp: number;
  _start_timestamp: number = 0;
  _end_timestamp: number = 0;
  _shot_timestamp: number = 0;
  _num_balls: number = MAX_BALLS;

  cur_pos: number = 0;
  cur_pid: number = 0;
  prev_pid: number = -1;
  red: boolean = false;
  foul: boolean = false;
  retake: boolean = false;
  respot_black: boolean = false;

  players: Player[] = [];

  _copy(source: Object): void {
    // this will override players
    Object.assign(this, source);

    for (let i in this.players)
      this.players[i] = new Player(0, 0, '', this.players[i]);
  }

  constructor(names=null, source: Object = null) {
    // frame
    this.timestamp = Date.now()

    for (let pid of [0,1,2]) {
      let name: string;

      if (names && pid < names.length && names[pid].name && names[pid].name.length > 0)
	name = names[pid].name;
      else
	name = `player ${pid}`;

      let pos: number = permutations[this.cur_perm].indexOf(pid);

      if (pos === this.cur_pos)
	this.cur_pid = pid;

      let p: Player = new Player(pid, pos, name);

      this.players.push(p)
    }

    if (source)
      this._copy(source);
  }

  deepcopy(): State {
    let source: Object = JSON.parse(JSON.stringify(this));

    return new State(null, source);
  }

  _get_player_by_pid(pid: number): Player {
    for (let p of this.players) {
      if (p.pid == pid)
	return p;
    }

    console.assert(false, 'player by pid ' + pid + ' not found');

    return null;
  }

  _get_player_by_pos(pos: number): Player {
    for (let p of this.players) {
      if (p.pos === pos)
	return p;
    }

    console.assert(false, 'player by pos ' + pos + ' not found');

    return null;
  }

  previous_player(): Player {
    return this._get_player_by_pid(this.prev_pid);
  }

  current_player(): Player {
    return this._get_player_by_pid(this.cur_pid);
  }

  // All the statuses
  num_reds(): number {
    if (this._num_balls > 6)
      return this._num_balls - 6;
    else
      return 0
  }

  num_colors(): number {
    if (this._num_balls > 6)
      return 6;
    else
      return this._num_balls;
  }

  num_balls(value: number): number {
    if (value === 0)
      return this._num_balls;
    else if (value === 1)
      return this.num_reds();
    else if (this.num_colors() - (7 - value + 1) >= 0)
      return 1;
    else
      return 0;
  }

  num_points(): number {
    if (this.num_colors() === 0)
      return 0;

    const reds_and_blacks: number = this.num_reds() * (1 + 7);
    const colors: number = [2, 3, 4, 5, 6, 7].slice(-this.num_colors()).reduce((a, b) => a + b);

    return reds_and_blacks + colors;
  }

  get_players(): Player[] {
    return [...this.players].sort((p1, p2) => p1.pos - p2.pos);
  }

  // All the actions

  can_concede(pid: number): boolean {
    if (this._is_frame_over())
      return false;

    let p: Player = this._get_player_by_pid(pid);

    // current player can't concede
    if (this.is_current_player(pid))
      return false;

    // players still in the game
    const players: Player[] = this.players.filter((p) => !p.loser && !p.winner).sort((p1, p2) => p1.compare(p2));

    // only the last player can concede
    if (players[0].points != p.points)
      return false;

    // the last player can concede only if snookers required
    if (players[1].points - players[0].points <= this.num_points())
      return false;

    return true;
  }

  concede(pid: number): void {
    let p = this._get_player_by_pid(pid);
    p.loser = true;
  }

  can_declare_winner(pid: number): boolean {
    if (this._is_frame_over())
      return false;

    let p: Player = this._get_player_by_pid(pid);

    // current player can't be declared winner
    if (this.is_current_player(pid))
      return false;

    // players still in the game
    const players: Player[] = this.players.filter((p) => !p.loser && !p.winner).sort((p1, p2) => p1.compare(p2));

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

  declare_winner(pid: number): void {
    let p: Player = this._get_player_by_pid(pid);
    p.winner = true;
  }

  is_current_player(pid: number): boolean {
    if (this._is_frame_over())
      return false;

    let p: Player = this.current_player();

    return pid === p.pid;
  }

  is_previous_player(pid: number): boolean {
    if (this._is_frame_over())
      return false;

    let p: Player = this.previous_player();

    return pid === p.pid;
  }

  _out_of_reach(p1: Player, p2: Player): boolean {
    if (this.num_colors() > 1)
      return false;

    return Math.abs(p1.points - p2.points) > this.num_points();
  }

  _num_players_left(): number {
    return this.players.filter((p) => !p.loser && !p.winner).length;
  }

  _have_winner(): boolean {
    return this.players.filter((p) => p.winner).length > 0;
  }

  _have_loser(): boolean {
    return this.players.filter((p) => p.loser).length > 0;
  }

  _has_frame_started(): boolean {
    return this._start_timestamp != 0;
  }

  _is_frame_over(): boolean {
    return this._have_winner() && this._have_loser();
  }

  _detect_win_lose(): void {
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

  _sorted_players(): Player[] {
    return [...this.players].sort((p1, p2) => p1.compare(p2));
  }

  get_frame_time(): string {
    let frame_time: number;

    if (this._is_frame_over())
      frame_time = this._end_timestamp - this._start_timestamp;
    else if (this._has_frame_started())
      frame_time = Date.now() - this._start_timestamp;
    else
      frame_time = 0;

    return timeutil.format_ms(frame_time);
  }

  _log_shot(value: number): void {
    const now = Date.now();
    let shot_duration: number;

    if (this._has_frame_started()) {
      shot_duration = now - this._shot_timestamp;
    } else {
      // First shot, start the frame timer, use zero shot duration
      this._start_timestamp = now
      shot_duration = 0;
    }

    this._shot_timestamp = now;

    let p = this.current_player();
    p.log_shot(shot_duration, value);
  }

  _end_turn(): void {
    let p: Player = this.current_player();
    p.end_turn();

    this._detect_win_lose();

    let requested_retake: Player = null;
    if (this.retake) {
      requested_retake = this._get_player_by_pos(this.cur_pos);

      // If the player who requested to play again dropped as winner or loser
      // during the play again, skip their turn
      if (requested_retake.winner || requested_retake.loser)
	requested_retake = null;
    }

    this.prev_pid = this.cur_pid;
    this.red = false;
    this.foul = false;
    this.retake = false;
    this.respot_black = false;

    if (this._num_players_left() === 1) {
      for (const [pos, p] of this._sorted_players().entries())
	p.pos = pos;
    } else if (requested_retake) {
      this.cur_pid = requested_retake.pid;
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
      let player: Player;

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

    // end frame or respot black?
    if (this._is_frame_over()) {
      this._end_frame();
    } else if (this.num_colors() === 0) {
      this._num_balls++;
      this.respot_black = true;
    }
  }

  _pot_points(points: number): void {
    this.foul = false;

    let p: Player = this.current_player();
    p.pot_points(points);

    if (this.num_points() === 0)
      this._end_turn();
  }

  _can_pot_red(): boolean {
    // Note: Can pot two reds at a time!
    return this.num_reds() > 0;
  }

  _pot_red(): void {
    console.assert(this._can_pot_red());

    this._num_balls--;
    this.red = true;

    this._pot_points(1);
  }

  _can_pot_color(value: number): boolean {
    if (this.red)
      return true;

    if (this.num_reds() > 0)
      return false;

    return this.num_colors() - (7 - value + 1) === 0;
  }

  _pot_color(value: number): void {
    console.assert(this._can_pot_color(value));

    if (this.num_reds() === 0 && !this.red)
      this._num_balls--;

    this.red = false;

    this._pot_points(value);
  }

  can_pot_ball(value: number): boolean {
    if (value === 1)
      return this._can_pot_red();
    else
      return this._can_pot_color(value);
  }

  pot_ball(value: number): void {
    console.log('pot ball: ' + value)

    this._log_shot(value);

    if (value === 1)
      this._pot_red();
    else
      this._pot_color(value);
  }

  can_commit_foul(value: number): boolean {
    return this.num_colors() - (7 - value + 1) >= 0;
  }

  commit_foul(value: number): void {
    console.assert(this.can_commit_foul(value));

    this._log_shot(-value);

    let player: Player = this.current_player();
    if (this.prev_pid === -1 ||
	player._cur_break.length > 0 ||
	this.retake ||
	this.prev_pid === this.cur_pid) {
      for (let p of this.players)
	if (p.pid != this.cur_pid)
	  p.points += value;
    } else {
      let p: Player = this.previous_player();
      p.points += value;
    }

    player.log_foul(value);

    // foul on last black, drop ball count to zero to cause end frame
    if (this.num_colors() === 1)
      this._num_balls--;

    this._end_turn();

    this.foul = true;
  }

  can_end_turn(): boolean {
    return !this._is_frame_over();
  }

  end_turn(): void {
    this._log_shot(0);
    this._end_turn();
  }

  _end_frame(): void {
    this._end_timestamp = Date.now();

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

  can_new_frame(): boolean {
    return this._is_frame_over();
  }

  new_frame(): void {
    // game
    this.cur_perm++;
    if (this.cur_perm >= permutations.length)
      this.cur_perm = 0;

    // frame
    this.timestamp = Date.now();
    this._start_timestamp = 0;
    this._end_timestamp = 0;
    this._shot_timestamp = 0;
    this._num_balls = MAX_BALLS;

    this.cur_pos = 0;
    this.cur_pid = 0; // updated below
    this.prev_pid = -1;
    this.red = false;
    this.foul = false;
    this.retake = false;
    this.respot_black = false;

    for (let p of this.players) {
      let pos: number = permutations[this.cur_perm].indexOf(p.pid);

      p.new_frame(pos);

      if (pos === 0)
	this.cur_pid = p.pid;
    }
  }

  can_plus_balls(): boolean {
    return this._num_balls < MAX_BALLS;
  }

  plus_balls(): void {
    console.log('plus balls');
    console.assert(this.can_plus_balls());

    this._num_balls++;
  }

  can_minus_balls(): boolean {
    return this._num_balls > 0;
  }

  minus_balls(): void {
    console.log('minus balls');
    console.assert(this.can_minus_balls());

    this._num_balls--;
  }

  can_foul_retake(): boolean {
    return this.foul && !this._is_frame_over() && !this.respot_black;
  }

  foul_retake(): void {
    console.assert(this.can_foul_retake());

    this._log_shot(0)

    this.retake = true;
    this.foul = false;

    // Note: prev_pid will match cur_pid for retakes
    this.cur_pid = this.prev_pid;

    // Note: No end turn!
  }

  can_player_edit_points(pid: number, amount: number): boolean {
    let p: Player = this._get_player_by_pid(pid);

    return p.points + amount >= 0;
  }

  player_edit_points(pid: number, amount: number): void {
    console.assert(this.can_player_edit_points(pid, amount));

    let p: Player = this._get_player_by_pid(pid);

    // FIXME: maybe don't adjust player points here directly
    p.points = p.points + amount;
  }
}

export default State;
