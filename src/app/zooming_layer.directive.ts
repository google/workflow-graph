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

import {Directive, ElementRef, EventEmitter, HostListener, Input, NgModule, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {distinctUntilChanged, pairwise, takeUntil} from 'rxjs/operators';

import {DagStateService} from './dag-state.service';
import {clampVal, createDefaultZoomConfig, defaultFeatures, defaultZoomConfig, SCROLL_STEP_PER_DELTA, type ZoomConfig} from './data_types_internal';
import {Point} from './node_spec';
import {type ResizeEventData} from './resize_monitor_directive';
import {isPinch} from './util_functions';

/**
 * Directive to control zooming functionalities for the ai-dag-renderer
 * component (e.g. scroll to zoom)
 */
@Directive({
  standalone: true,
  selector: '[zoomingLayer]',
})
export class ZoomingLayer implements OnInit, OnDestroy {
  destroy = new Subject<void>();
  cursorPosition?: Point;
  zoomStepConfig = createDefaultZoomConfig({step: defaultZoomConfig.step / 2});

  @Input() features = defaultFeatures;

  @Input('zoomStepConfig')
  set onZoomConfigSet(z: ZoomConfig|undefined) {
    if (z) this.zoomStepConfig = z;
  }


  @Input() lastResizeEv: ResizeEventData = {width: 0, height: 0};

  @Input() graphX = 0;
  @Input() graphY = 0;

  @Output() freeWindowPan = new EventEmitter<Point>();
  @Output() windowPan = new EventEmitter<Point>();
  @Output() handleResizeSync = new EventEmitter();
  @Output() zoomChange = new EventEmitter();

  @HostListener('wheel', ['$event'])
  scrollZoom($e: WheelEvent) {
    $e.preventDefault();

    const {naturalScrolling, scrollToZoom} = this.features;
    if (scrollToZoom || (naturalScrolling && isPinch($e))) {
      this.zoomOnWheel($e);
    } else if (naturalScrolling) {
      this.panOnWheel($e);
    }
  }

  @HostListener('click', ['$event'])
  middleClickResetZoom($e: MouseEvent) {
    // From:
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#Return_value
    if (!$e || ($e.button !== 1)) return;
    this.resetZoom($e);
  }

  @HostListener('dblclick', ['$event'])
  dblClickResetZoom($e: MouseEvent) {
    this.resetZoom($e);
  }

  constructor(
      private readonly dagWrapper: ElementRef,
      readonly stateService: DagStateService,
  ) {}

  ngOnInit() {
    this.stateService.zoomReset.pipe(takeUntil(this.destroy))
        .subscribe(() => this.resetZoom());

    this.stateService.zoom
        .pipe(
            takeUntil(this.destroy),
            distinctUntilChanged(),
            pairwise(),
            )
        .subscribe(([prev, value]) => {
          this.panAfterZoom(prev, value);
          this.zoomChange.emit(value);
        });
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  /**
   * Sets zoom value to 100%
   *
   * If `$e` is provided the default action is disabled along with bubbling
   * Also resetting the panning position, so we rule out the possibility to zoom
   * to an empty place on the edge.
   */
  resetZoom($e?: MouseEvent) {
    if ($e) {
      $e.preventDefault();
      $e.stopPropagation();
    }
    this.stateService.zoom.next(1);
    // Safe resetting the pan position
    this.windowPan.emit({x: -this.graphX, y: -this.graphY});
  }

  private panOnWheel($e: WheelEvent) {
    this.windowPan.emit({
      x: $e.deltaX - this.graphX,
      y: $e.deltaY - this.graphY,
    });
  }

  private zoomOnWheel($e: WheelEvent) {
    const {min, max} = this.zoomStepConfig;
    const invSign = $e.deltaY > 0 ? -1 : 1;
    let newZoom = this.stateService.zoom.value +
        invSign *
            Math.min(
                SCROLL_STEP_PER_DELTA * Math.abs($e.deltaY),
                this.zoomStepConfig.step);
    newZoom = clampVal(newZoom, min, max);

    const container = this.dagWrapper.nativeElement.getBoundingClientRect();

    // storing the pointer's position at the time of the event. This is then
    // used in the panning position formula (panAfterZoom method)
    this.cursorPosition = {
      x: ($e.x - container.left) / this.lastResizeEv.width,
      y: ($e.y - container.top) / this.lastResizeEv.height,
    };
    this.stateService.zoom.next(newZoom);
    this.cursorPosition = undefined;
  }

  private panAfterZoom(prevZoom: number, newZoom: number) {
    // Previous top-left position converted into the new zoom level.
    const position = {
      x: -this.graphX / prevZoom * newZoom,
      y: -this.graphY / prevZoom * newZoom
    };

    // Taking the difference between the viewport under the old and new zoom,
    // then multiplying with the relative position of the cursor.
    const diffX = (newZoom - prevZoom) * this.lastResizeEv.width / prevZoom;
    const diffY = (newZoom - prevZoom) * this.lastResizeEv.height / prevZoom;

    // distort with the relative place of the cursor within the viewport at the
    // time of zoom. if not available, using the center
    position.x += (this.cursorPosition?.x || 0.5) * diffX;
    position.y += (this.cursorPosition?.y || 0.5) * diffY;

    this.freeWindowPan.emit(position);
  }
}