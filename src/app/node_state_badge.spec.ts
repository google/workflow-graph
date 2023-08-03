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
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';

import {NodeState} from './data_types_internal';
import {DagNodeStateBadgeModule} from './node_state_badge';
import {TEST_IMPORTS, TEST_PROVIDERS} from './test_providers';
import {DagNodeStateBadgeHarness} from './test_resources/node_state_badge_harness';

TestBed.resetTestEnvironment();
TestBed.initTestEnvironment(
    BrowserDynamicTestingModule, platformBrowserDynamicTesting(),
    {teardown: {destroyAfterEach: true}});

describe('Node State Badge', () => {
  describe('States', () => {
    let fixture: ComponentFixture<DagNodeStateBadgeHost>;
    let harness: DagNodeStateBadgeHarness;

    beforeEach(waitForAsync(async () => {
      await TestBed
          .configureTestingModule({
            declarations: [DagNodeStateBadgeHost],
            imports: [
              ...TEST_IMPORTS,
              DagNodeStateBadgeModule,
            ],
            providers: [...TEST_PROVIDERS],
          })
          .compileComponents();
      fixture = TestBed.createComponent(DagNodeStateBadgeHost);
      fixture.componentInstance.nodeState = 'PENDING';
      fixture.detectChanges();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      harness = await loader.getHarness(DagNodeStateBadgeHarness);
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('PENDING - Renders an icon and the given label text',
       fakeAsync(async () => {
         fixture.componentInstance.nodeState = 'PENDING';
         fixture.detectChanges();
         expect(await harness.getIcon()).toBeDefined();
         expect(await harness.getText()).toEqual('Pending');
       }));

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
});

@Component({
  template:
      '<ai-dag-node-state-badge #badge [nodeState]="nodeState"></ai-dag-node-state-badge>'
})
class DagNodeStateBadgeHost {
  @Input({required: true}) nodeState!: NodeState;
}
