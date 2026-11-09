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
import {Component, EventEmitter, Input, NgModule, Output, ViewChild, ChangeDetectionStrategy} from '@angular/core';

import {defaultFeatures, type FeatureToggleOptions, type Logger} from './data_types_internal';
import {type DagreOptions, DirectedAcyclicGraph, DirectedAcyclicGraphModule, type MinimapPosition} from './directed_acyclic_graph';
import {type DagEdge, DagNode, GraphSpec, type NodeRef, SelectedNode} from './node_spec';
import {DagScaffoldModule} from './scaffold';
import {DagToolbarModule} from './toolbar';
import {type UserConfig} from './user_config.service';
import {type DagSpec, WorkflowGraphProps} from './workflow_graph_wrapper_types';

/**
 * Wrapper for DirectedAcyclicGraph.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,standalone: false,
  selector: 'workflow-graph',
  template: `
  <ai-dag-scaffold [features]="features" [userConfig]="userConfig" (userConfigChange)="userConfigChange.next($event)">
    <ai-dag-toolbar
      [nodes]="graphSpec.nodes"
      [(expanded)]="expandedMode"
      [(enableMinimap)]="enableMinimap"
      [features]="features"
      *ngIf="enableToolbar"
    >
    </ai-dag-toolbar>
    <ai-dag-renderer
      [enableMinimap]="enableMinimap"
      [minimapPosition]="minimapPosition"
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
  private $enableToolbar = true;
  private $enableMinimap = true;
  private $features: FeatureToggleOptions = defaultFeatures;
  private $expandedMode = false;
  private $loading = false;
  private $optimizeForOrm = false;
  private $minimapPosition: MinimapPosition = 'top';
  private $zoom = 1;

  @Input()
  set enableToolbar(value: boolean) {
    this.$enableToolbar = value ?? true;
  }
  get enableToolbar(): boolean {
    return this.$enableToolbar;
  }

  @Input()
  set enableMinimap(value: boolean) {
    this.$enableMinimap = value ?? true;
  }
  get enableMinimap(): boolean {
    return this.$enableMinimap;
  }

  @Input()
  set features(value: FeatureToggleOptions) {
    this.$features = value ?? defaultFeatures;
  }
  get features(): FeatureToggleOptions {
    return this.$features;
  }

  @Input()
  set expandedMode(value: boolean) {
    this.$expandedMode = value ?? false;
  }
  get expandedMode(): boolean {
    return this.$expandedMode;
  }

  @Input()
  set loading(value: boolean) {
    this.$loading = value ?? false;
  }
  get loading(): boolean {
    return this.$loading;
  }

  @Input()
  set optimizeForOrm(value: boolean) {
    this.$optimizeForOrm = value ?? false;
  }
  get optimizeForOrm(): boolean {
    return this.$optimizeForOrm;
  }

  @Input()
  set dagSpec(value: DagSpec) {
    if (!value) return;
    this.graphSpec =
        DagNode.createFromSkeleton(value.skeleton, value.meta || {});
  }
  @Input()
  set selectedNode(node: NodeRef|null) {
    if (!this.graph) return;
    const resolvedNode = node && this.graph.resolveReference(node);

    if (resolvedNode) {
      this.graph.selectedNode = {
        node: resolvedNode,
        path: node.path,
      };
    } else {
      this.graph.selectedNode = null;
    }
  }
  @Input() followNode: NodeRef|null = null;
  @Input() hoveredEdge?: DagEdge;
  @Input() layout?: DagreOptions;
  @Input() logger?: Logger;
  @Input()
  set minimapPosition(value: MinimapPosition) {
    this.$minimapPosition = value ?? 'top';
  }
  get minimapPosition(): MinimapPosition {
    return this.$minimapPosition;
  }
  @Input()
  set zoom(value: number) {
    this.$zoom = value ?? 1;
  }
  get zoom(): number {
    return this.$zoom;
  }
  @Input() userConfig?: UserConfig;
  @Output() readonly userConfigChange = new EventEmitter<UserConfig>();

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