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

import {ElementRef, Injectable, OnDestroy} from '@angular/core';
import {fromEvent as observableFromEvent, Subscription} from 'rxjs';

import {DEFAULT_SHORTCUTS, SavedShortcutConfig, ShortcutConfig, ShortcutList, ShortcutName} from './shortcuts';

/**
 * A11y Shortcut singleton service provided on root level.
 */
@Injectable({providedIn: 'root'})
export class ShortcutService implements OnDestroy {
  private keySubscription?: Subscription;
  readonly shortcuts: ShortcutList = {};
  readonly defaultSaved: ShortcutList<SavedShortcutConfig> = {};

  constructor() {
    Object.entries(DEFAULT_SHORTCUTS).forEach(([key, value]) => {
      const os = this.detectOS();
      const keys = new Map(Object.entries(value.keys));
      const shortcut = keys.get(os) || keys.get('master');
      const shortcutKey = key as ShortcutName;
      if (shortcut) {
        this.defaultSaved[shortcutKey] = {
          enabled: true,
          shortcut,
        };
        this.shortcuts[shortcutKey] = {
          ...this.defaultSaved[shortcutKey]!,
          ...DEFAULT_SHORTCUTS[shortcutKey]!,
        };
      }
    });
  }

  updateShortcuts(values: ShortcutList<SavedShortcutConfig>) {
    Object.entries(values).forEach(([key, value]) => {
      const shortcutKey = key as ShortcutName;
      if (this.shortcuts[shortcutKey]) {
        Object.assign(this.shortcuts[shortcutKey]!, value);
      }
    });
  }

  private handleShortcut(e: KeyboardEvent) {
    const keys: string[] = [];

    if (e.ctrlKey) keys.push('Ctrl');
    if (e.metaKey) keys.push('Cmd');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    keys.push(e.code);

    const foundShortcut = Object.values(this.shortcuts).find(({shortcut}) => {
      const shortcutArray = shortcut.split(' ');
      return shortcutArray.length === keys.length &&
          keys.every(el => shortcutArray.includes(el));
    });

    if (foundShortcut?.action && foundShortcut?.enabled) {
      e.preventDefault();
      foundShortcut.action();
    }
  }

  private detectOS() {
    if (navigator.userAgent.includes('Win')) {
      return 'windows';
    }
    if (navigator.userAgent.includes('Mac')) {
      return 'mac';
    }
    if (navigator.userAgent.includes('Linux')) {
      return 'linux';
    }
    return 'master';
  }

  registerShortcutAction(name: keyof typeof ShortcutName, action: Function) {
    this.shortcuts[name] = {...this.shortcuts[name], action} as ShortcutConfig;
  }

  enableShortcuts(ref: ElementRef) {
    this.disableShortcuts();
    this.keySubscription =
        observableFromEvent<KeyboardEvent>(ref.nativeElement, 'keydown')
            .subscribe(e => {
              this.handleShortcut(e);
            });
  }

  disableShortcuts() {
    this.keySubscription?.unsubscribe();
  }

  ngOnDestroy() {
    this.keySubscription?.unsubscribe();
  }
}

export {SavedShortcutConfig, ShortcutConfig, ShortcutList, ShortcutName};
