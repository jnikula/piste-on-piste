// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2024 Jani Nikula <jani@nikula.org>

import { writable } from 'svelte/store';

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
  enabled: boolean;
};

class Names {
  names: SavedName[];

  constructor() {
    let names: SavedName[] = this._load();

    if (names) {
      this.names = names;
      this._shuffle();
    } else {
      names = [];
      for (let i of [1,2,3])
	names.push({ id: i, name: `Player ${i}`, enabled: true });

      this.names = names;
    }
  }

  _sort(): void {
    this.names.sort((sn1: SavedName, sn2: SavedName) => Number(sn2.enabled) - Number(sn1.enabled));
  }

  _shuffle(): void {
    this.names = shuffle(this.names);
    this._sort();
  }

  // load names from local storage
  _load(): SavedName[] {
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

  _save(): void {
    localStorage.setItem('piste-on-piste-names', JSON.stringify(this.names));
  }

  _toggle(id: number) {
    for (let sn of this.names) {
      if (id == sn.id) {
	sn.enabled = !sn.enabled;
	break;
      }
    }
    this._sort();
  }

  valid_name(sn: SavedName): boolean {
    if (!sn.enabled)
      return true;

    if (!sn.name)
      return false;

    let dupes = this.names.filter((x) => x.enabled && x.name.toUpperCase() === sn.name.toUpperCase());

    return dupes.length === 1;
  }

  _all_valid(): boolean {
    return this.names.filter((x) => !this.valid_name(x)).length === 0;
  }

  _enabled_players(): number {
    return this.names.filter((x) => x.enabled).length;
  }

  can_new_game(): boolean {
    return this._all_valid() && this._enabled_players() >= 2;
  }
}

function create_names(_names: Names) {
  let { set, update, subscribe } = writable(_names);

  return {
    set,
    update,
    subscribe,
    save: () => update((val) => { val._save(); return val; }),
    shuffle: () => update((val) => { val._shuffle(); return val; }),
    toggle: (id: number) => update((val) => { val._toggle(id); return val; }),
  };
}

export const names = create_names(new Names());
