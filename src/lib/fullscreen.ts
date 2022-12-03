// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2022 Jani Nikula <jani@nikula.org>

// Meh, augment types to avoid type errors
declare global {
  interface Document {
    webkitFullscreenElement?: Element;
    msFullscreenElement?: Element;
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  }

  interface Element {
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  }
}

function is_fullscreen() {
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement;
}

function request_fullscreen(elem: Element) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

function exit_fullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

export { is_fullscreen, request_fullscreen, exit_fullscreen };
