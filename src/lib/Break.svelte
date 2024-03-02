<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (c) 2022 Jani Nikula <jani@nikula.org> -->
<script lang='ts'>
  export let balls: number[];
  import { value_to_csscolor } from './ball-colors';

  let counts: number[];
  let err: number;

  $: ball_counts = balls.length > 8;

  $: {
    counts = [0,0,0,0,0,0,0,0];
    err = 0;

    for (let i of balls) {
      if (i > 0)
	counts[i]++;
      else
	err = i;
    }
  }
</script>

{#if ball_counts}
  {#each counts as count, value}
    {#if count > 0}
      <span class='ball value' style='--csscolor: {value_to_csscolor(value)};'>{count}</span>
    {/if}
  {/each}
{:else}
  {#each balls as value}
    {#if value > 0}
      <span class='ball plain' style='--csscolor: {value_to_csscolor(value)};'>.</span>
    {/if}
  {/each}
{/if}
{#if err < 0}
  <span class='ball value' style='--csscolor: {value_to_csscolor(err)};'>F</span>
{/if}

<style>
  .ball {
    background-image: radial-gradient(circle at 66% 25%, white, var(--csscolor), black);
    border-radius: 50%;
    text-align: center;
    display: inline-block;
    color: transparent; /* hide the contents */
    line-height: 1.0em;
    width: 1.0em;
    margin: 0.1em;
  }
  .value {
    text-shadow: 1px 1px black;
    color: white;
  }
</style>
