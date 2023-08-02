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
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, NgModule, OnInit, Optional, Output, TemplateRef} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';

import {AccessibilityHelpCenter} from './a11y/a11y_help_center';
import {ShortcutService} from './a11y/shortcut.service';
import {baseColors, BLUE_THEME, clampVal, createDAGFeatures, DagTheme, DEFAULT_THEME, defaultFeatures, defaultZoomConfig, FeatureToggleOptions, generateTheme, isNoState, RuntimeState, ZoomConfig} from './data_types_internal';
import {fetchIcon, iconForState} from './icon_util';
import {WorkflowGraphIconModule} from './icon_wrapper';
import {DagIconsModule} from './icons_module';
import {DagLogger} from './logger/dag_logger';
import {NgVarModule} from './ng_var_directive';
import {calculateGraphState, CustomNode, DagGroup, DagNode, getNodeType, IconConfig, NodeState} from './node_spec';
import {debounce} from './util_functions';

/**
 * Expose internal Shared Objects
 */
export {
  baseColors,
  BLUE_THEME,
  createDAGFeatures,
  DagTheme,
  DEFAULT_THEME,
  defaultFeatures,
  defaultZoomConfig,
  FeatureToggleOptions,
  generateTheme,
  RuntimeState,
  ZoomConfig,
};

/**
 * Execution step status needed for toolbar state
 */
export interface ExecutionStatus {
  totalSteps: number;
  completedSteps: number;
}

type ToolbarLabels = 'graphState'|'stepsCompleted'|'expansionLabel';

/**
 * A custom generator for labels used in the DAG Toolbar. Can be used in case
 * custom labels are needed for the different segments in the bar
 *
 * If false is returned, then the state cell will be hidden.
 * If other `false`-y value is returned then the default behavior for the label
 * is used
 */
export type DagToolbarLabelGenerator =
    (toolbar: DagToolbar, label: ToolbarLabels) => string|void|undefined|false;

/** Extract execution status from Nodes of the DAG */
export function getRuntimeStateFromNodes(nodes: Array<DagNode|CustomNode>):
    ExecutionStatus {
  let totalSteps = 0;
  let completedSteps = 0;

  for (const node of nodes) {
    if (node instanceof CustomNode && !node.includeInStepCount) continue;
    if (node.type !== 'execution') continue;
    if (node.state === 'SUCCEEDED' || node.state === 'SKIPPED') {
      completedSteps++;
    }
    totalSteps++;
  }
  return {totalSteps, completedSteps};
}

const fakeLabelGenerator: DagToolbarLabelGenerator = (t, label) => {};

const DIALOG_MAX_WIDTH = 600;

/**
 * Renders the workflow DAG.
 */
@Component({
  selector: 'ai-dag-toolbar',
  styleUrls: ['toolbar.scss'],
  templateUrl: 'toolbar.ng.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'class': 'ai-dag-toolbar'},
})
export class DagToolbar implements OnInit {
  graphState: RuntimeState = 'Static';
  disableToggle = true;
  completedSteps: number = 0;
  totalSteps: number = 0;
  finalState?: NodeState;
  icon?: IconConfig;
  zoomIcons = {
    in : {name: 'zoom-in', iconset: 'cloud_ai'} as IconConfig,
    out: {name: 'zoom-out', iconset: 'cloud_ai'} as IconConfig,
    reset: {name: 'zoom-reset', iconset: 'cloud_ai'} as IconConfig,
  };
  fullscreenIcon = {
    open: {name: 'full-screen'} as IconConfig,
    close: {name: 'fullscreen-exit'} as IconConfig
  };
  zoomInDisabled = false;
  zoomOutDisabled = false;
  themeConfig = DEFAULT_THEME;
  $features = defaultFeatures;
  $zoomStepConfig = defaultZoomConfig;

  $nodes: Array<DagNode|CustomNode> = [];
  $groups: DagGroup[] = [];
  private $customToolbarToggleTemplates: TemplateRef<any>[] = [];
  private $rightAlignedCustomToolbarToggleTemplates: TemplateRef<any>[] = [];

  @Input() enableMinimap = true;
  @Output() enableMinimapChange = new EventEmitter();

  @Input() enableFullscreen = false;
  @Output() readonly fullscreenModeChange = new EventEmitter();

  @Input() expanded = false;
  @Output() expandedChange = new EventEmitter();

  @Input() zoom = 1;
  @Output() zoomChange = new EventEmitter();

  @Input('features')
  set features(f: FeatureToggleOptions) {
    this.$features = f;
    this.detectChanges();
  }
  get features() {
    return this.$features;
  }

  @Input('zoomStepConfig')
  set zoomStepConfig(z: ZoomConfig) {
    this.$zoomStepConfig = z;
    this.detectChanges();
  }
  get zoomStepConfig() {
    return this.$zoomStepConfig;
  }

  @Input() labelGenerator = fakeLabelGenerator;
  @Input('theme')
  set theme(theme: DagTheme) {
    this.themeConfig = theme;
    this.icon = iconForState(this.finalState || 'NO_STATE_RUNTIME', theme);
  }
  get theme() {
    return this.themeConfig;
  }

  @Input('nodes')
  set nodes(nodes: Array<DagNode|CustomNode>) {
    this.$nodes = nodes;
    this.calculateStepMetrics();
  }

  @Input('groups')
  set groups(groups: DagGroup[]) {
    this.$groups = groups;
    this.calculateStepMetrics();
  }

  @Input('customToolbarToggleTemplates')
  set customToolbarToggleTemplates(templates: TemplateRef<any>[]) {
    this.$customToolbarToggleTemplates = templates;
    this.cdr.detectChanges();
  }
  get customToolbarToggleTemplates() {
    return this.$customToolbarToggleTemplates;
  }

  @Input('rightAlignedCustomToolbarToggleTemplates')
  set rightAlignedCustomToolbarToggleTemplates(templates: TemplateRef<any>[]) {
    this.$rightAlignedCustomToolbarToggleTemplates = templates;
    this.cdr.detectChanges();
  }
  get rightAlignedCustomToolbarToggleTemplates() {
    return this.$rightAlignedCustomToolbarToggleTemplates;
  }

  constructor(
      private readonly cdr: ChangeDetectorRef,
      private readonly dialog: MatDialog,
      private readonly shortcutService: ShortcutService,
      @Optional() private readonly dagLogger?: DagLogger,
  ) {
    this.calculateStepMetrics = debounce(this.calculateStepMetrics, 50, this);
  }

  ngOnInit() {
    if (this.features.enableShortcuts) {
      this.shortcutService.registerShortcutAction('A11Y_HELP_CENTER', () => {
        this.openA11yHelpCenter();
      });
    }
  }

  detectChanges() {
    this.cdr.detectChanges();
  }

  getAllNodeLikeEntities(group: DagGroup): Array<DagNode|DagGroup> {
    return [
      ...group.nodes,
      ...group.groups,
      ...group.groups.flatMap(g => this.getAllNodeLikeEntities(g)),
    ];
  }

  // This method is debounced by 50ms
  calculateStepMetrics() {
    let graphState: RuntimeState = 'Static';
    let completed = 0;
    let total = 0;
    let disableToggle = true;
    const allNodes = this.getAllNodeLikeEntities({
      nodes: this.$nodes,
      groups: this.$groups,
    } as unknown as DagGroup);

    for (const node of allNodes) {
      if (node instanceof CustomNode && !node.includeInStepCount) continue;
      const {state} = node;
      const type = getNodeType(node);

      if (state !== 'NO_STATE_STATIC') {
        graphState = 'Runtime';
      }
      if (type === 'artifact') {
        disableToggle = false;
        continue;
      }
      if (state === 'NOT_TRIGGERED' || state === 'SUCCEEDED' ||
          state === 'SKIPPED') {
        completed++;
      }
      total++;
    }
    if (graphState !== 'Static') {
      this.finalState = calculateGraphState(this.$nodes, this.$groups);
      if (!isNoState(this.finalState)) {
        this.icon = iconForState(this.finalState, this.theme);
      }
    }

    this.graphState = graphState;
    this.completedSteps = completed;
    this.totalSteps = total;
    this.disableToggle = disableToggle;
    this.detectChanges();
  }

  zoomIn() {
    this.zoomVal += this.zoomStepConfig.step;
    this.dagLogger?.logZoom('in', 'toolbar');
  }

  zoomOut() {
    this.zoomVal -= this.zoomStepConfig.step;
    this.dagLogger?.logZoom('out', 'toolbar');
  }

  zoomReset() {
    this.zoomVal = 1;
    this.dagLogger?.logZoom('reset', 'toolbar');
  }

  set expandedMode(mode: boolean) {
    this.expanded = mode;
    this.expandedChange.emit(mode);
  }
  get expandedMode() {
    return this.expanded;
  }

  toggleMinimapVisibility() {
    this.enableMinimap = !this.enableMinimap;
    this.enableMinimapChange.emit(this.enableMinimap);
  }

  toggleFullscreen() {
    this.fullscreenModeChange.emit();
  }

  openA11yHelpCenter() {
    this.dialog.open(AccessibilityHelpCenter, {
      maxWidth: DIALOG_MAX_WIDTH,
    });
  }

  colorForMinimap(enabled: boolean) {
    return enabled ? baseColors.blue : baseColors.gray;
  }

  set zoomVal(val: number) {
    const {max, min} = this.zoomStepConfig;
    val = this.clampVal(val, min, max);
    if (this.zoom === val) return;
    this.zoom = val;
    this.zoomChange.emit(val);
  }
  get zoomVal() {
    return this.zoom;
  }

  clampVal = clampVal;
  fetchIcon = (icon: IconConfig, key: keyof IconConfig) => fetchIcon(icon, key);

  round = Math.round;
}

@NgModule({
  imports: [
    CommonModule,
    WorkflowGraphIconModule,
    MatSlideToggleModule,
    MatButtonModule,
    FormsModule,
    DagIconsModule,
    NgVarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  declarations: [
    DagToolbar,
  ],
  exports: [
    DagToolbar,
  ],
})
export class DagToolbarModule {
}
