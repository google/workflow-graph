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
import {MatButtonHarness} from '@angular/material/button/testing';
import {MatSlideToggleHarness} from '@angular/material/slide-toggle/testing';

/** Test harness for the Directed Acyclic Graph component. */
export class DagToolbarHarness extends ComponentHarness {
  // Needed to be able to use static fromText method.
  static hostSelector = 'ai-dag-toolbar';

  async getAttribute(attributeName: string): Promise<string|null> {
    const host = await this.host();
    return host.getAttribute(attributeName);
  }

  getActionButton(): Promise<TestElement|null> {
    return this.locatorForOptional(':not(.controls) button')();
  }

  getExpandToggle(): Promise<MatSlideToggleHarness> {
    return this.locatorFor(
        MatSlideToggleHarness.with({selector: '#dag-toggle'}))();
  }

  async getZoomText(): Promise<string> {
    const zoomSelector = await this.locatorFor('.zoom .value')();
    return zoomSelector.text();
  }

  getZoomInButton() {
    return this.locatorFor(MatButtonHarness.with({selector: '.zoom .in'}))();
  }
  getZoomOutButton() {
    return this.locatorFor(MatButtonHarness.with({selector: '.zoom .out'}))();
  }

  getElement(query: string) {
    return this.locatorFor(query)();
  }
}
