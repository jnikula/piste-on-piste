<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<!-- SPDX-FileCopyrightText: 2022 Jani Nikula <jani@nikula.org> -->
<script lang='ts'>
  import { value_to_csscolor } from './ball-colors';
  interface Props {
    value: number;
    action?: any;
    active: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    value,
    action = () => {},
    active,
    children
  }: Props = $props();

  let brightness = $derived(active ? '100%' : '50%')

  function onclick(): void {
    if (active)
      action()
  }
</script>

<div class='ball' style='--csscolor: {value_to_csscolor(value)}; --brightness: {brightness};' {onclick}>
  {@render children?.()}
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
