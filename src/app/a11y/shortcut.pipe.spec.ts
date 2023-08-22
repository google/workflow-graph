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

import {fakeAsync} from '@angular/core/testing';

import {ShortcutPipe} from './shortcut.pipe';

describe('ShortcutPipe', () => {
  const pipe = new ShortcutPipe();

  it('Browser with no getLayoutMap() support', fakeAsync(async () => {
       pipe.navigator = {...pipe.navigator, keyboard: undefined};
       const result = await pipe.transform(
           'Cmd KeyA Digit0 Equal Minus ArrowDown NotAKey');
       expect(result).toBe('Cmd A 0 Equal Minus ArrowDown NotAKey');
     }));

  it('Browser with getLayoutMap() support', fakeAsync(async () => {
       const layoutmap = new Map([
         ['KeyA', 'A'],
         ['Digit0', '0'],
         ['Equal', '='],
         ['Minus', '-'],
       ]);
       pipe.navigator = {
         ...pipe.navigator,
         keyboard: {
           getLayoutMap: () => new Promise(resolve => {
             resolve(layoutmap);
           })
         }
       };

       const result = await pipe.transform(
           'Cmd KeyA Digit0 Equal Minus ArrowDown NotAKey');
       expect(result).toBe('Cmd A 0 = - ArrowDown NotAKey');
     }));
});