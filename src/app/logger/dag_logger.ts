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

import {Injectable, NgModule} from '@angular/core';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import {LogEvent, Logger} from '../data_types_internal';


/**
 * A logger used to send logging events for DAG component. Logger should
 * be provided at component level since it's not stateless.
 */
@Injectable()  // pantheon-disable-check: Component level injectable.
export class DagLogger {
  private readonly logEventSubject = new Subject<LogEvent>();
  private isLoggingSessionActive = false;

  private logger?: Logger;

  constructor() {
    this.logEventSubject.pipe(debounceTime(2000)).subscribe(event => {
      this.logEvent(event);
    });
  }

  // Log event with a debounce of 200ms. When logging mouse event triggered
  // actions. Use this method to prevent event getting logged too often.
  private debounceLogEvent(event: LogEvent) {
    this.logEventSubject.next(event);
  }

  // Log the event. Auto populate component name and product name.
  protected logEvent(event: LogEvent) {
    if (this.isLoggingSessionActive) {
      this.logger?.logEvent({
        ...event,
        metadata: {
          ...event.metadata,
        },
      });
    }
  }

  private initStartMs = 0;
  // This method should be called first. The component name will be saved for
  // later logged events.
  setLogger(logger: Logger) {
    this.logger = logger;
    this.initStartMs = Date.now();

    this.isLoggingSessionActive = true;

    this.logEvent({
      name: 'start_component_init',
      metadata: {
        'startedAt': `${performance.now()}`,
      },
    });
  }

  logEndInit() {
    this.logEvent({
      name: 'end_component_init',
      metadata: {'timeSpent': Date.now() - this.initStartMs}
    });
  }

  logZoom(
      zoomOption: 'in'|'out'|'reset',
      triggeredBy: 'wheel'|'toolbar'|'keyboard') {
    let action = '';
    switch (zoomOption) {
      case 'in':
        action = 'zoom_in';
        break;
      case 'out':
        action = 'zoom_out';
        break;
      default:
        action = 'zoom_reset';
    }
    if (triggeredBy === 'wheel') {
      this.debounceLogEvent({
        name: action,
        metadata: {
          'triggeredBy': triggeredBy,
        }
      });
    } else {
      this.logEvent({
        name: action,
        metadata: {
          'triggeredBy': triggeredBy,
        }
      });
    }
  }

  logPanning(
      triggeredBy: 'drag_graph'|'drag_minimap'|'click_minimap',
      zoomLevel: number, centerX: number, centerY: number) {
    this.debounceLogEvent({
      name: 'pan',
      metadata: {
        'triggeredBy': triggeredBy,
        'zoomLevel': zoomLevel,
        'centerX': centerX,
        'centerY': centerY,
      },
    });
  }
}

@NgModule({
  imports: [],
  providers: [],
})
export class DagLoggerModule {
}
