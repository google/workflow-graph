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

import {Pipe, PipeTransform} from '@angular/core';

/**
 * Pipe to transfer string shortcut provided by Shortcut Service
 * (KeyboardEvent codes) to user interpretable local keyboard keys.
 * Using an experimental technology
 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator/keyboard
 */
@Pipe({
  name: 'shortcut',
  standalone: true,
})
export class ShortcutPipe implements PipeTransform {
  navigator: Navigator&{keyboard?: any} = navigator;

  transform(value: string) {
    const keyboard = this.navigator.keyboard;
    if (keyboard) {
      return keyboard.getLayoutMap().then(
          (keyboardLayoutMap: Map<string, string>) => {
            return value.split(' ')
                .map(v => keyboardLayoutMap.get(v)?.toUpperCase() || v)
                .join(' ');
          });
    } else {
      return new Promise(resolve => {
        resolve(value.replace('Key', '').replace('Digit', ''));
      });
    }
  }
}