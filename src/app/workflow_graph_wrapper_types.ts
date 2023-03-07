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

import {LayoutOptions, Logger} from './data_types_internal';
import {DagEdge, DagNodeSkeleton, NodeRef, StateTable} from './node_spec';

/**
 * Wrapper type for a DAG specification.
 */
export interface DagSpec {
  skeleton: DagNodeSkeleton[];
  meta?: StateTable;
}

/**
 * Interface for the inputs and outputs of the WebComponent wrapper of the
 * Workflow Graph.
 */
export interface WorkflowGraphProps {
  enableToolbar: boolean;
  enableMinimap: boolean;
  expandedMode: boolean;
  loading: boolean;
  optimizeForOrm: boolean;
  dagSpec: DagSpec;
  selectedNode: NodeRef|null;
  followNode: NodeRef|null;
  hoveredEdge?: DagEdge;
  layout?: LayoutOptions;
  logger?: Logger;
  zoom: number;
}