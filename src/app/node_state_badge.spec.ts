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
import {NODE_STATE_TRANSLATIONS, NodeStateTranslations, WORKFLOW_GRAPH_TRANSLATIONS} from './i18n';
import {DagNodeStateBadgeModule} from './node_state_badge';
import {DagNodeStateBadgeHarness} from './test_resources/node_state_badge_harness';
import {initTestBed} from './test_resources/test_utils';

async function setup(params: {translations?: Partial<NodeStateTranslations>}) {
  await initTestBed({
    declarations: [TestComponent],
    imports: [DagNodeStateBadgeModule],
    providers: [{
      provide: WORKFLOW_GRAPH_TRANSLATIONS,
      useValue: params.translations || {}
    }],
  });
  const fixture = TestBed.createComponent(TestComponent);
  fixture.componentInstance.nodeState = 'PENDING';
  fixture.detectChanges();
  const loader = TestbedHarnessEnvironment.loader(fixture);
  const harness = await loader.getHarness(DagNodeStateBadgeHarness);

  const screenShot = new ScreenshotTest(module.id);

  return {fixture, harness, screenShot};
}

describe('Node State Badge', () => {
  let fixture: ComponentFixture<TestComponent>;
  let harness: DagNodeStateBadgeHarness;
  let screenShot: ScreenshotTest;

  describe('without custom translations', () => {
    beforeEach(waitForAsync(async () => {
      const components = await setup({});
      fixture = components.fixture;
      harness = components.harness;
      screenShot = components.screenShot;
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
  })

  describe('with custom translations', () => {
    beforeEach(waitForAsync(async () => {
      const components = await setup({
        translations:
            {...NODE_STATE_TRANSLATIONS, 'nodeStatePending': 'Custom pending'}
      });
      fixture = components.fixture;
      harness = components.harness;
      screenShot = components.screenShot;
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('Uses the provided translation messages', fakeAsync(async () => {
         fixture.componentInstance.nodeState = 'PENDING';
         fixture.detectChanges();
         expect(await harness.getText()).toEqual('Custom pending');
       }));
  });
});

@Component({
  standalone: false,
  template:
      '<ai-dag-node-state-badge #badge [nodeState]="nodeState"></ai-dag-node-state-badge>',
  jit: true,
})
class TestComponent {
  @Input({required: true}) nodeState!: NodeState;
}
