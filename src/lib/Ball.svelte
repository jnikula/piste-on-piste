<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<!-- SPDX-FileCopyrightText: 2022 Jani Nikula <jani@nikula.org> -->
<script lang='ts'>
  import type { Snippet } from 'svelte';
  import { value_to_csscolor } from './ball-colors.ts';

  interface Props {
    title?: string;
    value: number;
    active: boolean;
    action?: any;
    children?: Snippet;
  }

  let {
    title = '',
    value,
    active,
    action = () => {},
    children,
  }: Props = $props();

  let brightness: string = $derived(active ? '100%' : '50%')

  function onclick(): void {
    if (active)
      action()
  }
</script>

<div title='{title}' class='ball' style='--csscolor: {value_to_csscolor(value)}; --brightness: {brightness};' {onclick}>
  <div class='value'>{@render children?.()}</div>
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
  .value {
    text-shadow: 2px 2px 6px black;
    color: white;
    text-align: center;
    font-size: 175%;
  }
</style>
