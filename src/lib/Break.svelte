<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (c) 2022 Jani Nikula <jani@nikula.org> -->
<script lang='ts'>
  export let balls: number[];
  import { value_to_csscolor } from './ball-colors';

  let counts: number[];
  let err: number;

  $: ball_counts = balls.length > 10;

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

  function count_to_char(count: number): string {
    // 1-10 Dingbats, 0, 11-15 Enclosed Alphanumerics *may* have different
    // sizes...
    let count_chars: string[] = [
      '⓿', '❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿',
      '⓫', '⓬', '⓭', '⓮', '⓯'
    ];

    return count_chars[count];
  }
</script>

{#if ball_counts}
  {#each counts as count, value}
    {#if count > 0}
      <span class='ball' style='--csscolor: {value_to_csscolor(value)};'>{count_to_char(count)}</span>
    {/if}
  {/each}
  {#if err < 0}
    -<span class='ball' style='--csscolor: {value_to_csscolor(err)};'>{count_to_char(1)}</span>
  {/if}
{:else}
  {#each balls as value}
    {value < 0 ? '-' : ''}<span class='ball' style='--csscolor: {value_to_csscolor(value)};'>&#x2B24;</span>
  {/each}
{/if}

<style>
  .ball {
    background-image: radial-gradient(circle at 66% 25%, white, var(--csscolor), black);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-size: 80%;
  }
</style>
