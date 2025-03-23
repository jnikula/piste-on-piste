// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2024 Jani Nikula <jani@nikula.org>

function shuffle(array: any[]): any[] {
  let input: any[] = [...array];
  let result: any[] = [];

  while (input.length) {
    let index: number = Math.floor(Math.random() * input.length);

    result.push(input[index]);
    input.splice(index, 1);
  }

  return result;
}

export type SavedName = {
  id: number;
  name: string;
};

export class Options {
  names: SavedName[] = $state([]);

  constructor() {
    let names: SavedName[] = this._load();

    if (names) {
      names = shuffle(names);
    } else {
      names = [];
      for (let i of [1,2,3])
	names.push({ id: i, name: `Player ${i}`});
    }

    this.names.splice(0, 3, ...names);
  }

  shuffle(): void {
    let names: SavedName[] = shuffle(this.names);

    this.names.splice(0, 3, ...names);
  }

  // load names from local storage
  private _load(): SavedName[] {
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

  save(): void {
    localStorage.setItem('piste-on-piste-names', JSON.stringify(this.names));
  }

  valid_name(name: string): boolean {
    if (!name)
      return false;

    let dupes = this.names.filter((x) => x.name.toUpperCase() === name.toUpperCase());

    return dupes.length === 1;
  }

  private _all_valid(): boolean {
    return this.names.filter((x) => !this.valid_name(x.name)).length === 0;
  }

  can_new_game(): boolean {
    return this._all_valid();
  }
}
