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
import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';
import {MatNativeSelectHarness} from '@angular/material/input/testing';

import {ScreenshotTest} from '../../screenshot_test';
import {DemoPageHarness} from '../test_resources/demo_page_harness';
import {DagRawHarness} from '../test_resources/directed_acyclic_graph_raw_harness';
import {initTestBed} from '../test_resources/test_utils';

import {DagModePageModule} from './demo_page';


describe('Demo Page', () => {
  let fixture: ComponentFixture<TestComponent>;
  let harness: DemoPageHarness;
  let dagHarness: DagRawHarness;
  let datasetInput: MatNativeSelectHarness;
  let screenShot: ScreenshotTest;

  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [DagModePageModule],
    });
    fixture = TestBed.createComponent(TestComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    harness = await loader.getHarness(DemoPageHarness);
    dagHarness = await loader.getHarness(DagRawHarness);
    datasetInput = await harness.getDatasetInput();
    screenShot = new ScreenshotTest(module.id);
  }));

  afterEach(fakeAsync(() => {
    fixture.destroy();
  }));

  describe('Default dataset', () => {
    it('Renders correctly (screenshot)', async () => {
      await screenShot.expectMatch('default-dataset');
    });
    it('Centers correctly on focus of a node (screenshot)', async () => {
      const nodes = await dagHarness.getNodes();
      await nodes[13].focus();

      await screenShot.expectMatch('default-dataset-node-focus');
    });
    it('Centers correctly on focus of a nested node (screenshot)', async () => {
      await dagHarness.clickExpandToggle(0);
      const nodes = await dagHarness.getNodes();
      await nodes[8].focus();

      await screenShot.expectMatch('default-dataset-nested-node-focus');
    });
  });

  describe('Single Node', () => {
    it('Renders correctly (screenshot)', async () => {
      await datasetInput.selectOptions({text: 'Single Node'});
      await screenShot.expectMatch('single-node');
    });
  });

  describe('Recursive Graph', () => {
    it('Renders correctly (screenshot)', async () => {
      await datasetInput.selectOptions({text: 'Recursive Graph'});
      await screenShot.expectMatch('recursive-graph');
    });
  });

  describe('Artifact in nested loop', () => {
    it('Renders correctly (screenshot)', async () => {
      await datasetInput.selectOptions({text: 'Artifact in nested loop'});
      await screenShot.expectMatch('artifact-in-nested-loop');
    });
  });

  describe('Expanded group label positioning', () => {
    it('Renders correctly (screenshot)', async () => {
      await datasetInput.selectOptions({text: 'Expanded Group label'});
      await dagHarness.clickExpandToggle(0);
      await screenShot.expectMatch('group-label-positioning');
    });
  });

  describe('Edge marker styles', () => {
    it('Renders correctly (screenshot)', async () => {
      await datasetInput.selectOptions({text: 'Edge Marker Styles'});
      await screenShot.expectMatch('edge-marker-styles');
    });
  });
});



@Component({
  standalone: false,
  template:
      `<div style="height: 1200px;">
        <dag-demo-page />
      </div>`,
// TODO: Make this AOT compatible. See b/352713444
jit: true,

})
class TestComponent {
}
