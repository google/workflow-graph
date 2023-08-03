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

import {ElementRef} from '@angular/core';

import {keyWithCtrlOrCommand} from '../test_resources/test_utils';

import {ShortcutService} from './shortcut.service';

const TEST_SHORTCUT = 'CANVAS_UP';
const TEST_SHORTCUT_KEYDOWN = keyWithCtrlOrCommand('ArrowUp');

describe('ShortcutService', () => {
  let service: ShortcutService;
  let element: ElementRef;

  beforeEach(() => {
    service = new ShortcutService();
    element = new ElementRef(document.createElement('div'));
    service.enableShortcuts(element);
  });

  it('Shortcut action is triggered on keypress', () => {
    const registeredFunction = jasmine.createSpy();
    service.registerShortcutAction(TEST_SHORTCUT, registeredFunction);
    element.nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', TEST_SHORTCUT_KEYDOWN));
    expect(registeredFunction).toHaveBeenCalled();
  });
});