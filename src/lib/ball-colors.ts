// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2022 Jani Nikula <jani@nikula.org>

type colormap = {
  [key: number]: string
};

const csscolors: colormap = {
  0: 'dimgray',
  1: 'red',
  2: 'gold',
  3: 'green',
  4: 'saddlebrown',
  5: 'blue',
  6: 'hotpink',
  7: 'black',
};

export function value_to_csscolor(value: number): string {
  return csscolors[Math.abs(value)];
}
