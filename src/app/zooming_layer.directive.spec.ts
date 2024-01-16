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
import {By} from '@angular/platform-browser';

import {STATE_SERVICE_PROVIDER} from './dag-state.service.provider';
import {createDAGFeatures, createDefaultZoomConfig, defaultFeatures, defaultZoomConfig, FeatureToggleOptions, ZoomConfig} from './data_types_internal';
import {initTestBed} from './test_resources/test_utils';
import {ZoomingLayer} from './zooming_layer.directive';

describe('ZoomingLayer', () => {
  let fixture: ComponentFixture<TestComponent>;
  let element: HTMLElement;
  let directive: ZoomingLayer;

  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [ZoomingLayer],
      providers: [STATE_SERVICE_PROVIDER],
    });
  }));

  beforeEach(waitForAsync(async () => {
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    element = fixture.debugElement.children[0].nativeElement;
    directive = fixture.debugElement.children[0].injector.get(ZoomingLayer)
  }));

  afterEach(fakeAsync(() => {
    fixture.destroy();
  }));

  describe('Initialization', () => {
    it('Default zoom is 1', async () => {
      expect(directive.stateService.zoom.value).toBe(1);
    });
  });

  describe('Scroll zoom', () => {
    it('Nothing happens if disabled', async () => {
      fixture.componentInstance.features.scrollToZoom = false;
      element.dispatchEvent(new WheelEvent('wheel', {deltaY: -5}));
      expect(directive.stateService.zoom.value).toBe(1);
      fixture.componentInstance.features.scrollToZoom = true;
    });

    it('Negative delta', async () => {
      element.dispatchEvent(new WheelEvent('wheel', {deltaY: -1}));
      expect(directive.stateService.zoom.value).toBe(1.02);
    });

    it('Positive delta', async () => {
      element.dispatchEvent(new WheelEvent('wheel', {deltaY: 1}));
      expect(directive.stateService.zoom.value).toBe(0.98);
    });

    it('Not zooming above allowed maximum', async () => {
      fixture.componentInstance.zoomStepConfig.max = 1.05;
      element.dispatchEvent(new WheelEvent('wheel', {deltaY: -10}));
      expect(directive.stateService.zoom.value).toBe(1.05);
    });

    it('Not zooming below allowed minimum', async () => {
      fixture.componentInstance.zoomStepConfig.min = 0.95;
      element.dispatchEvent(new WheelEvent('wheel', {deltaY: 10}));
      expect(directive.stateService.zoom.value).toBe(0.95);
    });

    it('Zoom change is maximised per wheel event (specified in zoomStepConfig.step)',
       async () => {
         element.dispatchEvent(new WheelEvent('wheel', {deltaY: -2000}));
         expect(directive.stateService.zoom.value).toBe(1.1);
       });

    it('Panning the graph on zoom, based on the events position (zoom in)',
       async () => {
         spyOn(directive.freeWindowPan, 'emit');
         element.dispatchEvent(new WheelEvent('wheel', {
           deltaY: -5,
           clientX: element.getBoundingClientRect().x + 100,
           clientY: element.getBoundingClientRect().y + 200,
         }));
         expect(directive.freeWindowPan.emit).toHaveBeenCalledWith({
           x: 120.00000000000003,
           y: 75.00000000000003,
         });
       });

    it('Panning the graph on zoom, based on the events position (zoom out)',
       async () => {
         spyOn(directive.freeWindowPan, 'emit');
         element.dispatchEvent(new WheelEvent('wheel', {
           deltaY: 5,
           clientX: element.getBoundingClientRect().x + 100,
           clientY: element.getBoundingClientRect().y + 200,
         }));
         expect(directive.freeWindowPan.emit).toHaveBeenCalledWith({
           x: 80,
           y: 25.000000000000004,
         });
       });
  });

  describe('On zoom change (from external source, via stateService)', () => {
    it('Calling zoomChange eventemitter', async () => {
      spyOn(directive.zoomChange, 'emit');
      directive.stateService.zoom.next(1.8);
      expect(directive.zoomChange.emit).toHaveBeenCalledWith(1.8);
    });
    it('Panning to keep view centered (zoom in)', async () => {
      spyOn(directive.freeWindowPan, 'emit');
      directive.stateService.zoom.next(1.8);
      expect(directive.freeWindowPan.emit)
          .toHaveBeenCalledWith({x: 580, y: 370});
    });
    it('Panning to keep view centered (zoom out)', async () => {
      spyOn(directive.freeWindowPan, 'emit');
      directive.stateService.zoom.next(0.4);
      expect(directive.freeWindowPan.emit)
          .toHaveBeenCalledWith({x: -260, y: -190});
    });
  });

  describe('Reset zoom', () => {
    it('By double click', async () => {
      directive.stateService.zoom.next(1.8);
      element.dispatchEvent(new MouseEvent('dblclick'));
      expect(directive.stateService.zoom.value).toBe(1);
    });
    it('By middle click', async () => {
      directive.stateService.zoom.next(1.8);
      element.dispatchEvent(new MouseEvent('click', {button: 1}));
      expect(directive.stateService.zoom.value).toBe(1);
    });
    it('By state service event', async () => {
      directive.stateService.zoom.next(1.8);
      directive.stateService.zoomReset.next();
      expect(directive.stateService.zoom.value).toBe(1);
    });
  });

  describe('Natural scrolling', () => {
    beforeEach(() => {
      fixture.componentInstance.features.scrollToZoom = false;
      fixture.componentInstance.features.naturalScrolling = true;
      spyOn(directive.windowPan, 'emit').and.callThrough();
    });

    describe('events w/ modifier', () => {
      it('Nothing happens if disabled', async () => {
        fixture.componentInstance.features.naturalScrolling = false;
        element.dispatchEvent(new WheelEvent('wheel', {deltaY: -5}));
        expect(directive.stateService.zoom.value).toBe(1);
        fixture.componentInstance.features.scrollToZoom = true;
        expect(directive.windowPan.emit).not.toHaveBeenCalled();
      });

      it('Scrolls up', async () => {
        element.dispatchEvent(new WheelEvent('wheel', {deltaY: -7}));
        expect(directive.stateService.zoom.value).toBe(1);
        expect(directive.windowPan.emit).toHaveBeenCalledWith({x: 100, y: 43});
      });

      it('Scrolls down', async () => {
        element.dispatchEvent(new WheelEvent('wheel', {deltaY: 5}));
        expect(directive.stateService.zoom.value).toBe(1);
        expect(directive.windowPan.emit).toHaveBeenCalledWith({x: 100, y: 55});
      });

      it('Scrolls left', async () => {
        element.dispatchEvent(new WheelEvent('wheel', {deltaX: -10}));
        expect(directive.stateService.zoom.value).toBe(1);
        expect(directive.windowPan.emit).toHaveBeenCalledWith({x: 90, y: 50});
      });

      it('Scrolls right', async () => {
        element.dispatchEvent(new WheelEvent('wheel', {deltaX: 11}));
        expect(directive.stateService.zoom.value).toBe(1);
        expect(directive.windowPan.emit).toHaveBeenCalledWith({x: 111, y: 50});
      });

      it('Scrolls up and left', async () => {
        element.dispatchEvent(
            new WheelEvent('wheel', {deltaX: -11, deltaY: -7}));
        expect(directive.stateService.zoom.value).toBe(1);
        expect(directive.windowPan.emit).toHaveBeenCalledWith({x: 89, y: 43});
      });

      it('Scrolls up and right', async () => {
        element.dispatchEvent(new WheelEvent('wheel', {deltaX: 2, deltaY: -7}));
        expect(directive.stateService.zoom.value).toBe(1);
        expect(directive.windowPan.emit).toHaveBeenCalledWith({x: 102, y: 43});
      });

      it('Scrolls down and right', async () => {
        element.dispatchEvent(new WheelEvent('wheel', {deltaX: 2, deltaY: 17}));
        expect(directive.stateService.zoom.value).toBe(1);
        expect(directive.windowPan.emit).toHaveBeenCalledWith({x: 102, y: 67});
      });

      it('Scrolls down and left', async () => {
        element.dispatchEvent(
            new WheelEvent('wheel', {deltaX: -3, deltaY: 17}));
        expect(directive.stateService.zoom.value).toBe(1);
        expect(directive.windowPan.emit).toHaveBeenCalledWith({x: 97, y: 67});
      });
    });
  });
});

@Component({
  template: `
      <div
        zoomingLayer
        [lastResizeEv]="lastResizeEv"
        [features]="features"
        [zoomStepConfig]="zoomStepConfig"
        [graphX]="-100"
        [graphY]="-50"
        class="container"
      ></div>`,
  styles: [`
      .container {
        width: 1000px;
        height: 700px;
        box-sizing: border-box;
      }`],
})
class TestComponent {
  lastResizeEv = {width: 1000, height: 700};
  features = createDAGFeatures({});
  zoomStepConfig = createDefaultZoomConfig({});
}
