/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Basic properties of the shortcuts.
 */
export interface Shortcut {
  name: keyof typeof ShortcutName;
  desc: string;
  action?: Function;
  keys: {master: string; mac: string; windows?: string; linux?: string;};
}

/**
 * Saved config properties of the shortcuts.
 */
export interface SavedShortcutConfig {
  enabled: boolean;
  shortcut: string;
}

/**
 * Generally used shortcut object
 * (static properties and user configuration merged)
 */
export interface ShortcutConfig extends SavedShortcutConfig, Shortcut {}

/**
 * A list of shortcuts.
 */
export type ShortcutList<T = ShortcutConfig> = {
  [key in ShortcutName]?: T
};

/** Available shortcut keys. */
export enum ShortcutName {
  CANVAS_RIGHT = 'CANVAS_RIGHT',
  CANVAS_DOWN = 'CANVAS_DOWN',
  CANVAS_LEFT = 'CANVAS_LEFT',
  CANVAS_UP = 'CANVAS_UP',
  A11Y_HELP_CENTER = 'A11Y_HELP_CENTER',
}

/** Default shortcut definitions. */
export const DEFAULT_SHORTCUTS: ShortcutList<Shortcut> = {
  CANVAS_RIGHT: {
    name: 'CANVAS_RIGHT',
    desc: 'Move right on the canvas',
    keys: {
      master: 'Ctrl-ArrowRight',
      mac: 'Cmd-ArrowRight',
      windows: undefined,
      linux: undefined,
    },
  },
  CANVAS_DOWN: {
    name: 'CANVAS_DOWN',
    desc: 'Move down on the canvas',
    keys: {
      master: 'Ctrl-ArrowDown',
      mac: 'Cmd-ArrowDown',
      windows: undefined,
      linux: undefined,
    },
  },
  CANVAS_LEFT: {
    name: 'CANVAS_LEFT',
    desc: 'Move left on the canvas',
    keys: {
      master: 'Ctrl-ArrowLeft',
      mac: 'Cmd-ArrowLeft',
      windows: undefined,
      linux: undefined,
    },
  },
  CANVAS_UP: {
    name: 'CANVAS_UP',
    desc: 'Move up on the canvas',
    keys: {
      master: 'Ctrl-ArrowUp',
      mac: 'Cmd-ArrowUp',
      windows: undefined,
      linux: undefined,
    },
  },
  A11Y_HELP_CENTER: {
    name: 'A11Y_HELP_CENTER',
    desc: 'Open the Accessibility Help Center',
    keys: {
      master: 'Ctrl-H',
      mac: 'Cmd-H',
      windows: undefined,
      linux: undefined,
    },
  },
};
