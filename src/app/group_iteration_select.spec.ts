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
import {Component} from '@angular/core';
import {ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatSelectHarness} from '@angular/material/select/testing';

import {GroupIterationSelectorModule} from './group_iteration_select';
import {DagGroup, DagNode as Node, DagNode, GraphSpec} from './node_spec';
import {fakeGraph} from './test_resources/fake_data';
import {DagGroupIterationOverlayHarness} from './test_resources/group_iteration_select_harness';
import {initTestBed} from './test_resources/test_utils';

const FAKE_DATA: GraphSpec =
    Node.createFromSkeleton(fakeGraph.skeleton, fakeGraph.state);

describe('Iteration Selector', () => {
  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [GroupIterationSelectorModule],
    });
  }));

  describe('Tests after opening select input', () => {
    const SEARCH_DEBOUNCE_TIME = 51;

    let fixture: ComponentFixture<TestComponent>;
    let select: MatSelectHarness;
    let overlay: DagGroupIterationOverlayHarness;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const loader = TestbedHarnessEnvironment.loader(fixture);
      select = await loader.getHarness(MatSelectHarness);

      await select.open();
      fixture.detectChanges();

      const rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
      overlay = await rootLoader.getHarness(DagGroupIterationOverlayHarness);
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('Renders correct number of items', async () => {
      const visibleOptions = await overlay.getVisibleOptions();
      expect(visibleOptions.length).toBe(5);
    });

    it('Renders correct number of items after filter change',
       fakeAsync(async () => {
         await overlay.filter('1');
         tick(SEARCH_DEBOUNCE_TIME);
         fixture.detectChanges();
         const visibleOptions = await overlay.getVisibleOptions();
         expect(visibleOptions.length).toBe(1);
         discardPeriodicTasks();
       }));

    it('Doesnt show no-result message by default', fakeAsync(async () => {
         expect((await overlay.getNoResultMessages()).length).toBe(0);
       }));

    it('Shows no-result message for one group', fakeAsync(async () => {
         expect((await overlay.getNoResultMessages()).length).toBe(0);
         await overlay.filter('1');
         tick(SEARCH_DEBOUNCE_TIME);
         fixture.detectChanges();
         expect((await overlay.getNoResultMessages()).length).toBe(1);
         discardPeriodicTasks();
       }));

    it('Shows no-result messages for both groups', fakeAsync(async () => {
         expect((await overlay.getNoResultMessages()).length).toBe(0);
         await overlay.filter('abcd');
         tick(SEARCH_DEBOUNCE_TIME);
         fixture.detectChanges();
         expect((await overlay.getNoResultMessages()).length).toBe(2);
         discardPeriodicTasks();
       }));

    it('Filter input clear button resets visible options',
       fakeAsync(async () => {
         await overlay.filter('1');
         tick(SEARCH_DEBOUNCE_TIME);
         fixture.detectChanges();
         const clearButton = await overlay.getClearButton();
         await clearButton.click();
         tick(SEARCH_DEBOUNCE_TIME);
         fixture.detectChanges();
         expect((await overlay.getVisibleOptions()).length).toBe(5);
         discardPeriodicTasks();
       }));
  });
});

@Component({
  standalone: false,
  template: `
      <div class="container">
        <ai-dag-iteration-selector
          [iterations]="iterations"
        />
      </div>`,
  styles: [`
    .container {
      height: 150px;
      width: 400px;
      position: relative;
    }
  `],
// TODO: Make this AOT compatible. See b/352713444
jit: true,

})
class TestComponent {
  iterations: Array<(DagNode | DagGroup)> =
      [...FAKE_DATA.groups[1].groups, ...FAKE_DATA.groups[1].nodes];
}
