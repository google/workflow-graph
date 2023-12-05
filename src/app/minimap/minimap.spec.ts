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
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';

import {ScreenshotTest} from '../../screenshot_test';
import {MinimapPosition} from '../data_types_internal';
import {GraphSpec} from '../node_spec';
import {TEST_IMPORTS, TEST_PROVIDERS} from '../test_providers';
import {MinimapHarness} from '../test_resources/minimap_harness';

import {MinimapModule} from './minimap';
import {graph} from './test_resources/fake_data';

const MINIMAP_WIDTH = 150;
const TEST_WIN_WIDTH = 1513;
const TEST_WIN_HEIGHT = 884;

TestBed.resetTestEnvironment();
TestBed.initTestEnvironment(
    BrowserDynamicTestingModule, platformBrowserDynamicTesting(),
    {teardown: {destroyAfterEach: true}});

describe('Minimap', () => {
  let fixture: ComponentFixture<TestModule>;
  let screenShot: ScreenshotTest;
  let harness: MinimapHarness;

  beforeEach(waitForAsync(async () => {
    await TestBed
        .configureTestingModule({
          declarations: [TestModule],
          imports: [
            ...TEST_IMPORTS,
            MinimapModule,
          ],
          providers: [...TEST_PROVIDERS],
        })
        .compileComponents();

    screenShot = new ScreenshotTest(module.id);
  }));

  [{name: 'default_dataset', graph, graphWidth: 2140.4, graphHeight: 1404.4}]
      .forEach((dataset) => {
        describe(dataset.name, () => {
          beforeEach(waitForAsync(async () => {
            fixture = TestBed.createComponent(TestModule);
            fixture.componentInstance.graph = dataset.graph;
            fixture.componentInstance.graphWidth = dataset.graphWidth;
            fixture.componentInstance.graphHeight = dataset.graphHeight;
            fixture.detectChanges();

            const loader = TestbedHarnessEnvironment.loader(fixture);
            harness = await loader.getHarness(MinimapHarness);
          }));

          afterEach(fakeAsync(() => {
            fixture.destroy();
          }));

          describe('Component rendering', () => {
            it('Renders correctly (screenshot)', async () => {
              await screenShot.expectMatch(
                  `renders_correctly_${dataset.name}`, 'minimap');
            });
          });

          describe('Position', () => {
            it('Top', async () => {
              fixture.componentInstance.position = 'top';
              const element = await harness.host();
              expect(await element.getCssValue('order')).toBe('0');
            });
            it('Bottom', async () => {
              fixture.componentInstance.position = 'bottom';
              const element = await harness.host();
              expect(await element.getCssValue('order')).toBe('1');
            });
          });

          describe('Dimensions', () => {
            it('Height', async () => {
              const minimap = await harness.getMinimap();
              const dimensions = await minimap.getDimensions();
              const scale = MINIMAP_WIDTH / dataset.graphWidth;
              expect(dimensions.height)
                  .toBeCloseTo(dataset.graphHeight * scale, 1);
            });
          });


          describe('Viewbox dimensions', () => {
            it('Zoom is above 1', async () => {
              fixture.componentInstance.zoom = 1.5;
              const scale = MINIMAP_WIDTH / dataset.graphWidth;
              const viewBox = await harness.getViewbox();
              const dimensions = await viewBox.getDimensions();

              expect(dimensions.width)
                  .toBeCloseTo(
                      TEST_WIN_WIDTH * scale / fixture.componentInstance.zoom,
                      1);
              expect(dimensions.height)
                  .toBeCloseTo(
                      TEST_WIN_HEIGHT * scale / fixture.componentInstance.zoom,
                      1);
            });
            it('Zoom is below 1', async () => {
              fixture.componentInstance.zoom = 0.7;
              const scale = MINIMAP_WIDTH / dataset.graphWidth;
              const viewBox = await harness.getViewbox();
              const dimensions = await viewBox.getDimensions();

              expect(dimensions.width).toBeCloseTo(TEST_WIN_WIDTH * scale, 1);
              expect(dimensions.height).toBeCloseTo(TEST_WIN_HEIGHT * scale, 1);
            });
          });

          describe('Content scaled if zoom is', () => {
            it('Zoom is above 1', async () => {
              fixture.componentInstance.zoom = 1.5;
              const contentElement = await harness.getContentElement();
              const transformStyle = await contentElement.getAttribute('style');
              expect(transformStyle).toContain('transform: scale(1)');
            });
            it('Zoom is below 1', async () => {
              fixture.componentInstance.zoom = 0.7;
              const contentElement = await harness.getContentElement();
              const transformStyle = await contentElement.getAttribute('style');
              expect(transformStyle)
                  .toContain(
                      `transform: scale(${fixture.componentInstance.zoom})`);
            });
          });
        });
      });
});

@Component({
  template: `
      <div class="container">
        <minimap
          [winWidth]="TEST_WIN_WIDTH"
          [winHeight]="TEST_WIN_HEIGHT"
          [graphWidth]="graphWidth"
          [graphHeight]="graphHeight"
          [groups]="graph.groups"
          [nodes]="graph.nodes"
          [position]="position"
          [zoom]="zoom"
        />
      </div>`,
  styles: [`
      .container {
        width: 150px;
      }`],
})
class TestModule {
  TEST_WIN_WIDTH = TEST_WIN_WIDTH;
  TEST_WIN_HEIGHT = TEST_WIN_HEIGHT;
  graph!: GraphSpec;
  graphWidth!: number;
  graphHeight!: number;
  position?: MinimapPosition;
  zoom = 1;
}
