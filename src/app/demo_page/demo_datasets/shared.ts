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

/**
 * @fileoverview Shared interfaces and methods for dataset construction for the
 * DAG Demo application
 */

import {DagSkeleton, repeatedMetaNodes} from '../../node_spec';

/**
 * The common settings understood by the DAG DEMO Page. These settings are
 * purposefully different and incomplete so that as datasets require more config
 * to be configurable, this can be a place for that to be updated
 *
 * This is required so that the UI can accurately reflect the settings in the
 * existing options and toggles available in the side-panel
 */
export interface DagDatasetSettings {
  orientation?: 'top-bottom'|'left-right';
  expandedNodes?: boolean;
  rankSpacing?: number;
  edgeStyle?: 'dagre'|'snapped';
}


export {repeatedMetaNodes as repeatedNodes, type DagSkeleton as GraphSkeleton};