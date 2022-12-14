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

import {ComponentHarness} from '@angular/cdk/testing';
import {MatIconHarness} from '@angular/material/icon/testing';

/** Test harness for the Dag Node Element component. */
export class DagNodeElHarness extends ComponentHarness {
  // Needed to be able to use static fromText method.
  static hostSelector = 'ai-dag-node';

  /** Returns the `<cfc-icon>|<span>` element for the node logo */
  async nodeIcon(): Promise<MatIconHarness> {
    if (await this.hasTextIcon()) {
      return this.locatorFor(MatIconHarness.with(
          {selector: '.icon-space .icon.left .mat-icon'}))();
    }
    return this.locatorFor(
        MatIconHarness.with({selector: '.icon-space .icon.left .mat-icon'}))();
  }

  /** Returns the `<cfc-icon>` element for the node logo */
  stateIcon() {
    return this.locatorFor(
        MatIconHarness.with({selector: '.icon-space .icon.right .mat-icon'}))();
  }

  /** Is the icon for the current node Text instead of SVG */
  async hasTextIcon() {
    const element =
        await this.locatorForOptional('.icon-space span.icon.left')();
    return !!element;
  }

  async getTitle() {
    const element = await this.locatorFor('.text-area .node-title')();
    return (await element.text())?.trim();
  }

  /**
   * Fetch description of node, if `undefined` then no description element was
   * present
   */
  async getSubtitle(): Promise<string|undefined> {
    const el = await this.locatorFor('.text-area .description-text')();
    return el ? (await el.text())?.trim() : undefined;
  }

  async triggerMouseenter(): Promise<void> {
    const host = await this.host();
    return host.dispatchEvent('mouseenter');
  }

  async triggerMouseleave(): Promise<void> {
    const host = await this.host();
    return host.dispatchEvent('mouseleave');
  }

  async click() {
    const host = await this.host();
    return host.click();
  }

  /** Fetch Attributes on Dag Renderer element */
  async getAttribute(attributeName: string): Promise<string|null> {
    const host = await this.host();
    return host.getAttribute(attributeName);
  }
}
