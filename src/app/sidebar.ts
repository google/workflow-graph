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

import {Component, Input, NgModule} from '@angular/core';

import {MinimapPosition} from './data_types_internal';

/**
 * Expose internal Shared Objects
 */
export {type MinimapPosition};

/**
 * Renders a container for content to float over the DAG.
 *
 * NOTE: The sidebar is aligned to the right of the DAG. If using the mini-map,
 * set `minimapPosition` to `'bottom'` to avoid overlapping content.
 */
@Component({
  standalone: false,
  selector: 'ai-dag-sidebar',
  styleUrls: ['sidebar.scss'],
  templateUrl: 'sidebar.ng.html',
  host: {
    '[class.ui-disabled]': 'disableMouseInteractions',
  },
})
export class DagSidebar {
  private $disableMouseInteractions = false;

  @Input()
  set disableMouseInteractions(interact: boolean) {
    this.$disableMouseInteractions = interact;
  }
  get disableMouseInteractions() {
    return this.$disableMouseInteractions;
  }
}

@NgModule({
  declarations: [
    DagSidebar,
  ],
  exports: [
    DagSidebar,
  ],
})
export class DagSidebarModule {
}
