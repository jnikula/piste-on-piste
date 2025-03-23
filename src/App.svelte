<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<!-- SPDX-FileCopyrightText: 2022 Jani Nikula <jani@nikula.org> -->
<script lang='ts'>
  import { stopPropagation } from 'svelte/legacy';

  import { flip } from 'svelte/animate';
  import { Fullscreen } from './lib/Fullscreen.ts';
  import * as timeutil from './lib/time-util.ts';
  import Ball from './lib/Ball.svelte';
  import Break from './lib/Break.svelte';
  import { game } from './lib/Game.ts';
  import { names } from './lib/Names.svelte';
  import type Player from './lib/Player.ts';
  import type { SaveGameId } from './lib/Game.ts';

  let fullscreen: Fullscreen = new Fullscreen(document.documentElement);

  function ui_toggle_fullscreen() {
    fullscreen.toggle();
  }

  // Hack to "live update" generic stuff once per second
  let __counter = $state(0);
  setInterval(() => __counter++, 1000)

  let live_update = $derived(function(thing: string): string {
    // Do something with __counter to react to changes
    let dummy = __counter;
    dummy = dummy
    return thing;
  })

  // ui pages
  const UiPage = {
    START: 0,
    PLAY: 1,
    MORE: 2,
    EDIT: 3,
  };

  let ui_page = $state(UiPage.START);

  function ui_load_game(save_game: SaveGameId): void {
    if (!save_game.timestamp)
      return;

    // Note: Fullscreen can only be entered via user interaction
    fullscreen.load();

    game.load(save_game.slot);

    names.save();

    ui_page = UiPage.PLAY;
  }

  function ui_new_game(): void {
    if (!names.can_new_game())
      return;

    // Note: Fullscreen can only be entered via user interaction
    fullscreen.load();

    game.new_game(names.names);

    names.save();

    ui_page = UiPage.PLAY;
  }

  function ui_previous_page(): void {
    ui_page--;
    if (ui_page < UiPage.PLAY)
      ui_page = UiPage.EDIT;
  }

  function ui_next_page(): void {
    ui_page++;
    if (ui_page > UiPage.EDIT)
      ui_page = UiPage.PLAY;
  }

  // ui actions, each need to handle undo
  function ui_click_player(player: Player): void {
    // FIXME: don't duplicate the conditions here and in html
    if ($game.state.is_current_player(player.pid) && $game.state.can_end_turn())
      game.end_turn();
    else if ($game.state.can_foul_retake() && $game.state.is_previous_player(player.pid))
      game.foul_retake();
  }

  function ui_click_player_more(player: Player): void {
    // FIXME: don't duplicate the conditions here and in html
    if ($game.state.can_concede(player.pid))
      game.concede(player.pid);
    else if ($game.state.can_declare_winner(player.pid))
      game.declare_winner(player.pid);
  }

  function ui_player_edit_points(pid: number, amount: number): void {
    if ($game.state.can_player_edit_points(pid, amount))
      game.edit_points(pid, amount);
  }

  function ui_new_frame(): void {
    if (!$game.state.can_new_frame())
      return;

    game.new_frame();

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
    return names.valid_name(name) ? '' : 'retake'; // FIXME
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

  function ui_key_down(event: KeyboardEvent) {
    if (event.repeat)
      return;

    let modifier: string = ui_key_modifier_get();

    console.log(`key "${event.key}"`);

    if (ui_page == UiPage.START)
      return;

    switch (event.key) {
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
      let value: number = parseInt(event.key);

      if (value >= 1 && value <= 7) {
	if (modifier == 'f') {
	  if (value >= 4) {
	    if ($game.state.can_commit_foul(value))
	      game.commit_foul(value);
	  }
	} else {
	  if ($game.state.can_pot_ball(value))
	    game.pot_ball(value);
	}
      }
      break;
    case ' ':
      if ($game.state.can_end_turn())
	game.end_turn();
      break;
    case 'z':
      if ($game.can_undo)
	game.undo();
      break;
    case 'y':
      if ($game.can_redo)
	game.redo();
      break;
    case 'f':
      ui_key_modifier_set(event.key);
      break;
    case '+':
      if ($game.state.can_plus_balls())
	game.plus_balls();
      break;
    case '-':
      if ($game.state.can_minus_balls())
	game.minus_balls();
      break;
    case 'n':
      if ($game.state.can_new_frame())
	game.new_frame();
      break;
    case 'ArrowLeft':
      ui_previous_page();
      break;
    case 'ArrowRight':
      ui_next_page();
      break;
    }
  }

</script>

<svelte:window onkeydown={ui_key_down} />

<main>
  {#if ui_page == UiPage.START}

    <div class='grid-container'>
      <div class='name-input-card' onclick={() => names.shuffle()}>
	<div>Enter names</div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div class='card-button'>Shuffle</div>
      </div>
      {#each names.names as player_name (player_name.id)}
	<div class='name-input-card {ui_name_input_card_style(player_name.name)}' animate:flip='{{ duration: (d) => d * 2 }}'>
	  <input class='name-input' size=9 minlength=1 maxlength=10 placeholder='enter name' bind:value='{player_name.name}'/>
	</div>
      {/each}

      <div class='info-card {names.can_new_game() ? "" : "unavailable"}' onclick={ui_new_game}>
	<div class='info-card-copyright' onclick={stopPropagation(() => false)}><a href="https://jnikula.github.io/piste-on-piste/">&copy; 2022-2024 Jani Nikula<br>License: AGPL 3.0 or later &#x1f517;</a></div>
	<div></div>
	<div>Piste</div>
	<div>on</div>
	<div>Piste</div>
	<div></div>
	<div class='card-button'>New game</div>
      </div>
      {#each $game.saved_games as save_game, index (save_game.slot) }
	<div class='info-card {save_game.timestamp ? "" : "unavailable"}' onclick={() => ui_load_game(save_game)}>
	  <div>Game save {index}</div>
	  <div></div>
	  {#if save_game.timestamp}
	    <div>Started</div>
	    <div>{timeutil.format_date(save_game.timestamp)}</div>
	    <div>{timeutil.format_time(save_game.timestamp)}</div>
	  {:else}
	    <div></div>
	    <div></div>
	    <div></div>
	  {/if}
	  <div></div>
	  <div class='card-button'>Load game</div>
	</div>
      {/each}

    </div>

  {:else if ui_page == UiPage.PLAY}
    <div class='grid-container'>
      <div class='score-card' onclick={ui_next_page}>
	<div>{ live_update($game.state.get_frame_time()) }</div>
	<div>Frames ({$game.state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {$game.state.num_points()})</div>
	</div>
	<div>Break</div>
	<div></div>
	<div class='card-button'>&bull;&bull;&bull;</div>
      </div>
      {#each $game.state.get_players() as player (player.pid)}
	<div class='score-card {ui_score_card_player_style(player)}' onclick={() => ui_click_player(player)} animate:flip='{{ duration: (d) => d * 2 }}'>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='score-card-points'>{player.points}</div>
	  {#if $game.state.is_current_player(player.pid)}
	    <div>{player.cur_break}</div>
	    <div class='score-card-break'><Break balls={player._cur_break}></Break></div>
	  {:else}
	    <div>({player.last_break})</div>
	    <div class='score-card-break unavailable'><Break balls={player._last_break}></Break></div>
	  {/if}
	  {#if $game.state.is_current_player(player.pid) && $game.state.can_end_turn()}
	    <div class='card-button'>End Turn</div>
	  {:else if $game.state.can_foul_retake() && $game.state.is_previous_player(player.pid)}
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
		action={() => game.pot_ball(value)}>
	    {value}
	    {#if value === 7 && $game.state.respot_black}
	      <div class='respot'>re-spot!</div>
	    {/if}
	  </Ball>
	{/each}
      </div>

      <div class='button-bar'>
	<div class='label'>Undo</div>
	<Ball value={0}
	      active={$game.can_undo}
	      action={() => game.undo()}>
	  &#x21b6;
	</Ball>
	<Ball value={0}
	      active={$game.can_redo}
	      action={() => game.redo()}>
	  &#x21b7;
	</Ball>

	<div class='label'>Foul</div>
	{#each [4,5,6,7] as value}
	  <Ball value={0}
		active={$game.state.can_commit_foul(value)}
		action={() => game.commit_foul(value)}>
	    {value}
	  </Ball>
	{/each}
      </div>
    </div>
  {:else if ui_page == UiPage.MORE}
    <div class='grid-container'>
      <div class='score-card' onclick={ui_next_page}>
	<div>{ live_update($game.state.get_frame_time()) }</div>
	<div>Frames ({$game.state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {$game.state.num_points()})</div>
	</div>
	<div>Break</div>
	<div></div>
	<div class='card-button'>Edit</div>
      </div>
      {#each $game.state.get_players() as player (player.pid)}
	<div class='score-card {ui_score_card_player_style(player)}' onclick={() => ui_click_player_more(player)}>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='score-card-points'>{player.points}</div>
	  {#if $game.state.is_current_player(player.pid)}
	    <div>{player.cur_break}</div>
	    <div class='score-card-break'><Break balls={player._cur_break}></Break></div>
	  {:else}
	    <div>({player.last_break})</div>
	    <div class='score-card-break unavailable'><Break balls={player._last_break}></Break></div>
	  {/if}
	  {#if $game.state.can_concede(player.pid)}
	    <div class='card-button'>Concede</div>
	  {:else if $game.state.can_declare_winner(player.pid)}
	    <div class='card-button'>Set Winner</div>
	  {:else}
	    <div></div>
	  {/if}
	</div>
      {/each}

      <div class='info-card' onclick={ui_new_frame}>
	<div>Frame shot time</div>
	<div>Frame balls</div>
	<div>Frame high</div>
	<div>Time since last pot</div>
	<div>Game balls</div>
	<div>Game high</div>
	{#if $game.state.can_new_frame()}
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
      <div class='score-card' onclick={ui_next_page}>
	<div>{ live_update($game.state.get_frame_time()) }</div>
	<div>Frames ({$game.state.num_frames})</div>
	<div>
	  Points
	  <div>(Remaining {$game.state.num_points()})</div>
	</div>
	<div>Break</div>
	<div></div>
	<div class='card-button'>Continue</div>
      </div>
      {#each $game.state.get_players() as player (player.pid)}
	<div class='score-card {ui_score_card_player_style(player)}'>
	  <div>{player.name}</div>
	  <div>{player.frame_1st} - {player.frame_2nd} - {player.frame_3rd}</div>
	  <div class='score-card-points'>{player.points}</div>
	  {#if $game.state.is_current_player(player.pid)}
	    <div>{player.cur_break}</div>
	    <div class='score-card-break'><Break balls={player._cur_break}></Break></div>
	  {:else}
	    <div>({player.last_break})</div>
	    <div class='score-card-break unavailable'><Break balls={player._last_break}></Break></div>
	  {/if}
	  <div class='double-button'>
	    <div class='card-button' onclick={() => ui_player_edit_points(player.pid, -1)}>-</div>
	    <div class='card-button' onclick={() => ui_player_edit_points(player.pid, 1)}>+</div>
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
	      action={() => game.minus_balls()}>
	  -
	</Ball>
	<Ball value={0}
	      active={$game.state.can_plus_balls()}
	      action={() => game.plus_balls()}>
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
    grid-template-rows: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
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
    grid-template-rows: 1fr 1fr 3fr 1fr 1fr 1fr;
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
