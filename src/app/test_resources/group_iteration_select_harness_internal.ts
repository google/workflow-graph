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

import {DebugElement, Type} from '@angular/core';
import {BaseHarness} from 'google3/javascript/angular2/components/testing/harnesses/base_harness';
import {MaterialButtonHarness} from 'google3/javascript/angular2/components/testing/harnesses/button_harness';
import {MaterialInputHarness} from 'google3/javascript/angular2/components/testing/harnesses/input_harness';

import {GroupIterationSelector} from '../group_iteration_select';


/** Test harness for the Directed Acyclic Graph component. */
export class DagGroupIterationOverlayHarness extends BaseHarness {
  // Needed to be able to use static fromText method.
  protected static override type: Type<{}> = GroupIterationSelector;

  constructor(element?: DebugElement) {
    super(DagGroupIterationOverlayHarness.type, element);
  }

  getFilterInput() {
    return MaterialInputHarness.fromDebugElement(
        this.query('#ai-dag-iteration-selector-filter'));
  }

  getClearButton() {
    return MaterialButtonHarness.fromDebugElement(this.query('.clear'));
  }

  async filter(term: string) {
    const filterInput = this.getFilterInput();
    await filterInput.setValue(term);
  }
}