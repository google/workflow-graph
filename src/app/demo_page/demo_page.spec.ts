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
import {MatSelectHarness} from '@angular/material/select/testing';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';

import {ScreenshotTest} from '../../screenshot_test';
import {TEST_IMPORTS, TEST_PROVIDERS} from '../test_providers';
import {DemoPageHarness} from '../test_resources/demo_page_harness';

import {DagModePageModule} from './demo_page';

TestBed.resetTestEnvironment();
TestBed.initTestEnvironment(
    BrowserDynamicTestingModule, platformBrowserDynamicTesting(),
    {teardown: {destroyAfterEach: true}});

describe('Demo Page', () => {
  let fixture: ComponentFixture<DemoPage>;
  let harness: DemoPageHarness;
  let datasetInput: MatSelectHarness;
  let screenShot: ScreenshotTest;

  beforeEach(waitForAsync(async () => {
    await TestBed
        .configureTestingModule({
          declarations: [DemoPage],
          imports: [
            ...TEST_IMPORTS,
            DagModePageModule,
          ],
          providers: [...TEST_PROVIDERS],
        })
        .compileComponents();
    fixture = TestBed.createComponent(DemoPage);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    harness = await loader.getHarness(DemoPageHarness);
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
  });

  describe('Single Node', () => {
    it('Renders correctly (screenshot)', async () => {
      await datasetInput.clickOptions({text: 'Single Node'});
      await screenShot.expectMatch('single-node');
    });
  });

  describe('Recursive Graph', () => {
    it('Renders correctly (screenshot)', async () => {
      await datasetInput.clickOptions({text: 'Recursive Graph'});
      await screenShot.expectMatch('recursive-graph');
    });
  });

  describe('Artifact in nested loop', () => {
    it('Renders correctly (screenshot)', async () => {
      await datasetInput.clickOptions({text: 'Artifact in nested loop'});
      await screenShot.expectMatch('artifact-in-nested-loop');
    });
  });
});

@Component({template: '<dag-demo-page />'})
class DemoPage {
}
