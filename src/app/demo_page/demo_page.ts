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
import {Component, ElementRef, NgModule, TemplateRef, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {baseColors, BLUE_THEME, CLASSIC_THEME, DagreOptions, DagreRankAlignment, DagreRankDirection, DagreRankerAlgorithm, DEFAULT_DAGRE_CONFIG, DEFAULT_THEME, defaultFeatures, defaultZoomConfig, DirectedAcyclicGraphModule, FeatureToggleOptions, generateTheme, MinimapPosition, NodeState, ZoomConfig} from '../directed_acyclic_graph';
import {WorkflowGraphIconModule} from '../icon_wrapper';
import {cloneGraph, DagEdge, DagGroup, DagNode, getNodeType, GraphSpec, MarkerStyle, NodeRef, SelectedNode} from '../node_spec';
import {DagScaffoldModule} from '../scaffold';
import {DagSidebarModule} from '../sidebar';
import {fakeGraph as exampleDagDemo} from '../test_resources/fake_data';
import {DagTheme, DagToolbarModule} from '../toolbar';
import {UserConfig} from '../user_config.service';

import {fakeGraph as artifactInNestedLoopDemo} from './demo_datasets/artifact_in_nested_loop';
import {fakeGraph as expandedGroupDemo} from './demo_datasets/expanded_group';
import {giganticDemo} from './demo_datasets/gigantic_graph';
import {fakeGraph as recursiveGraphDemo} from './demo_datasets/recursive_graph';
import {DagDatasetSettings} from './demo_datasets/shared';
import {fakeGraph as singleNodeDemo} from './demo_datasets/single_node';

interface Options<T> {
  [name: string]: T;
}

const LOCAL_STORAGE_KEY = 'workflow_graph_user_config';

const DEFAULT_DATASET = 'Default Dataset';

const datasets: Options<GraphSpec> = {
  'Default Dataset':
      DagNode.createFromSkeleton(exampleDagDemo.skeleton, exampleDagDemo.state),
  'Single Node':
      DagNode.createFromSkeleton(singleNodeDemo.skeleton, singleNodeDemo.state),
  'Expanded Group label':
      DagNode.createFromSkeleton(expandedGroupDemo.skeleton as any),
  'Recursive Graph': DagNode.createFromSkeleton(
      recursiveGraphDemo.skeleton, recursiveGraphDemo.state),
  'Artifact in nested loop': DagNode.createFromSkeleton(
      artifactInNestedLoopDemo.skeleton, artifactInNestedLoopDemo.state),
  'Gigantic': DagNode.createFromSkeleton(giganticDemo.skeleton),
};

const datasetOptions: Options<DagDatasetSettings> = {
  'Default Dataset': {},
};

const themes: Options<DagTheme> = {
  'Cloud Blue (Default)': DEFAULT_THEME,
  'Cloud Classic': CLASSIC_THEME,
  'Cloud Black': BLUE_THEME,
};

const themeNames = [
  'Cloud Blue (Default)',
  'Cloud Classic',
  'Cloud Black',
];

const edgeStyles = [
  'dagre',
  'snapped',
];

const {
  TOP_TO_BOTTOM,
  BOTTOM_TO_TOP,
  LEFT_TO_RIGHT,
  RIGHT_TO_LEFT,
} = DagreRankDirection;

const rankDirections = [
  ['TOP_TO_BOTTOM', TOP_TO_BOTTOM],
  ['BOTTOM_TO_TOP', BOTTOM_TO_TOP],
  ['LEFT_TO_RIGHT', LEFT_TO_RIGHT],
  ['RIGHT_TO_LEFT', RIGHT_TO_LEFT],
];

const {NONE, UP_LEFT, UP_RIGHT, DOWN_LEFT, DOWN_RIGHT} = DagreRankAlignment;
const rankAlignments = [
  ['NONE', NONE],
  ['UP_LEFT', UP_LEFT],
  ['UP_RIGHT', UP_RIGHT],
  ['DOWN_LEFT', DOWN_LEFT],
  ['DOWN_RIGHT', DOWN_RIGHT],
];

const {NETWORK_SIMPLEX, TIGHT_TREE, LONGEST_PATH} = DagreRankerAlgorithm;
const rankers = [
  ['NETWORK_SIMPLEX', NETWORK_SIMPLEX],
  ['TIGHT_TREE', TIGHT_TREE],
  ['LONGEST_PATH', LONGEST_PATH],
];

const separations = [
  ['1px', 1], ['4px', 4], ['7px', 7], ['15px', 15], ['40px', 40], ['60px', 60],
  ['90px', 90], ['250px', 250]
];

const minZooms =
    [['1%', 0.01], ['5%', 0.05], ['20%', 0.2], ['50%', 0.5], ['100%', 1]];

const maxZooms = [['100%', 1], ['150%', 1.5], ['200%', 2], ['500%', 5]];

const zoomSteps = [['1%', 0.01], ['5%', 0.05], ['10%', 0.1], ['20%', 0.2]];

type StatusIcons = 'Show'|'Hide'|'No Runtime';
interface CustomTheme {
  color: string;
  statusBgTransparent: boolean;
  edgeColor: string;
  execColor: string;
  artifColor: string;
  edgeToMarkerStyle: MarkerStyle;
}

/**
 * Converts a string color to it's proper hex definition
 *
 * We can't just directly use this as baseColors[col] because this file falls
 * under Pantheon's variable re-writing which breaks logic written like that
 */
function translateColor(col: string, isBg = false) {
  switch (col) {
    case 'green':
      return isBg ? baseColors['bg']['green'] : baseColors['green'];
    case 'blue':
      return isBg ? baseColors['bg']['blue'] : baseColors['blue'];
    case 'black':
      return baseColors['black'];
    case 'purple':
      return baseColors['purple'];
    case 'orange':
      return baseColors['orange'];
    case 'yellow':
      return isBg ? baseColors['bg']['yellow'] : baseColors['yellow'];
    case 'none':
      return baseColors['bg']['none'];
    default:
      console['error']('Invalid color to translate', col);
      return 'none';
  }
}

/** Demo component for directed acyclic graph view. */
@Component({
  selector: 'dag-demo-page',
  styleUrls: [
    'demo_page.scss',
  ],
  templateUrl: './demo_page.ng.html',
  encapsulation: ViewEncapsulation.None,
})
export class DagDemoPage {
  @ViewChild('dagRef') dagRef: ElementRef|undefined;

  dagLoading = false;
  enableMinimap = true;
  enableFullscreen = true;
  expandedMode = false;
  optimizeForOrm = false;
  minimapPosition: MinimapPosition = 'top';
  followSelectedNode = false;
  selectedNode: SelectedNode|null = null;
  zoom = 1;
  zoomConfig = {...defaultZoomConfig};
  dagFeatures = {...defaultFeatures};
  dagreOptions = {...DEFAULT_DAGRE_CONFIG};
  defaultIcons = {
    artifact: DEFAULT_THEME.artifactIcon,
    execution: DEFAULT_THEME.executionIcon,
  };
  datasetOptions = datasetOptions;

  // Product related dropdowns
  datasets = datasets;
  datasetNames = Object.keys(datasets);
  datasetName?: keyof typeof datasets;
  currDataset?: GraphSpec;
  statusIcons: StatusIcons = 'Show';
  customArtifactColors = true;

  // Theme related dropdowns
  theme = {...DEFAULT_THEME};
  themeName!: keyof typeof themes;
  selectedThemeName = themeNames[0];
  selectedEdgeStyle: DagTheme['edgeStyle'] = themes[themeNames[0]].edgeStyle;
  currTheme!: DagTheme;
  themes = themes;
  themeNames = themeNames;
  edgeStyles = edgeStyles;
  customTheme: CustomTheme = {
    color: 'green',
    statusBgTransparent: false,
    edgeColor: 'blue',
    execColor: 'blue',
    artifColor: 'orange',
    edgeToMarkerStyle: 'circle',
  };
  rankDirections = rankDirections;
  rankAlignments = rankAlignments;
  rankers = rankers;
  separations = separations;
  minZooms = minZooms;
  maxZooms = maxZooms;
  zoomSteps = zoomSteps;
  userConfig =
      JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || '{}') as
      UserConfig;
  userConfigChange = new Subject<UserConfig>();
  destroy = new Subject<void>();

  constructor(public dialog: MatDialog) {
    this.setCurrDataset(DEFAULT_DATASET, true);
    this.resetAll();
  }

  ngAfterViewInit() {
    interface CustomWindowProps {
      dagRef: ElementRef;
    }
    // Injects a reference to the DAG in Window
    (window as unknown as CustomWindowProps).dagRef = this.dagRef!;

    this.userConfigChange.pipe(takeUntil(this.destroy))
        .subscribe((v: UserConfig) => {
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(v));
        });
  }

  openModal(templateRef: TemplateRef<{}>) {
    this.dialog.open(templateRef, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      hasBackdrop: false
    });
  }

  closeModal() {
    this.dialog.closeAll();
  }

  selectedNodeToRef(): NodeRef|null {
    if (!this.selectedNode) return null;
    const {node: {id}, path} = this.selectedNode;
    return {id, path};
  }

  genDatasetOptions() {
    return Object.fromEntries(Object.keys(this.datasets).map(k => [k, k]));
  }

  genColorOptions(colors: string[]) {
    return Object.fromEntries(colors.map(c => [c, c.toLowerCase()]));
  }

  setDefaultDatasetOptions() {
    const opts = datasetOptions[this.datasetName!];
    if (!opts) return;
    this.resetAll(true);
    if (opts.orientation !== undefined) {
      this.dagreOptions.rankDirection = opts.orientation === 'left-right' ?
          DagreRankDirection.LEFT_TO_RIGHT :
          DagreRankDirection.TOP_TO_BOTTOM;
    }
    if (opts.rankSpacing !== undefined) {
      this.dagreOptions.rankSeparation = opts.rankSpacing;
    }
    if (opts.expandedNodes !== undefined) {
      this.expandedMode = opts.expandedNodes;
    }
    if (opts.edgeStyle !== undefined) {
      this.selectedEdgeStyle = opts.edgeStyle;
    }
    this.dagreOptions = {...this.dagreOptions};
  }

  calibrateNodes(graph: GraphSpec) {
    for (const node of graph.nodes) {
      if (this.statusIcons === 'Hide') {
        node.state = 'NO_STATE_RUNTIME';
      } else if (this.statusIcons === 'No Runtime') {
        node.state = 'NO_STATE_STATIC';
      }
      if (this.customArtifactColors || node.type === 'execution' ||
          !node.icon) {
        continue;
      }
      delete node.icon.color;
    }
    for (const subGroup of graph.groups) {
      if (this.statusIcons === 'Hide') {
        subGroup.state = 'NO_STATE_RUNTIME';
      } else if (this.statusIcons === 'No Runtime') {
        subGroup.state = 'NO_STATE_STATIC';
      }
      this.calibrateNodes(subGroup);
    }
  }

  setCurrDataset(name?: keyof typeof datasets, forceClone = false) {
    if (typeof name === 'undefined') {
      name = this.datasetName;
      forceClone = true;
      if (typeof name === 'undefined') return;
    }
    if (!forceClone && name === this.datasetName) return;
    this.datasetName = name;
    const newGraph = cloneGraph(this.datasets[name]);
    this.calibrateNodes(newGraph);
    this.currDataset = newGraph;
  }

  onDatasetChanged(event: MatSelectChange) {
    this.setCurrDataset(event.value);
  }

  setCurrTheme(forceClone = false) {
    const name = this.selectedThemeName;
    const edgeStyle = this.selectedEdgeStyle;
    if (!forceClone && name === this.themeName) return;
    this.themeName = name;
    if (name !== 'Custom') {
      this.currTheme = {...this.themes[name], edgeStyle};
      return;
    }
    const {
      statusBgTransparent,
      color,
      edgeColor,
      execColor,
      artifColor,
      edgeToMarkerStyle,
    } = this.customTheme;
    const bgColor = statusBgTransparent ? 'none' : color;

    const allStates: NodeState[] = [
      'NO_STATE_STATIC', 'NO_STATE_RUNTIME', 'NOT_TRIGGERED', 'CANCELLED',
      'CANCELLING', 'CANCEL_PENDING', 'FAILED', 'PENDING', 'RUNNING', 'SKIPPED',
      'SUCCEEDED', 'TIMEOUT'
    ];
    const successStates: NodeState[] = ['RUNNING', 'SKIPPED', 'SUCCEEDED'];
    this.currTheme = generateTheme({
      edgeColor: translateColor(edgeColor),
      statusColors: Object.fromEntries([
        ...successStates.map(s => [s, translateColor(color)]),
      ]),
      statusBg: Object.fromEntries([
        ...(statusBgTransparent ? allStates : successStates)
            .map(s => [s, translateColor(bgColor, true)]),
      ]),
      executionIcon:
          {...DEFAULT_THEME.executionIcon, color: translateColor(execColor)},
      artifactIcon:
          {...DEFAULT_THEME.artifactIcon, color: translateColor(artifColor)},
      edgeStyle,
      edgeToMarkerStyle,
    });
  }

  setZoomOption(f: keyof ZoomConfig, val: number) {
    this.zoomConfig = {
      ...this.zoomConfig,
      [f]: val,
    };
  }

  setMinimapPosition(position: string) {
    this.minimapPosition = position as MinimapPosition;
  }

  setDagFeature(f: keyof FeatureToggleOptions, val: boolean) {
    // This form of rudimentary checking is required due to property renaming
    // being turned on in the UI
    const feat = this.dagFeatures = {...this.dagFeatures};
    switch (f) {
      case 'scrollToZoom':
        return feat.scrollToZoom = val;
      case 'zoomControls':
        return feat.zoomControls = val;
      case 'disableZoomPercentageLabel':
        return feat.disableZoomPercentageLabel = val;
      case 'collapsibleNodes':
        return feat.collapsibleNodes = val;
      case 'minimapToolbarToggle':
        return feat.minimapToolbarToggle = val;
      case 'minimapHoverAnimations':
        return feat.minimapHoverAnimations = val;
      case 'selectedArtifactsAreExpanded':
        return feat.selectedArtifactsAreExpanded = val;
      case 'seeThroughMinimapOnPan':
        return feat.seeThroughMinimapOnPan = val;
      case 'debugPanningLayer':
        return feat.debugPanningLayer = val;
      case 'fullscreenToggle':
        return feat.fullscreenToggle = val;
      case 'enableShortcuts':
        return feat.enableShortcuts = val;
      default:
        throw new Error(`unexpected value ${f}!`);
    }
  }
  setDagreOption(f: keyof DagreOptions, val: DagreOptions[typeof f]) {
    // This form of rudimentary checking is required due to property renaming
    // being turned on in the UI
    const feat = this.dagreOptions = {...this.dagreOptions};
    switch (f) {
      case 'rankDirection':
        return feat.rankDirection = val as typeof feat['rankDirection'];
      case 'rankAlignment':
        return feat.rankAlignment = val as typeof feat['rankAlignment'];
      case 'ranker':
        return feat.ranker = val as typeof feat['ranker'];
      case 'edgeSeparation':
        return feat.edgeSeparation = val as typeof feat['edgeSeparation'];
      case 'rankSeparation':
        return feat.rankSeparation = val as typeof feat['rankSeparation'];
      case 'nodeSeparation':
        return feat.nodeSeparation = val as typeof feat['nodeSeparation'];
      default:
        throw new Error(`unexpected value ${f}!`);
    }
  }
  getMarkerStyles() {
    return Object.fromEntries([
      ['Circle', 'circle'],
      ['Arrow', 'arrow'],
    ]);
  }
  genNumOptions(
      arr: Array<number|undefined>, suffix = '%',
      valueConversionFn = (val: number) => val / 100) {
    const uniq = Array.from(new Set(arr))
                     .filter(i => typeof i !== 'undefined')
                     .sort((a, b) => a! - b!);
    return Object.fromEntries(uniq.map(
        val => [`${val}${suffix}`, valueConversionFn(val!)],
        ));
  }
  addNode(parent: SelectedNode|null, type: DagNode['type']) {
    if (!this.dagRef || !this.currDataset) return;
    let group: GraphSpec = this.currDataset;
    if (parent) {
      group = DagGroup.navigatePath(group, parent.path);
    }
    const nodeIds = new Set(group.nodes.map(node => node.id));
    let newId = '';
    do {
      newId = `${type.slice(0, 1)}${Math.round(Math.random() * 1000)}`;
    } while (!newId || nodeIds.has(newId));
    const newNode = new DagNode(newId, type);
    group.nodes = [...group.nodes, newNode];
    // When nothing is selected
    const fallbackNode =
        group.nodes.filter(n => n.type === 'execution' && n !== newNode)
            .slice(-1)[0] ||
        group.nodes.filter(n => n.type === 'artifact' && n !== newNode)
            .slice(-1)[0];
    if (!parent && !fallbackNode) return;
    const newEdge: DagEdge = {
      from: parent ? parent.node.id : fallbackNode.id,
      to: newNode.id,
    };
    group.edges = [...group.edges, newEdge];
    this.currDataset.groups = [...this.currDataset.groups];
  }
  resetGraph() {
    this.setCurrDataset(this.datasetName!, true);
  }
  resetAll(skipDataReset = false) {
    this.zoomConfig = {...defaultZoomConfig};
    this.dagFeatures = {...defaultFeatures};
    this.dagreOptions = {...DEFAULT_DAGRE_CONFIG};
    this.enableMinimap = true;
    this.minimapPosition = 'top';
    this.expandedMode = false;
    this.customArtifactColors = true;
    this.enableFullscreen = true;
    this.statusIcons = 'Show';
    this.selectedEdgeStyle = 'dagre';
    this.selectedThemeName = 'Cloud Blue (Default)';
    this.setCurrTheme(true);
    skipDataReset || this.resetGraph();
  }
  getNodeType = getNodeType;

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }
}

@NgModule({
  declarations: [
    DagDemoPage,
  ],
  exports: [
    DagDemoPage,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    DagScaffoldModule,
    DagToolbarModule,
    MatSelectModule,
    WorkflowGraphIconModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatButtonModule,
    DagSidebarModule,
    MatDividerModule,
    DirectedAcyclicGraphModule,
    NoopAnimationsModule,
  ],
})
export class DagModePageModule {
}
