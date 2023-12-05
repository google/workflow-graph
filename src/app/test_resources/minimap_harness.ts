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

import {ComponentHarness, TestElement} from '@angular/cdk/testing';

/** Test harness for the Minimap component. */
export class MinimapHarness extends ComponentHarness {
  static hostSelector = 'minimap';

  async getAttribute(attributeName: string): Promise<string|null> {
    const host = await this.host();
    return host.getAttribute(attributeName);
  }

  getMinimap() {
    return this.locatorFor('.minimap')();
  }

  getViewbox() {
    return this.locatorFor('.view-window')();
  }

  getContentElement() {
    return this.locatorFor('.dag')();
  }
}
