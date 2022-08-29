<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (c) 2022 Jani Nikula <jani@nikula.org> -->
<script>
  import { flip } from 'svelte/animate';
  import Ball from './lib/Ball.svelte'
  import Break from './lib/Break.svelte'

  let value_colors = {
    1: 'red',
    2: 'yellow',
    3: 'green',
    4: 'brown',
    5: 'blue',
    6: 'pink',
    7: 'black'
  };

  function pad(num) {
    return num.toString().padStart(2, 0);
  }

  function ms_to_string(ms) {
    let sec = ms / 1000;
    const min = Math.floor(sec / 60);
    sec = Math.floor(sec % 60);

    return pad(min) + ':' + pad(sec);
  }

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
      return ms_to_string(this._frame_time);
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

  class State {
    _initialize(names) {
      // FIXME: should be static
      this.MAX_BALLS = 15 + 6;

      this.permutations = [
        [0, 1, 2],
        [1, 2, 0],
        [2, 0, 1],
        [0, 2, 1],
        [1, 0, 2],
        [2, 1, 0]
      ]

      // game
      this.cur_perm = 0; // FIXME: start random
      this.num_frames = 0;

      // frame
      this.timestamp = Date.now();
      this.turn_timestamp = this.timestamp;
      this._num_balls = this.MAX_BALLS;

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

	let pos = this.permutations[this.cur_perm].indexOf(pid);

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
      if (this.cur_perm >= this.permutations.length)
	this.cur_perm = 0;

      // frame
      this.timestamp = Date.now();
      this.turn_timestamp = this.timestamp;
      this._num_balls = this.MAX_BALLS;

      this.cur_pos = 0;
      this.cur_pid = 0; // updated below
      this.prev_pid = -1;
      this.red = false;
      this.foul = false;
      this.retake = false;

      for (let p of this.players) {
	let pos = this.permutations[this.cur_perm].indexOf(p.pid);

	p.new_frame(pos);

	if (pos === 0)
	  this.cur_pid = p.pid;
      }
    }

    can_plus_balls() {
      return this._num_balls < this.MAX_BALLS;
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

  // stored names for new games

  function shuffle(array) {
    let result = [];

    while (array.length) {
      let index = Math.floor(Math.random() * array.length);
      result.push(array[index]);
      array.splice(index, 1);
    }

    return result;
  }


  // save names to local storage
  function save_names(names) {
    localStorage.setItem('piste-on-piste-names', JSON.stringify(names));
  }

  // load names from local storage
  function load_names() {
    let names_json = localStorage.getItem('piste-on-piste-names');

    if (!names_json)
      return null;

    try {
      let names = JSON.parse(names_json);

      if (!Array.isArray(names) || names.length != 3)
	return null;

      return names;
    } catch (e) {
      return null;
    }
  }

  function setup_names() {
    let names = load_names();

    if (names)
      return shuffle(names);

    names = [];
    for (let i of [1,2,3])
      names.push({ id: i, name: `Player ${i}`});

    return names;
  }

  let ui_names = setup_names();

  // undo stack and current state
  let undo_stack = [];
  let undo_index = -1;
  let save_game_slot = 0;
  let state;

  function save_game_name(slot) {
    return `piste-on-piste-save-${slot}`;
  }

  function save_game() {
    localStorage.setItem(save_game_name(save_game_slot), JSON.stringify(undo_stack));
  }

  function undo_stack_push(s, autosave=true) {
    undo_stack.splice(++undo_index, undo_stack.length, s);

    if (autosave)
      save_game();

    return s;
  }

  $: ui_can_undo = undo_index > 0;
  $: ui_can_redo = undo_index + 1 < undo_stack.length;

  function ui_undo() {
    console.assert(ui_can_undo);

    state = undo_stack[--undo_index];
  }

  function ui_redo() {
    console.assert(ui_can_redo);

    state = undo_stack[++undo_index];
  }

  function read_saved_games() {
    let saved = [];

    for (let slot of [0,1,2]) {
      let timestamp = 0;
      let json = localStorage.getItem(save_game_name(slot));

      if (json) {
	let source = JSON.parse(json);
	timestamp = source[0].timestamp; // first frame start time
      }

      saved.push({ slot: slot, timestamp: timestamp });
    }

    // newest to oldest, with unused (timestamp 0) being oldest
    saved.sort((s1, s2) => s2.timestamp - s1.timestamp);

    // save new game in the oldest slot
    save_game_slot = saved[saved.length - 1].slot;

    return saved;
  }

  let saved_games = read_saved_games();

  function load_game(slot) {
    let json = localStorage.getItem(save_game_name(slot));
    if (!json)
      return null;

    let source = JSON.parse(json);

    for (let s of source)
      undo_stack.push(new State(null, s));

    undo_index = undo_stack.length - 1;

    // save this in the same slot
    save_game_slot = slot;

    return undo_stack[undo_index];
  }

  function format_date(timestamp) {
    if (!timestamp)
      return '';

    let d = new Date();
    d.setTime(timestamp);
    return `${d.getFullYear()}-${pad(d.getMonth())}-${pad(d.getDate())}`;
  }

  function format_time(timestamp) {
    if (!timestamp)
      return '';

    let d = new Date();
    d.setTime(timestamp);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // frame time update
  let frame_time = '';

  function update_frame_time() {
    const diff = Date.now() - state.timestamp;

    frame_time = ms_to_string(diff);
    setTimeout(update_frame_time, 1000);
  }

  // ui main states
  const UiState = {
    UI_START: 0,
    UI_PLAY: 1,
    UI_MORE: 2,
    UI_EDIT: 3,
  };

  let ui_main_state = UiState.UI_START;

  function ui_shuffle_names() {
    ui_names = shuffle(ui_names);
  }

  function ui_load_game(slot) {
    state = load_game(slot);
    if (!state) {
      console.log(`slot ${slot} not found`);
      return;
    }

    save_names(ui_names);

    update_frame_time();

    ui_main_state = UiState.UI_PLAY;
  }

  function ui_start_name_valid(name) {
    if (!name)
      return false;

    let dupes = ui_names.filter((x) => x.name.toUpperCase() === name.toUpperCase());

    return dupes.length === 1;
  }

  $: ui_can_new_game = ui_names.filter((x) => !ui_start_name_valid(x.name)).length === 0;

  function ui_new_game() {
    if (!ui_can_new_game)
      return;

    state = new State(ui_names);

    // Don't autosave before first shot
    undo_stack_push(state, false);

    save_names(ui_names);

    update_frame_time();

    ui_main_state = UiState.UI_PLAY;
  }

  function ui_next_state() {
    ui_main_state++;
    if (ui_main_state > UiState.UI_EDIT)
      ui_main_state = UiState.UI_PLAY;
  }

  // ui actions, each need to handle undo
  function ui_pot_ball(value) {
    let s = state.deepcopy();
    s.pot_ball(value);
    state = undo_stack_push(s);
  }

  function ui_plus_balls() {
    let s = state.deepcopy();
    s.plus_balls();
    state = undo_stack_push(s);
  }

  function ui_minus_balls() {
    let s = state.deepcopy();
    s.minus_balls();
    state = undo_stack_push(s);
  }

  function ui_commit_foul(value) {
    let s = state.deepcopy();
    s.commit_foul(value);
    state = undo_stack_push(s);
  }

  function ui_click_player(player) {
    let s = state.deepcopy();

    // FIXME: don't duplicate the conditions here and in html
    if (state.is_current_player(player.pid) && state.can_end_turn())
      s.end_turn();
    else if (state.can_foul_retake() && state.is_previous_player(player.pid))
      s.foul_retake();
    else
      return;

    state = undo_stack_push(s);
  }

  function ui_click_player_more(player) {
    let s = state.deepcopy();

    // FIXME: don't duplicate the conditions here and in html
    if (state.can_concede(player.pid))
      s.concede(player.pid);
    else if (state.can_declare_winner(player.pid))
      s.declare_winner(player.pid);
    else
      return;

    state = undo_stack_push(s);
  }

  function ui_new_frame() {
    if (!state.can_new_frame())
      return;

    let s = state.deepcopy();
    s.new_frame();
    state = undo_stack_push(s);

    ui_main_state = UiState.UI_PLAY;
  }

  function ui_border_style(player) {
    if (state._is_frame_over()) {
      if (player.winner)
	return 'first-place';
      else if (player.loser)
	return 'third-place';
      else
	return 'second-place';
    }

    if (state.is_current_player(player.pid))
      return state.retake ? 'retake' : 'active';
    else if (player.winner || player.loser)
      return 'unavailable';
    else
      return '';
  }

  function ui_start_name_border_style(name) {
    return ui_start_name_valid(name) ? '' : 'retake'; // FIXME
  }
</script>

<main>
  {#if ui_main_state == UiState.UI_START }

    <div class='grid-container'>
      <div class='player' on:click={ui_shuffle_names}>
	<div>Enter names</div>
	<div></div>
	<div></div>
	<div></div>
	<div class='player-button active-button'>Shuffle</div>
      </div>
      {#each ui_names as player_name (player_name.id)}
	<div class='player {ui_start_name_border_style(player_name.name)}' animate:flip='{{ duration: (d) => d * 2 }}'>
	  <input class='name-input' size=9 minlength=1 maxlength=10 placeholder='enter name' bind:value='{player_name.name}'/>
	</div>
      {/each}

      <div class='player player-stat' on:click={ui_new_game}>
	<div>Piste</div>
	<div>on</div>
	<div>Piste</div>
	<div></div>
	<div></div>
	<div></div>
	{#if ui_can_new_game }
	  <div class='player-button active-button'>New game</div>
	{:else}
	  <div class='player-button'></div>
	{/if}
      </div>
      {#each saved_games as save_game, index (save_game.slot) }
	<div class='player player-stat' on:click={() => ui_load_game(save_game.slot)}>
	  <div>Game save {index}</div>
	  <div></div>
	  {#if save_game.timestamp }
	    <div>Started</div>
	    <div>{format_date(save_game.timestamp)}</div>
	    <div>{format_time(save_game.timestamp)}</div>
	    <div></div>
	    <div class='player-button active-button'>Load game</div>
	  {:else}
	    <div></div>
	    <div></div>
	    <div></div>
	    <div></div>
	    <div></div>
	  {/if}
	</div>
      {/each}

    </div>

  {:else if ui_main_state == UiState.UI_PLAY }
    <div class='grid-container'>
      <div class='player' on:click={ui_next_state}>
	<div>{frame_time}</div>
	<div>Frames ({state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {state.num_points()})</div>
	</div>
	<div>Break</div>
	<div class='player-button active-button'>&bull;&bull;&bull;</div>
      </div>
      {#each state.get_players() as player (player.pid)}
	<div class='player {ui_border_style(player)}' on:click={() => ui_click_player(player)} animate:flip='{{ duration: (d) => d * 2 }}'>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='player-points'>{player.points}</div>
	  {#if state.is_current_player(player.pid)}
	    <div>{player.cur_break}</div>
	  {:else}
	    <div>({player.last_break})</div>
	  {/if}
	  {#if state.is_current_player(player.pid) && state.can_end_turn() }
	    <div class='player-button active-button'>End Turn</div>
	  {:else if state.can_foul_retake() && state.is_previous_player(player.pid) }
	    <div class='player-button active-button'>Play Again</div>
	  {:else}
	    <div class='player-button'></div>
	  {/if}
	</div>
      {/each}
      <div class='button-bar'>
	<div class='label'>Pot</div>
	{#each [1,2,3,4,5,6,7] as value}
	  <Ball color={value_colors[value]}
		active={state.can_pot_ball(value)}
		action={() => ui_pot_ball(value)}>
	    {value}
	  </Ball>
	{/each}
      </div>

      <div class='button-bar'>
	<div class='label'>Undo</div>
	<Ball color=gray
	      active={ui_can_undo}
	      action={() => ui_undo()}>
	  &#x21b6;
	</Ball>
	<Ball color=gray
	      active={ui_can_redo}
	      action={() => ui_redo()}>
	  &#x21b7;
	</Ball>

	<div class='label'>Foul</div>
	{#each [4,5,6,7] as value}
	  <Ball color=gray
		active={state.can_commit_foul(value)}
		action={() => ui_commit_foul(value)}>
	    {value}
	  </Ball>
	{/each}
      </div>
    </div>
  {:else if ui_main_state == UiState.UI_MORE }
    <div class='grid-container'>
      <div class='player' on:click={ui_next_state}>
	<div>{frame_time}</div>
	<div>Frames ({state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {state.num_points()})</div>
	</div>
	<div>Break</div>
	<div class='player-button active-button'>Edit</div>
      </div>
      {#each state.get_players() as player (player.pid)}
	<div class='player {ui_border_style(player)}' on:click={() => ui_click_player_more(player)}>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='player-points'>{player.points}</div>
	  {#if state.is_current_player(player.pid)}
	    <div class='player-break'><Break balls={player._cur_break}></Break></div>
	  {:else}
	    <div class='player-break'><Break balls={player._last_break}></Break></div>
	  {/if}
	  {#if state.can_concede(player.pid) }
	    <div class='player-button active-button'>Concede</div>
	  {:else if state.can_declare_winner(player.pid) }
	    <div class='player-button active-button'>Set Winner</div>
	  {:else}
	    <div class='player-button'></div>
	  {/if}
	</div>
      {/each}

      <div class='player player-stat' on:click={ui_new_frame}>
	<div>Frame time</div>
	<div>Frame balls</div>
	<div>Frame high</div>
	<div>Game balls</div>
	<div>Game high</div>
	<div></div>
	{#if state.can_new_frame() }
	  <div class='player-button active-button'>New frame</div>
	{:else}
	  <div class='player-button'></div>
	{/if}
      </div>
      {#each state.get_players() as player (player.pid)}
      <div class='player player-stat'>
	<div>{ player.frame_time }</div>
	<div>{ player.frame_balls }</div>
	<div>{ player.frame_high_break }</div>
	<div>{ player.game_balls }</div>
	<div>{ player.game_high_break }</div>
      </div>
      {/each}
    </div>
  {:else}
    <div class='grid-container'>
      <div class='player' on:click={ui_next_state}>
	<div>{frame_time}</div>
	<div>Frames ({state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {state.num_points()})</div>
	</div>
	<div>Break</div>
	<div class='player-button active-button'>Continue</div>
      </div>
      {#each state.get_players() as player (player.pid)}
	<div class='player {ui_border_style(player)}'>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='player-points'>{player.points}</div>
	  {#if state.is_current_player(player.pid)}
	    <div>{player.cur_break}</div>
	  {:else}
	    <div>({player.last_break})</div>
	  {/if}
	  <div class='player-button'></div>
	</div>
      {/each}
      <div class='button-bar'>
	<div class='label'>Count</div>
	{#each [1,2,3,4,5,6,7] as value}
	  <Ball color={value_colors[value]}
		active={false}>
	    {state.num_balls(value)}
	  </Ball>
	{/each}
      </div>
      <div class='button-bar'>
	<div class='label'>Fix</div>
	<Ball color=gray
	      active={state.can_plus_balls()}
	      action={() => ui_plus_balls()}>
	  +
	</Ball>
	<Ball color=gray
	      active={state.can_minus_balls()}
	      action={() => ui_minus_balls()}>
	  -
	</Ball>
      </div>
    </div>

  {/if}
</main>

<style>
  :root {
    background: black;
    color: white;
    font-family: sans-serif;
    font-size: 200%;
    text-align: center;
    text-transform: uppercase;
  }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: auto auto auto;
    gap: 2vmin;
  }

  .grid-container > * {
    background-color: #155843;
    border-style: solid;
    border-color: transparent;
    border-radius: 2vmin;
    border-width: 0.5vmin;
  }

  .name-input {
    /* FIXME: the height is too much */
    background-color: inherit;
    border-radius: 2vmin;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    text-align: inherit;
    text-transform: inherit;
  }

  .player {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 3fr 1fr 1fr;
  }

  .player-stat {
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  }

  .player-points {
    font-size: 300%;
  }

  .player-break {
    overflow-x: hidden;
  }

  .player-button {
    color: black;
  }

  .active-button {
    border-radius: inherit;
    background-image: linear-gradient(30deg, gray, white);
  }

  .button-bar {
    grid-column: 1 / 5;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: 1fr;
    gap: 2vmin;
    align-items: center;
  }

  .button-bar > * {
    overflow-x: hidden;
  }

  .active {
    border-color: white;
  }

  .retake {
    border-color: red;
  }

  .unavailable {
    filter: brightness(50%);
    -webkit-filter: brightness(50%); /* https://caniuse.com/css-filters */
  }

  .first-place {
    border-color: gold;
  }

  .second-place {
    border-color: silver;
  }

  .third-place {
    border-color: #CD7F32;
  }
</style>
