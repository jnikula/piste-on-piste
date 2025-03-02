<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<!-- SPDX-FileCopyrightText: 2022 Jani Nikula <jani@nikula.org> -->
<script lang='ts'>
  import { value_to_csscolor } from './ball-colors.ts';

  interface Props {
    balls: number[];
  }

  let {
    balls,
  }: Props = $props();

  let ball_counts: number[] = $derived.by(() => {
    const c: number[] = [0,0,0,0,0,0,0,0];

    for (let i of balls) {
      if (i > 0)
	c[i]++;
    }

    return c;
  });

  let foul: number = $derived.by(() => {
    for (const i of balls)
      if (i < 0)
	return i;
    return 0;
  });

  let show_ball_counts: boolean = $derived(balls.length > 8);
</script>

{#if show_ball_counts}
  {#each ball_counts as count, value}
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
{#if foul}
  <span class='ball value' style='--csscolor: {value_to_csscolor(foul)};'>F</span>
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
