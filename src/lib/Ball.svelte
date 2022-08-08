<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<!-- Copyright (c) 2022 Jani Nikula <jani@nikula.org> -->
<script>
  export let color;
  export let action = () => {};
  export let active;

  const csscolors = {
    'red': 'red',
    'yellow': 'gold',
    'green': 'green',
    'brown': 'saddlebrown',
    'blue': 'blue',
    'pink': 'hotpink',
    'black': 'black',
    'gray': 'dimgray'
  };

  let csscolor = csscolors[color];

  $: brightness = active ? '100%' : '50%'

  function onclick() {
    if (active)
      action()
  }
</script>

<div class='ball' style='--csscolor: {csscolor}; --brightness: {brightness};' on:click={onclick}>
  <slot></slot>
</div>

<style>
  .ball {
    aspect-ratio: 1;
    border-radius: 50%;

    color: black;

    background-image: radial-gradient(circle at 66% 25%, white, var(--csscolor), black);

    filter: brightness(var(--brightness));
    -webkit-filter: brightness(var(--brightness)); /* https://caniuse.com/css-filters */
  }
</style>
