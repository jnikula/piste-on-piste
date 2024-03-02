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

  _enabled(): boolean {
    if (document.fullscreenElement)
      return true;

    if (document.webkitFullscreenElement)
      return true;

    if (document.msFullscreenElement)
      return true;

    return false;
  }

  _enable(): void {
    if (this._elem.requestFullscreen) {
      this._elem.requestFullscreen();
    } else if (this._elem.webkitRequestFullscreen) {
      this._elem.webkitRequestFullscreen();
    } else if (this._elem.msRequestFullscreen) {
      this._elem.msRequestFullscreen();
    }
  }

  _disable(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  _set(enable: boolean): void {
    if (enable)
      this._enable();
    else
      this._disable();
  }

  toggle(): void {
    const enable: boolean = !this._enabled();

    this._set(enable);
  }
}

export default Fullscreen;
