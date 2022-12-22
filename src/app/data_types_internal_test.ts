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

import 'jasmine';

import {describe, expect, it} from 'google3/javascript/angular2/testing/catalyst';

import {clampVal, convertStateToRuntime, createDAGFeatures, defaultFeatures, FeatureToggleOptions, isNoState, NodeState, RuntimeState} from './data_types_internal';


describe('DirectedAcyclicGraph Internal Methods', () => {
  it('convertStateToRuntime works as intended', () => {
    const runtimeStates: NodeState[] = [
      'NO_STATE_RUNTIME', 'CANCELLED', 'CANCELLING', 'CANCEL_PENDING', 'FAILED',
      'PENDING', 'RUNNING', 'SKIPPED', 'SUCCEEDED', 'TIMEOUT'
    ];
    const staticStates: NodeState[] = ['NO_STATE_STATIC'];

    for (const state of runtimeStates) {
      expect(convertStateToRuntime(state)).toBe('Runtime' as RuntimeState);
    }
    for (const state of staticStates) {
      expect(convertStateToRuntime(state)).toBe('Static' as RuntimeState);
    }
  });

  it('isNoState verifies all non_state states', () => {
    const nonStates: NodeState[] = ['NO_STATE_RUNTIME', 'NO_STATE_STATIC'];
    const otherStates: NodeState[] = [
      'CANCELLED', 'CANCELLING', 'CANCEL_PENDING', 'FAILED', 'PENDING',
      'RUNNING', 'SKIPPED', 'SUCCEEDED', 'TIMEOUT'
    ];
    nonStates.forEach(s => {
      expect(isNoState(s)).toBe(true);
    });
    otherStates.forEach(s => {
      expect(isNoState(s)).toBe(false);
    });
  });
  it('createDAGFeatures constructs the Feature Toggle Set correctly', () => {
    const testKey: keyof FeatureToggleOptions = 'zoomControls';
    const defaultValue = defaultFeatures[testKey];
    const newObj = createDAGFeatures({[testKey]: !defaultValue});
    expect(newObj[testKey]).not.toBe(defaultFeatures[testKey]);
  });
  it('clampVal correctly constricts values', () => {
    // We do not care about the value in the array, just the index
    // tslint:disable-next-line:enforce-name-casing
    const src = new Array(20).fill(0).map((_, e) => e - 10);
    const min = -1;
    const max = 4;
    const solution = [
      new Array(9).fill(-1), src.slice(9, -5), new Array(5).fill(4)
    ].flatMap(i => [...i]);
    expect(src.map(s => clampVal(s, min, max))).toEqual(solution);
    // Test alternate form
    expect(src.map(s => clampVal({num: s, min, max}))).toEqual(solution);
  });
});
