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

import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Component, Input} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';

import {ScreenshotTest} from '../screenshot_test';

import {type NodeState} from './data_types_internal';
import {DagNodeStateBadgeModule} from './node_state_badge';
import {DagNodeStateBadgeHarness} from './test_resources/node_state_badge_harness';
import {initTestBed} from './test_resources/test_utils';

describe('Node State Badge', () => {
  let fixture: ComponentFixture<TestComponent>;
  let harness: DagNodeStateBadgeHarness;
  let screenShot: ScreenshotTest;

  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [DagNodeStateBadgeModule],
    });
    fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.nodeState = 'PENDING';
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    harness = await loader.getHarness(DagNodeStateBadgeHarness);

    screenShot = new ScreenshotTest(module.id);
  }));

  afterEach(fakeAsync(() => {
    fixture.destroy();
  }));

  describe('PENDING', () => {
    it('Renders an icon and the given label text', fakeAsync(async () => {
         fixture.componentInstance.nodeState = 'PENDING';
         fixture.detectChanges();
         expect(await harness.getIcon()).toBeDefined();
         expect(await harness.getText()).toEqual('Pending');
       }));

    it('Renders correctly (screenshot)', async () => {
      await screenShot.expectMatch('pending');
    });
  });

  it('NO_STATE_STATIC - Renders an icon and the given label text',
     fakeAsync(async () => {
       fixture.componentInstance.nodeState = 'NO_STATE_STATIC';
       fixture.detectChanges();
       expect(await harness.hasIcon()).toBeFalse();
       expect(await harness.getText()).toEqual('');
     }));

  it('NO_STATE_RUNTIME - Renders nothing for NO_STATE_RUNTIME',
     fakeAsync(async () => {
       fixture.componentInstance.nodeState = 'NO_STATE_RUNTIME';
       fixture.detectChanges();
       expect(await harness.hasIcon()).toBeFalse();
       expect(await harness.getText()).toEqual('');
     }));
});

@Component({
  template:
      '<ai-dag-node-state-badge #badge [nodeState]="nodeState"></ai-dag-node-state-badge>'
})
class TestComponent {
  @Input({required: true}) nodeState!: NodeState;
}
