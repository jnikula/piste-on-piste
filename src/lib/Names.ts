// SPDX-License-Identifier: AGPL-3.0-or-later
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
};

class Names {
  names: SavedName[];

  constructor() {
    let names: SavedName[] = this._load();

    if (names) {
      this.names = shuffle(names);
    } else {
      names = [];
      for (let i of [1,2,3])
	names.push({ id: i, name: `Player ${i}`});

      this.names = names;
    }
  }

  _shuffle(): void {
    this.names = shuffle(this.names);
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

  valid_name(name: string): boolean {
    if (!name)
      return false;

    let dupes = this.names.filter((x) => x.name.toUpperCase() === name.toUpperCase());

    return dupes.length === 1;
  }

  _all_valid(): boolean {
    return this.names.filter((x) => !this.valid_name(x.name)).length === 0;
  }

  can_new_game(): boolean {
    return this._all_valid();
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
  };
}

export const names = create_names(new Names());
