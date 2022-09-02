<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (c) 2022 Jani Nikula <jani@nikula.org> -->
<script lang='ts'>
  export let balls: number[];
  import { value_to_csscolor } from './ball-colors';
</script>

{#each balls as value}
  {value < 0 ? '-' : ''}<span class='ball' style='--csscolor: {value_to_csscolor(value)};'>&#x2B24;</span>
{/each}

<style>
  .ball {
    background-image: radial-gradient(circle at 66% 25%, white, var(--csscolor), black);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-size: 80%;
  }
</style>
