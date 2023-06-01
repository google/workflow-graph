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

import {AfterViewInit, Directive, ElementRef, EventEmitter, NgModule, NgZone, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil, tap} from 'rxjs/operators';

/** Data sent with each resize event */
export interface ResizeEventData {
  width: number;
  height: number;
}

const RESIZE_DEBOUNCE_TIME_MS = 85;

/**
 * Simple directive that attaches a ResizeObserver on the given element and
 * notifies listeners on resize events.
 */
@Directive({selector: '[monitorResize]'})
export class ResizeMonitorDirective implements OnDestroy, AfterViewInit,
                                               OnInit {
  @Output() readonly resize = new EventEmitter<ResizeEventData>();

  private readonly onResize = new Subject<ResizeEventData>();
  private readonly destroyed = new Subject<void>();

  private readonly resizeObserver?: ResizeObserver;

  constructor(
      private readonly elementRef: ElementRef,
      private readonly ngZone: NgZone,
  ) {
    this.resizeObserver = new ResizeObserver(entries => {
      this.ngZone.run(() => {
        const entry = entries[0];
        if (entry?.contentRect) {
          this.onResize.next({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      });
    });
  }

  ngOnInit() {
    this.onResize
        .pipe(
            debounceTime(RESIZE_DEBOUNCE_TIME_MS),
            tap((data) => {
              this.resize.emit(data);
            }),
            takeUntil(this.destroyed),
            )
        .subscribe();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.resize.emit({
        height: this.elementRef.nativeElement.offsetHeight,
        width: this.elementRef.nativeElement.offsetWidth,
      });
    }, 300);

    this.resizeObserver?.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.unobserve(this.elementRef.nativeElement);
    this.destroyed.next();
    this.destroyed.complete();
  }
}

@NgModule({
  declarations: [
    ResizeMonitorDirective,
  ],
  exports: [
    ResizeMonitorDirective,
  ],
})
export class ResizeMonitorModule {
}