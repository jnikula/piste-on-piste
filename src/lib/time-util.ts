// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2022 Jani Nikula <jani@nikula.org>

function pad(num) {
  return num.toString().padStart(2, 0);
}

function format_date(timestamp) {
  if (!timestamp)
    return '';

  let d = new Date();
  d.setTime(timestamp);

  return `${d.getFullYear()}-${pad(d.getMonth())}-${pad(d.getDate())}`;
}

function format_time(timestamp) {
  if (!timestamp)
    return '';

  let d = new Date();
  d.setTime(timestamp);

  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function format_ms(ms) {
  let sec = ms / 1000;
  const min = Math.floor(sec / 60);
  sec = Math.floor(sec % 60);

  return pad(min) + ':' + pad(sec);
}

export { format_date, format_time, format_ms };
