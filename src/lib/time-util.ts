// SPDX-License-Identifier: AGPL-3.0-or-later
// SPDX-FileCopyrightText: 2022 Jani Nikula <jani@nikula.org>

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

function format_date(timestamp: number): string {
  if (!timestamp)
    return '';

  let d: Date = new Date();

  d.setTime(timestamp);

  return `${d.getFullYear()}-${pad(d.getMonth())}-${pad(d.getDate())}`;
}

function format_time(timestamp: number): string {
  if (!timestamp)
    return '';

  let d: Date = new Date();

  d.setTime(timestamp);

  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function format_ms(ms: number): string {
  let sec: number = ms / 1000;
  const min: number = Math.floor(sec / 60);

  sec = Math.floor(sec % 60);

  return pad(min) + ':' + pad(sec);
}

export { format_date, format_time, format_ms };
