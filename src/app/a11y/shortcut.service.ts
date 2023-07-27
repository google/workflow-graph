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

import {DEFAULT_SHORTCUTS, ShortcutName} from './shortcuts';


/**
 * A11y Shortcut singleton service provided on root level.
 */
@Injectable({providedIn: 'root'})
export class ShortcutService implements OnDestroy {
  private keySubscription?: Subscription;
  private readonly shortcutActions =
      new Map<keyof typeof ShortcutName, Function>();
  private readonly shortcuts = new Map<string, keyof typeof ShortcutName>();

  constructor() {
    // Mapping through DEFAULT_SHORTCUTS and appending the OS dependent
    // default shortcut to "this.shortcuts".
    // TODO: overwrite them with provided settings.
    Object.entries(DEFAULT_SHORTCUTS).forEach(entry => {
      const [key, value] = entry;
      const os = this.detectOS();
      const keys = new Map(Object.entries(value.keys));
      const valueToSet = keys.get(os) || keys.get('master');
      if (valueToSet) this.shortcuts.set(valueToSet, key as ShortcutName);
    });
  }

  ngOnDestroy() {
    this.keySubscription?.unsubscribe();
  }

  registerShortcutAction(name: keyof typeof ShortcutName, action: Function) {
    this.shortcutActions.set(name, action);
  }

  private handleShortcut(e: KeyboardEvent) {
    const keys: string[] = [];

    if (e.ctrlKey) keys.push('Ctrl');
    if (e.metaKey) keys.push('Cmd');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    keys.push(e.key.length > 1 ? e.key : e.key.toUpperCase());

    const foundShortcutKey = this.shortcuts.get(keys.join('-'));

    if (foundShortcutKey && this.shortcutActions.has(foundShortcutKey)) {
      e.preventDefault();
      this.shortcutActions.get(foundShortcutKey)!();
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

  enableShortcuts(ref: ElementRef) {
    this.keySubscription?.unsubscribe();
    this.keySubscription =
        observableFromEvent<KeyboardEvent>(ref.nativeElement, 'keydown')
            .subscribe(e => {
              this.handleShortcut(e);
            });
  }
}
