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

import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {Component, EventEmitter, Input, NgModule, Output, ViewChild, ViewEncapsulation} from '@angular/core';

import {DagreOptions, DirectedAcyclicGraph, DirectedAcyclicGraphModule} from './directed_acyclic_graph';
import {Logger} from './logger/dag_logger';
import {DagEdge, DagNode, DagNodeSkeleton, GraphSpec, NodeRef, SelectedNode, StateTable} from './node_spec';
import {DagScaffoldModule} from './scaffold';
import {DagToolbarModule} from './toolbar';

declare interface DagSpec {
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
  layout?: DagreOptions;
  logger?: Logger;
  zoom: number;
}

/**
 * Wrapper for DirectedAcyclicGraph.
 */
@Component({
  selector: 'workflow-graph',
  encapsulation: ViewEncapsulation.None,
  template: `
<ai-dag-scaffold>
    <ai-dag-toolbar
      [nodes]="graphSpec.nodes"
      [(expanded)]="expandedMode"
      [(enableMinimap)]="enableMinimap"
      [(zoom)]="zoom"
      *ngIf="enableToolbar"
    >
    </ai-dag-toolbar>
    <ai-dag-renderer
      [enableMinimap]="enableMinimap"
      [loading]="loading"
      [nodes]="graphSpec.nodes"
      [groups]="graphSpec.groups"
      [optimizeForOrm]="optimizeForOrm"
      [edges]="graphSpec.edges"
      [followNode]="followNode"
      [layout]="layout"
      [hoveredEdge]="hoveredEdge"
      [logger]="logger"
      [collapsedArtifacts]="!expandedMode"
      (selectedNodeChange)="selectedNodeChange.emit($event)"
      [(zoom)]="zoom"
    ></ai-dag-renderer>
  </ai-dag-scaffold>
`
})
export class WorkflowGraphWrapper implements WorkflowGraphProps {
  graphSpec: GraphSpec = {
    nodes: [],
    edges: [],
    groups: [],
  };
  @Input() enableToolbar = true;
  @Input() enableMinimap = true;
  @Input() expandedMode = false;
  @Input() loading = false;
  @Input() optimizeForOrm = false;
  @Input()
  set dagSpec(value: DagSpec) {
    this.graphSpec =
        DagNode.createFromSkeleton(value.skeleton, value.meta || {});
  }
  @Input()
  set selectedNode(node: NodeRef|null) {
    const resolvedNode = node && {
      node: this.graph.resolveReference(node),
      path: node.path,
    };
    this.graph.selectedNode = resolvedNode;
  }
  @Input() followNode: NodeRef|null = null;
  @Input() hoveredEdge?: DagEdge;
  @Input() layout?: DagreOptions;
  @Input() logger?: Logger;
  @Input() zoom: number = 1;
  @Output() readonly selectedNodeChange = new EventEmitter<SelectedNode|null>();

  @ViewChild(DirectedAcyclicGraph, {static: true}) graph!: DirectedAcyclicGraph;
}

@NgModule({
  declarations: [
    WorkflowGraphWrapper,
  ],
  exports: [
    WorkflowGraphWrapper,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    DagScaffoldModule,
    DagToolbarModule,
    DirectedAcyclicGraphModule,
  ],
})
export class WorkflowGraphWrapperModule {
}