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
import {Component, ViewChild} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';

import {ScreenshotTest} from '../../screenshot_test';
import {STATE_SERVICE_PROVIDER} from '../dag-state.service.provider';
import {MinimapPosition} from '../data_types_internal';
import {GraphSpec} from '../node_spec';
import {MinimapHarness} from '../test_resources/minimap_harness';
import {initTestBed} from '../test_resources/test_utils';

import {Minimap, MinimapModule} from './minimap';
import {graph} from './test_resources/fake_data';
import {graph as graph_expanded} from './test_resources/fake_data_expanded_groups';

const MINIMAP_WIDTH = 150;
const TEST_WIN_WIDTH = 1513;
const TEST_WIN_HEIGHT = 884;

describe('Minimap', () => {
  let fixture: ComponentFixture<TestComponent>;
  let screenShot: ScreenshotTest;
  let harness: MinimapHarness;
  let minimapRenderer: Minimap;

  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [MinimapModule],
      providers: [STATE_SERVICE_PROVIDER],
    });
    screenShot = new ScreenshotTest(module.id);
  }));

  const dataset = {
    graph,
    graphWidth: 2140.4,
    graphHeight: 1404.4,
  };

  const scale = MINIMAP_WIDTH / dataset.graphWidth;

  beforeEach(waitForAsync(async () => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.componentInstance.graph = graph;
    fixture.componentInstance.graphWidth = 2140.4;
    fixture.componentInstance.graphHeight = 1404.4;
    fixture.detectChanges();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    harness = await loader.getHarness(MinimapHarness);

    minimapRenderer = fixture.componentInstance.minimap;
  }));

  afterEach(fakeAsync(() => {
    fixture.destroy();
  }));

  describe('Component rendering', () => {
    it('Renders correctly (screenshot)', async () => {
      await screenShot.expectMatch(`renders_correctly`, 'minimap');
    });
    it('Expanded groups and iterations (screenshot)', async () => {
      fixture.componentInstance.graph = graph_expanded;
      fixture.componentInstance.graphWidth = 2750.5;
      fixture.componentInstance.graphHeight = 2301.5;
      fixture.detectChanges();
      await screenShot.expectMatch(`expanded_groups`, 'minimap');
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
      expect(dimensions.height).toBeCloseTo(dataset.graphHeight * scale, 1);
    });
  });

  describe('Viewbox dimensions', () => {
    it('Zoom is above 1', async () => {
      const zoom = 1.5;
      minimapRenderer.stateService.zoom.next(zoom);
      const viewBox = await harness.getViewbox();
      const dimensions = await viewBox.getDimensions();

      expect(dimensions.width).toBeCloseTo(TEST_WIN_WIDTH * scale / zoom, 1);
      expect(dimensions.height).toBeCloseTo(TEST_WIN_HEIGHT * scale / zoom, 1);
    });
    it('Zoom is below 1', async () => {
      minimapRenderer.stateService.zoom.next(0.7);
      const viewBox = await harness.getViewbox();
      const dimensions = await viewBox.getDimensions();

      expect(dimensions.width).toBeCloseTo(TEST_WIN_WIDTH * scale, 1);
      expect(dimensions.height).toBeCloseTo(TEST_WIN_HEIGHT * scale, 1);
    });
  });

  describe('Content scale', () => {
    it('Zoom is above 1', async () => {
      minimapRenderer.stateService.zoom.next(1.5);
      const contentElement = await harness.getContentElement();
      const style = await contentElement.getAttribute('style');
      expect(style).toContain('transform: scale(1)');
    });
    it('Zoom is below 1', async () => {
      const zoom = 0.7;
      minimapRenderer.stateService.zoom.next(zoom);
      const contentElement = await harness.getContentElement();
      const style = await contentElement.getAttribute('style');
      expect(style).toContain(`transform: scale(${zoom})`);
    });
  });

  describe('Viewbox position', () => {
    it('Default position', async () => {
      const viewBox = await harness.getViewbox();
      const style = await viewBox.getAttribute('style');
      expect(style).toContain('transform: translate3d(0px, 0px, 0px)');
    });
    describe('Viewbox position (x=-700, y=-300)', () => {
      it('Zoom is above 1', async () => {
        fixture.componentInstance.x = -700;
        fixture.componentInstance.y = -300;
        minimapRenderer.stateService.zoom.next(1.5);
        const viewBox = await harness.getViewbox();
        const style = await viewBox.getAttribute('style');
        expect(style).toContain('transform: translate3d(33px, 14px, 0px)');
      });
      it('Zoom is below 1', async () => {
        fixture.componentInstance.x = -700;
        fixture.componentInstance.y = -300;
        minimapRenderer.stateService.zoom.next(0.7);
        const viewBox = await harness.getViewbox();
        const style = await viewBox.getAttribute('style');
        expect(style).toContain(`transform: translate3d(49px, 21px, 0px)`);
      });
    });
  });

  describe('Interactions', () => {
    it('Dragging viewbox', async () => {
      spyOn(minimapRenderer.windowPan, 'emit');
      const dragTo = {x: 10, y: 20};
      await harness.dragViewbox(dragTo);
      expect(minimapRenderer.windowPan.emit).toHaveBeenCalledWith({
        x: Math.round(dragTo.x / scale),
        y: Math.round(dragTo.y / scale),
      });
    });

    it('Pan with keyboard arrows (pans 10px)', async () => {
      spyOn(minimapRenderer.windowPan, 'emit');
      const viewBox = await harness.getViewbox();
      await viewBox.dispatchEvent('keydown', {key: 'ArrowRight'});
      await viewBox.dispatchEvent('keydown', {key: 'ArrowDown'});
      expect(minimapRenderer.windowPan.emit).toHaveBeenCalledWith({
        x: Math.round(10 / scale),
        y: Math.round(10 / scale),
      });
    });

    describe('Click on minimap', () => {
      it('Inside viewbox', async () => {
        spyOn(minimapRenderer.windowPan, 'emit');
        const viewBox = await harness.getViewbox();
        await viewBox.dispatchEvent('click', {
          offsetX: 100,
          offsetY: 100,
        });
        expect(minimapRenderer.windowPan.emit).not.toHaveBeenCalled();
      });
      describe('Outside viewbox', () => {
        it('Zoom is above 1', async () => {
          minimapRenderer.stateService.zoom.next(1.5);
          spyOn(minimapRenderer.windowPan, 'emit');
          const minimap = await harness.getMinimap();
          await minimap.dispatchEvent('click', {
            offsetX: 100,
            offsetY: 100,
          });
          expect(minimapRenderer.windowPan.emit).toHaveBeenCalledWith({
            x: 1384,
            y: 1698,
          });
        });
        it('Zoom is below 1', async () => {
          minimapRenderer.stateService.zoom.next(0.7);
          spyOn(minimapRenderer.windowPan, 'emit');
          const minimap = await harness.getMinimap();
          await minimap.dispatchEvent('click', {
            offsetX: 100,
            offsetY: 100,
          });
          expect(minimapRenderer.windowPan.emit).toHaveBeenCalledWith({
            x: 349,
            y: 774,
          });
        });
      });
    });
  });
});

@Component({
  template: `
      <div class="container">
        <minimap
          #minimap
          [winWidth]="TEST_WIN_WIDTH"
          [winHeight]="TEST_WIN_HEIGHT"
          [graphWidth]="graphWidth"
          [graphHeight]="graphHeight"
          [groups]="graph.groups"
          [nodes]="graph.nodes"
          [position]="position"
          [x]="x"
          [y]="y"
        />
      </div>`,
  styles: [`
      .container {
        width: 150px;
      }`],
})
class TestComponent {
  @ViewChild('minimap', {static: false}) minimap!: Minimap;

  TEST_WIN_WIDTH = TEST_WIN_WIDTH;
  TEST_WIN_HEIGHT = TEST_WIN_HEIGHT;
  graph!: GraphSpec;
  graphWidth!: number;
  graphHeight!: number;
  position?: MinimapPosition;
  x = 0;
  y = 0;
}
