<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (c) 2022 Jani Nikula <jani@nikula.org> -->
<script lang='ts'>
  import { flip } from 'svelte/animate';
  import * as fullscreen from './lib/fullscreen';
  import * as timeutil from './lib/time-util';
  import Ball from './lib/Ball.svelte';
  import Break from './lib/Break.svelte';
  import { game } from './lib/Game';
  import State from './lib/State';
  import type Player from './lib/Player';

  function ui_toggle_fullscreen() {
    if (fullscreen.is_fullscreen())
      fullscreen.exit_fullscreen();
    else
      fullscreen.request_fullscreen(document.documentElement);
  }

  // stored names for new games

  function shuffle(array: any[]): any[] {
    let result: any[] = [];

    while (array.length) {
      let index: number = Math.floor(Math.random() * array.length);

      result.push(array[index]);
      array.splice(index, 1);
    }

    return result;
  }

  type SavedName = {
    id: number;
    name: string;
  };

  // save names to local storage
  function save_names(names: SavedName[]) {
    localStorage.setItem('piste-on-piste-names', JSON.stringify(names));
  }

  // load names from local storage
  function load_names(): SavedName[] {
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

  function setup_names(): SavedName[] {
    let names = load_names();

    if (names)
      return shuffle(names);

    names = [];
    for (let i of [1,2,3])
      names.push({ id: i, name: `Player ${i}`});

    return names;
  }

  let ui_names: SavedName[] = setup_names();

  function save_game_name(slot: number): string {
    return `piste-on-piste-save-${slot}`;
  }

  function save_game(): void {
    localStorage.setItem(save_game_name($game.save_game_slot), JSON.stringify($game.undo_stack));
  }

  function undo_stack_push(s: State, autosave: boolean = true): State {
    $game.undo_stack.splice(++$game.undo_index, $game.undo_stack.length, s);

    if (autosave)
      save_game();

    return s;
  }

  $: ui_can_undo = $game.undo_index > 0;
  $: ui_can_redo = $game.undo_index + 1 < $game.undo_stack.length;

  function ui_undo(): void {
    console.assert(ui_can_undo);

    $game.state = $game.undo_stack[--$game.undo_index];
  }

  function ui_redo(): void {
    console.assert(ui_can_redo);

    $game.state = $game.undo_stack[++$game.undo_index];
  }

  type SaveGameId = {
    slot: number;
    timestamp: number;
  };

  function read_saved_games(): SaveGameId[] {
    let saved: SaveGameId[] = [];

    for (let slot of [0,1,2]) {
      let timestamp: number = 0;
      let json: string = localStorage.getItem(save_game_name(slot));

      if (json) {
	let source = JSON.parse(json);
	timestamp = source[0].timestamp; // first frame start time
      }

      saved.push({ slot: slot, timestamp: timestamp });
    }

    // newest to oldest, with unused (timestamp 0) being oldest
    saved.sort((s1: SaveGameId, s2: SaveGameId) => s2.timestamp - s1.timestamp);

    // save new game in the oldest slot
    $game.save_game_slot = saved[saved.length - 1].slot;

    return saved;
  }

  let saved_games: SaveGameId[] = read_saved_games();

  function load_game(slot: number): State {
    let json: string = localStorage.getItem(save_game_name(slot));
    if (!json)
      return null;

    let source = JSON.parse(json);

    for (let s of source)
      $game.undo_stack.push(new State(null, s));

    $game.undo_index = $game.undo_stack.length - 1;

    // save this in the same slot
    $game.save_game_slot = slot;

    return $game.undo_stack[$game.undo_index];
  }

  // Hack to "live update" generic stuff once per second
  let __counter = 0;
  setInterval(() => __counter++, 1000)

  $: live_update = function(thing: string): string {
    // Do something with __counter to react to changes
    let dummy = __counter;
    dummy = dummy
    return thing;
  }

  // ui pages
  const UiPage = {
    START: 0,
    PLAY: 1,
    MORE: 2,
    EDIT: 3,
  };

  let ui_page = UiPage.START;

  function ui_shuffle_names(): void {
    ui_names = shuffle(ui_names);
  }

  function ui_load_game(slot: number): void {
    $game.state = load_game(slot);
    if (!$game.state) {
      console.log(`slot ${slot} not found`);
      return;
    }

    save_names(ui_names);

    ui_page = UiPage.PLAY;
  }

  function ui_start_name_valid(name: string): boolean {
    if (!name)
      return false;

    let dupes = ui_names.filter((x) => x.name.toUpperCase() === name.toUpperCase());

    return dupes.length === 1;
  }

  $: ui_can_new_game = ui_names.filter((x) => !ui_start_name_valid(x.name)).length === 0;

  function ui_new_game(): void {
    if (!ui_can_new_game)
      return;

    $game.state = new State(ui_names);

    // Don't autosave before first shot
    undo_stack_push($game.state, false);

    save_names(ui_names);

    ui_page = UiPage.PLAY;
  }

  function ui_next_page(): void {
    ui_page++;
    if (ui_page > UiPage.EDIT)
      ui_page = UiPage.PLAY;
  }

  // ui actions, each need to handle undo
  function ui_pot_ball(value: number): void {
    let s: State = $game.state.deepcopy();
    s.pot_ball(value);
    $game.state = undo_stack_push(s);
  }

  function ui_plus_balls(): void {
    let s: State = $game.state.deepcopy();
    s.plus_balls();
    $game.state = undo_stack_push(s);
  }

  function ui_minus_balls(): void {
    let s: State = $game.state.deepcopy();
    s.minus_balls();
    $game.state = undo_stack_push(s);
  }

  function ui_commit_foul(value: number): void {
    let s: State = $game.state.deepcopy();
    s.commit_foul(value);
    $game.state = undo_stack_push(s);
  }

  function ui_click_player(player: Player): void {
    let s: State = $game.state.deepcopy();

    // FIXME: don't duplicate the conditions here and in html
    if ($game.state.is_current_player(player.pid) && $game.state.can_end_turn())
      s.end_turn();
    else if ($game.state.can_foul_retake() && $game.state.is_previous_player(player.pid))
      s.foul_retake();
    else
      return;

    $game.state = undo_stack_push(s);
  }

  function ui_click_player_more(player: Player): void {
    let s: State = $game.state.deepcopy();

    // FIXME: don't duplicate the conditions here and in html
    if ($game.state.can_concede(player.pid))
      s.concede(player.pid);
    else if ($game.state.can_declare_winner(player.pid))
      s.declare_winner(player.pid);
    else
      return;

    $game.state = undo_stack_push(s);
  }

  function ui_player_edit_points(pid: number, amount: number): void {
    let s: State = $game.state.deepcopy();

    if ($game.state.can_player_edit_points(pid, amount))
      s.player_edit_points(pid, amount);
    else
      return;

    $game.state = undo_stack_push(s);
  }

  function ui_new_frame(): void {
    if (!$game.state.can_new_frame())
      return;

    let s: State = $game.state.deepcopy();
    s.new_frame();
    $game.state = undo_stack_push(s);

    ui_page = UiPage.PLAY;
  }

  function ui_score_card_player_style(player: Player): string {
    if ($game.state._is_frame_over()) {
      if (player.winner)
	return 'first-place';
      else if (player.loser)
	return 'third-place';
      else
	return 'second-place';
    }

    if ($game.state.is_current_player(player.pid))
      return $game.state.retake ? 'retake' : 'active';
    else if (player.winner || player.loser)
      return 'unavailable';
    else
      return '';
  }

  function ui_name_input_card_style(name: string): string {
    return ui_start_name_valid(name) ? '' : 'retake'; // FIXME
  }

  // UI key events

  let ui_key_modifier: string = null;
  let ui_key_modifier_timestamp: number = 0;

  function ui_key_modifier_set(value: string): void {
    ui_key_modifier = value;
    ui_key_modifier_timestamp = Date.now();
  }

  function ui_key_modifier_get(): string {
    let age_ms: number = Date.now() - ui_key_modifier_timestamp;
    let value: string = age_ms < 1000 * 5 ? ui_key_modifier : null;

    ui_key_modifier = null;
    ui_key_modifier_timestamp = 0;

    return value;
  }

  function ui_key_end_turn(): void {
    let s: State = $game.state.deepcopy();

    if ($game.state.can_end_turn())
      s.end_turn();

    $game.state = undo_stack_push(s)
  }

  function ui_key_pot_ball(value: number): void {
    if ($game.state.can_pot_ball(value))
      ui_pot_ball(value);
  }

  function ui_key_commit_foul(value: number): void {
    if ($game.state.can_commit_foul(value))
      ui_commit_foul(value);
  }

  function ui_key_undo(): void {
    if (ui_can_undo)
      ui_undo();
  }

  function ui_key_redo(): void {
    if (ui_can_redo)
      ui_redo();
  }

  function ui_key_plus_balls(): void {
    if ($game.state.can_plus_balls())
      ui_plus_balls();
  }

  function ui_key_minus_balls(): void {
    if ($game.state.can_minus_balls())
      ui_minus_balls();
  }

  function ui_key_down(event: KeyboardEvent) {
    if (event.repeat)
      return;

    let modifier: string = ui_key_modifier_get();

    console.log(`key "${event.key}"`);

    if (ui_page == UiPage.START)
      return;

    if (event.key == 'ArrowRight') {
      ui_next_page();
      return;
    }

    if (ui_page == UiPage.PLAY) {
      let value: number = parseInt(event.key);

      if (value >= 1 && value <= 7) {
	if (modifier == 'f') {
	  if (value >= 4)
	    ui_key_commit_foul(value);
	} else {
	  ui_key_pot_ball(value);
	}
      } else if (event.key == ' ') {
	ui_key_end_turn();
      } else if (event.key == 'z') {
	ui_key_undo();
      } else if (event.key == 'y') {
	ui_key_redo();
      } else if (event.key == 'f') {
	ui_key_modifier_set(event.key);
      }
    } else if (ui_page == UiPage.MORE) {
    } else if (ui_page == UiPage.EDIT) {
      if (event.key == '+') {
	ui_key_plus_balls();
      } else if (event.key == '-') {
	ui_key_minus_balls();
      }
    }
  }

</script>

<svelte:window on:keydown={ui_key_down} />

<main>
  {#if ui_page == UiPage.START }

    <div class='grid-container'>
      <div class='name-input-card' on:click={ui_shuffle_names}>
	<div>Enter names</div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div class='card-button'>Shuffle</div>
      </div>
      {#each ui_names as player_name (player_name.id)}
	<div class='name-input-card {ui_name_input_card_style(player_name.name)}' animate:flip='{{ duration: (d) => d * 2 }}'>
	  <input class='name-input' size=9 minlength=1 maxlength=10 placeholder='enter name' bind:value='{player_name.name}'/>
	</div>
      {/each}

      <div class='info-card' on:click={ui_new_game}>
	<div class='info-card-copyright' on:click|stopPropagation={() => false}><a href="https://jnikula.github.io/piste-on-piste/">&copy; 2022-2024 Jani Nikula<br>License: GPL 3.0 or later &#x1f517;</a></div>
	<div></div>
	<div>Piste</div>
	<div>on</div>
	<div>Piste</div>
	<div></div>
	{#if ui_can_new_game }
	  <div class='card-button'>New game</div>
	{:else}
	  <div></div>
	{/if}
      </div>
      {#each saved_games as save_game, index (save_game.slot) }
	<div class='info-card' on:click={() => ui_load_game(save_game.slot)}>
	  <div>Game save {index}</div>
	  <div></div>
	  {#if save_game.timestamp }
	    <div>Started</div>
	    <div>{timeutil.format_date(save_game.timestamp)}</div>
	    <div>{timeutil.format_time(save_game.timestamp)}</div>
	    <div></div>
	    <div class='card-button'>Load game</div>
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

  {:else if ui_page == UiPage.PLAY }
    <div class='grid-container'>
      <div class='score-card' on:click={ui_next_page}>
	<div>{ live_update($game.state.get_frame_time()) }</div>
	<div>Frames ({$game.state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {$game.state.num_points()})</div>
	</div>
	<div>Break</div>
	<div class='card-button'>&bull;&bull;&bull;</div>
      </div>
      {#each $game.state.get_players() as player (player.pid)}
	<div class='score-card {ui_score_card_player_style(player)}' on:click={() => ui_click_player(player)} animate:flip='{{ duration: (d) => d * 2 }}'>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='score-card-points'>{player.points}</div>
	  {#if $game.state.is_current_player(player.pid)}
	    <div>{player.cur_break}</div>
	  {:else}
	    <div>({player.last_break})</div>
	  {/if}
	  {#if $game.state.is_current_player(player.pid) && $game.state.can_end_turn() }
	    <div class='card-button'>End Turn</div>
	  {:else if $game.state.can_foul_retake() && $game.state.is_previous_player(player.pid) }
	    <div class='card-button'>Play Again</div>
	  {:else}
	    <div></div>
	  {/if}
	</div>
      {/each}
      <div class='button-bar'>
	<div class='label'>Pot</div>
	{#each [1,2,3,4,5,6,7] as value}
	  <Ball value={value}
		active={$game.state.can_pot_ball(value)}
		action={() => ui_pot_ball(value)}>
	    {value}
	    {#if value === 7 && $game.state.respot_black }
	      <div class='respot'>re-spot!</div>
	    {/if}
	  </Ball>
	{/each}
      </div>

      <div class='button-bar'>
	<div class='label'>Undo</div>
	<Ball value={0}
	      active={ui_can_undo}
	      action={() => ui_undo()}>
	  &#x21b6;
	</Ball>
	<Ball value={0}
	      active={ui_can_redo}
	      action={() => ui_redo()}>
	  &#x21b7;
	</Ball>

	<div class='label'>Foul</div>
	{#each [4,5,6,7] as value}
	  <Ball value={0}
		active={$game.state.can_commit_foul(value)}
		action={() => ui_commit_foul(value)}>
	    {value}
	  </Ball>
	{/each}
      </div>
    </div>
  {:else if ui_page == UiPage.MORE }
    <div class='grid-container'>
      <div class='score-card' on:click={ui_next_page}>
	<div>{ live_update($game.state.get_frame_time()) }</div>
	<div>Frames ({$game.state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {$game.state.num_points()})</div>
	</div>
	<div>Break</div>
	<div class='card-button'>Edit</div>
      </div>
      {#each $game.state.get_players() as player (player.pid)}
	<div class='score-card {ui_score_card_player_style(player)}' on:click={() => ui_click_player_more(player)}>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='score-card-points'>{player.points}</div>
	  {#if $game.state.is_current_player(player.pid)}
	    <div class='score-card-break'><Break balls={player._cur_break}></Break></div>
	  {:else}
	    <div class='score-card-break'><Break balls={player._last_break}></Break></div>
	  {/if}
	  {#if $game.state.can_concede(player.pid) }
	    <div class='card-button'>Concede</div>
	  {:else if $game.state.can_declare_winner(player.pid) }
	    <div class='card-button'>Set Winner</div>
	  {:else}
	    <div></div>
	  {/if}
	</div>
      {/each}

      <div class='info-card' on:click={ui_new_frame}>
	<div>Frame shot time</div>
	<div>Frame balls</div>
	<div>Frame high</div>
	<div>Time since last pot</div>
	<div>Game balls</div>
	<div>Game high</div>
	{#if $game.state.can_new_frame() }
	  <div class='card-button'>New frame</div>
	{:else}
	  <div></div>
	{/if}
      </div>
      {#each $game.state.get_players() as player (player.pid)}
      <div class='info-card'>
	<div>{ player.frame_shot_time }</div>
	<div>{ player.frame_balls }</div>
	<div>{ player.frame_high_break }</div>
	<div>{ live_update(player.time_since_last_pot) }</div>
	<div>{ player.game_balls }</div>
	<div>{ player.game_high_break }</div>
      </div>
      {/each}
    </div>
  {:else}
    <div class='grid-container'>
      <div class='score-card' on:click={ui_next_page}>
	<div>{ live_update($game.state.get_frame_time()) }</div>
	<div>Frames ({$game.state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {$game.state.num_points()})</div>
	</div>
	<div>Break</div>
	<div class='card-button'>Continue</div>
      </div>
      {#each $game.state.get_players() as player (player.pid)}
	<div class='score-card {ui_score_card_player_style(player)}'>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='score-card-points'>{player.points}</div>
	  {#if $game.state.is_current_player(player.pid)}
	    <div>{player.cur_break}</div>
	  {:else}
	    <div>({player.last_break})</div>
	  {/if}
	  <div class='double-button'>
	    <div class='card-button' on:click={() => ui_player_edit_points(player.pid, -1)}>-</div>
	    <div class='card-button' on:click={() => ui_player_edit_points(player.pid, 1)}>+</div>
	  </div>
	</div>
      {/each}
      <div class='button-bar'>
	<div class='label'>Count</div>
	{#each [1,2,3,4,5,6,7] as value}
	  <Ball value={value}
		active={false}>
	    {$game.state.num_balls(value)}
	  </Ball>
	{/each}
      </div>
      <div class='button-bar'>
	<div class='label'>Fix</div>
	<Ball value={0}
	      active={$game.state.can_minus_balls()}
	      action={() => ui_minus_balls()}>
	  -
	</Ball>
	<Ball value={0}
	      active={$game.state.can_plus_balls()}
	      action={() => ui_plus_balls()}>
	  +
	</Ball>
	<div class='label'></div>
	<div class='label'></div>
	<div class='label'></div>
	<div class='label'>&#x26F6;</div>
	<Ball value={0}
	      active={true}
	      action={() => ui_toggle_fullscreen()}>
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
    /* https://css-tricks.com/fitting-text-to-a-container */
    font-size: 2vw;
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

  .name-input-card {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 1fr 1fr 1fr 1fr 1fr;
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

  .score-card {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 3fr 1fr 1fr;
  }

  .double-button {
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 100%;
    border-radius: inherit;
  }

  .info-card {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  }

  .info-card-copyright {
    font-size: 40%;
  }

  a {
    color: inherit;
    text-decoration: inherit;
  }

  .score-card-points {
    font-size: 300%;
    font-weight: bold;
  }

  .score-card-break {
    overflow-x: hidden;
  }

  .card-button {
    background-image: linear-gradient(30deg, gray, white);
    border-radius: inherit;
    color: black;
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

  .respot {
    background-image: linear-gradient(30deg, gray, white);
    border-style: solid;
    border-color: red;
    border-radius: 2vmin;
    border-width: 0.5vmin;
    align-items: center;
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
