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

import {DagRawHarness} from './directed_acyclic_graph_raw_harness';


/** Test harness for the Directed Acyclic Graph component. */
export class DirectedAcyclicGraphHarness extends ComponentHarness {
  // Needed to be able to use static fromText method.
  static hostSelector = 'ai-dag-renderer';

  /** Fetch the Root level raw renderer in this DAG */
  getRawDag(): Promise<DagRawHarness> {
    return this.locatorFor(DagRawHarness)();
  }

  /** Simple click event on the DAG Element's SVG Wrapper */
  async clickCanvas(): Promise<void> {
    const host = await this.host();
    return host.click();
  }

  /** Fetch Attributes on Dag Renderer element */
  async getAttribute(attributeName: string): Promise<string|null> {
    const host = await this.host();
    return host.getAttribute(attributeName);
  }
}
