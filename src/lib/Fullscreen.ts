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

export class Fullscreen {
  _elem: Element;

  constructor(elem: Element) {
    this._elem = elem;
  }

  is_fullscreen() {
    return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;
  }

  request_fullscreen() {
    if (this._elem.requestFullscreen) {
      this._elem.requestFullscreen();
    } else if (this._elem.webkitRequestFullscreen) {
      this._elem.webkitRequestFullscreen();
    } else if (this._elem.msRequestFullscreen) {
      this._elem.msRequestFullscreen();
    }
  }

  exit_fullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

export default Fullscreen;
