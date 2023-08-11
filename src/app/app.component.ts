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

import {Component, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DEFAULT_LAYOUT_OPTIONS, defaultFeatures} from './data_types_internal';
import {fakeGraph} from './test_resources/fake_data';
import {UserConfig} from './user_config.service';

const LOCAL_STORAGE_KEY = 'workflow_graph_user_config';

@Component({
  selector: 'app-root',
  template: `
  <workflow-graph
    [features]="features"
    [enableMinimap]="enableMinimap"
    [loading]="loading"
    [dagSpec]="dagSpec"
    [optimizeForOrm]="optimizeForOrm"
    [followNode]="followNode"
    [layout]="layout"
    [hoveredEdge]="hoveredEdge"
    (selectedNodeChange)="selectedNodeChange.next($event)"
    [userConfig]="userConfig"
    (userConfigChange)="userConfigChange.next($event)"
    (zoomChange)="zoomChange.next($event)"
    />
`,
})
export class AppComponent implements OnDestroy {
  destroy = new Subject<void>();
  enableMinimap = true;
  loading = false;
  dagSpec = {skeleton: fakeGraph.skeleton, meta: fakeGraph.state};
  optimizeForOrm = false;
  followNode = null;
  layout = DEFAULT_LAYOUT_OPTIONS;
  hoveredEdge = undefined;
  userConfig =
      JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}') as UserConfig;
  userConfigChange = new Subject<UserConfig>();
  selectedNodeChange = new Subject();
  zoomChange = new Subject();
  features = {...defaultFeatures, enableShortcuts: true};

  constructor() {
    this.userConfigChange.pipe(takeUntil(this.destroy))
        .subscribe((v: UserConfig) => {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(v));
        });
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }
}
