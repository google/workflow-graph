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

import {DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, EventEmitter, Input, KeyValueDiffer, KeyValueDiffers, NgModule, OnDestroy, OnInit, Output, QueryList, TemplateRef, ViewChildren} from '@angular/core';
import * as dagre from 'dagre';  // from //third_party/javascript/typings/dagre
import {Subscription} from 'rxjs';

import {DagStateService} from './dag-state.service';
import {convertStateToRuntime, DagTheme, DEFAULT_LAYOUT_OPTIONS, DEFAULT_THEME, defaultFeatures, Dimension, Direction, getMargin, isNoState, LayoutOptions, NodeIcon, PadType, RankAlignment, SVG_ELEMENT_SIZE} from './data_types_internal';
import {GroupIterationSelectorModule} from './group_iteration_select';
import {fetchIcon, generateFullIconFor} from './icon_util';
import {WorkflowGraphIconModule} from './icon_wrapper';
import {DagIconsModule} from './icons_module';
import {DagNodeModule} from './node';
import {NodeRefBadgeModule} from './node_ref_badge';
import {CustomNode, DagEdge, DagGroup, DagNode, GroupIterationRecord, isDagreInit, isSamePath, NodeMap, NodeRef, Point, SelectedNode} from './node_spec';
import {UserConfigService} from './user_config.service';
import {debounce} from './util_functions';

// tslint:disable:no-dict-access-on-struct-type


/** Get the Euclidean Distance between 2 points */
export function euclideanDistance(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Dimension config for a raw DAG */
export interface GraphDims {
  width: number;
  height: number;
}

/**
 * Expanded representation of `DagGroup` needed to store extra state in the DAG
 * Group object
 */
export type EnhancedDagGroup = DagGroup&Dimension&Point&{
  expandedDims?: Dimension;
  padY?: number;
  // This is an extremely private property that should not be relied on by any
  // user of the DAG, except for the DAG Components internals
  // TODO: Remove any to satisfy TS check
  // tslint:disable-next-line:enforce-name-casing
  _cachedSelection: DagGroup|DagNode|any;
};

/**
 * In 'snapped' edge mode, in order to avoid the overlap between lines, some
 * edges positions are moved based this distance.
 */
const REVERSE_EDGE_CONTROL_DISTANCE = 200;

/**
 * Renders the workflow DAG.
 */
@Component({
  selector: 'ai-dag-raw',
  styleUrls: ['directed_acyclic_graph_raw.scss'],
  templateUrl: 'directed_acyclic_graph_raw.ng.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DagRaw implements DoCheck, OnInit, OnDestroy {
  readonly nodePad = 10;

  // Dag Related Props
  private path: string[] = [];
  private $sizeConfig = SVG_ELEMENT_SIZE();
  private $dimsCache = this.$sizeConfig.dims;
  $collapsed = true;
  $nodes: Array<DagNode|CustomNode> = [];
  $edges: DagEdge[] = [];
  $groups: DagGroup[] = [];
  a11ySortedNodes: Array<DagNode|EnhancedDagGroup> = [];
  layout: LayoutOptions = DEFAULT_LAYOUT_OPTIONS;
  dagreGraph?: dagre.graphlib.Graph;
  nodeMap: NodeMap = {nodes: {}, groups: {}};
  graphWidth: number = 0;
  graphHeight: number = 0;
  hoveredNode?: DagNode|DagGroup;
  hoveredNodeFromNode?: DagNode|DagGroup;
  hoveredNodeFromBadge?: DagNode|DagGroup;
  themeConfig = DEFAULT_THEME;
  private $customNodeTemplates: Record<string, TemplateRef<any>> = {};

  // State Props
  // We want this to be strings, so that we can hold state even when data is
  // reset
  expandedGroups = new Set<string>();
  observers: Subscription[] = [];
  $selectedNode: SelectedNode|null = null;
  $extraPadding: PadType = 'none';
  controlNodes: Record<string, DagNode> = {};
  private objDiffers:
      {[s: string]: KeyValueDiffer<string, DagNode|DagGroup>} = {};

  /**
   * The Path used to uniquely identify subdags
   * - An id = `[]` means root DAG
   * - Any other ID will be the context / index (nested) of that Sub-DAG
   * - A non `[]` value will also cause this DAG to drop the normal Graph-Level
   * Margin for a conservative `nodeWidth / 2`
   *
   * Example: ['s1', 's1'] is a subdag (id is unknown) which lives inside root
   * -> s1 -> s1
   */
  @Input('dagPath')
  set dagPath(path: string[]) {
    if (isSamePath(path, this.path)) return;
    if (!path.length) {
      throw new Error(
          `Cannot use empty path DAG construction (since that is reserved for root DAG), You must use an array of size 1 or greater for Sub-DAGs`);
    }
    this.path = path;

    // Run this to recalculate leanDims around DAG if needed
    this.extraPadding = this.extraPadding;
  }
  get dagPath() {
    return this.path;
  }
  isRootDag() {
    return !this.dagPath.length;
  }

  @Input() stateService?: DagStateService;
  @Input() noEmptySpaceAlloc = false;
  @Output() groupIterationChanged = new EventEmitter<GroupIterationRecord>();

  // DAG Props Converted (for interaction with Renderer)
  @Output() graphResize = new EventEmitter<GraphDims>();

  @Input('extraPadding')
  set extraPadding(padType: PadType) {
    this.$extraPadding = padType;
    this.calculateDims();
  }
  get extraPadding() {
    return this.$extraPadding;
  }

  @Input('theme')
  set theme(theme: DagTheme) {
    const layoutRequired = theme.edgeStyle !== this.themeConfig.edgeStyle;
    this.themeConfig = theme;
    this.$nodes = this.makeSafeNodes(this.$nodes.slice(0));
    this.$groups = this.makeSafeNodes(this.$groups.slice(0));
    if (layoutRequired) {
      this.updateGraphLayoutSync();
    } else {
      this.cdr.detectChanges();
    }
  }
  get theme() {
    return this.themeConfig;
  }

  @Input('sizeConfig')
  set sizeConfig(config) {
    this.$sizeConfig = config;
    this.calculateDims();
    this.updateGraphLayout();
  }
  get sizeConfig() {
    return this.$sizeConfig;
  }
  get dims() {
    return this.$dimsCache;
  }

  @Input() loading = false;

  @Input('nodes')
  set nodes(nodes: DagNode[]) {
    const reselectIfNeeded = this.getSafeRerenderHooks();
    // Avoid pointer/reference stability, so that angular will pick up the
    // change, in case someone modifies the list directly
    this.$nodes = this.makeSafeNodes(nodes.slice(0));
    this.updateGraphLayout();
    reselectIfNeeded();
  }
  get nodes() {
    return this.$nodes;
  }

  @Input('edges')
  set edges(edges: DagEdge[]) {
    const reselectIfNeeded = this.getSafeRerenderHooks();
    // Avoid pointer/reference stability, so that angular will pick up the
    // change, in case someone modifies the list directly
    this.$edges = edges.slice(0);
    this.updateGraphLayout();
    reselectIfNeeded();
  }
  get edges() {
    return this.$edges;
  }

  @Input('groups')
  set groups(groups: DagGroup[]) {
    const reselectIfNeeded = this.getSafeRerenderHooks();
    // Avoid pointer/reference stability, so that angular will pick up the
    // change, in case someone modifies the list directly
    this.$groups = this.makeSafeNodes(groups.slice(0));
    this.sanitizeExpandedGroups();
    this.updateGraphLayout();
    reselectIfNeeded();
  }
  get groups(): EnhancedDagGroup[] {
    return this.$groups as EnhancedDagGroup[];
  }

  @ViewChildren('subDag') subDags?: QueryList<DagRaw>;

  /**
   * Provides a safe node selection handler when either of `nodes`,`groups`, or
   * `edges` is reassigned
   */
  getSafeRerenderHooks() {
    const selectedId = this.selectedNode?.node?.id;
    const selectedPath = this.selectedNode?.path;
    if (selectedPath && isSamePath(selectedPath, this.dagPath)) {
      return () => this.selectNodeById(selectedId);
    }
    return () => {};
  }

  @Input() hoveredEdge?: DagEdge;

  @Input('selectedNode')
  set selectedNode(n: SelectedNode|null) {
    if (n && !isSamePath(n.path, this.dagPath)) {
      this.$selectedNode = null;
      return;
    }
    this.$selectedNode = n;
    this.selectedNodeChange.emit(n);
    this.stateService?.setSelectedNode(n);
  }
  get selectedNode() {
    return this.$selectedNode;
  }
  @Output() selectedNodeChange = new EventEmitter<SelectedNode|null>();

  @Input() features = defaultFeatures;
  @Input('collapsed')
  set collapsed(c: boolean) {
    this.$collapsed = c;
    this.updateGraphLayout();
  }
  get collapsed() {
    return this.$collapsed;
  }

  @Input('layout')
  set onLayoutSet(layout: LayoutOptions|undefined) {
    this.layout = {
      ...DEFAULT_LAYOUT_OPTIONS,
      ...layout || {},
    };
    this.updateGraphLayout();
  }

  @Input('customNodeTemplates')
  set customNodeTemplates(templates: Record<string, TemplateRef<any>>) {
    this.$customNodeTemplates = templates;
    this.cdr.detectChanges();
  }
  get customNodeTemplates() {
    return this.$customNodeTemplates;
  }

  constructor(
      private readonly differs: KeyValueDiffers,
      private readonly cdr: ChangeDetectorRef,
      readonly userConfigService: UserConfigService,
  ) {
    this.updateGraphLayout = debounce(this.updateGraphLayout, 50, this);
    this.updateDAG = this.updateDAG.bind(this);
    this.updateGraphLayoutFromNodesChange =
        this.updateGraphLayoutFromNodesChange.bind(this);
  }

  ngOnInit() {
    this.objDiffers = {};
    this.getNodesAndWatch();
    this.observers = this.stateService?.listenAll({
      collapsed: v => {
        this.collapsed = v;
      },
      features: v => {
        this.features = v;
      },
      layout: v => {
        this.onLayoutSet = v;
      },
      selectedNode: v => {
        // When coming from the service don't run validation on it
        this.$selectedNode = v;
      },
      theme: v => {
        this.theme = v;
      },
      customNodeTemplates: v => {
        this.customNodeTemplates = v;
      }
    }) ||
        [];
  }

  ngOnDestroy() {
    this.stateService?.destroyAll(this.observers);
  }

  ngDoCheck() {
    if (!this.nodes.length) return;
    for (const node of [...this.nodes, ...this.groups]) {
      const differ = this.objDiffers[node.id];
      if (!differ) return;
      const objChanges = differ.diff({[node.id]: node});
      objChanges && objChanges.forEachChangedItem(() => {
        this.handleChangeOn();
      });
    }
  }

  calculateDims() {
    if (this.isRootDag()) {
      this.$dimsCache = this.sizeConfig.dims;
    } else {
      this.$dimsCache = this.sizeConfig.getLeanDims(this.extraPadding);
    }
    this.updateGraphLayout();
  }

  makePathTo(id: string|string[]) {
    const idArr = id instanceof Array ? id : [id];
    return [...this.path, ...idArr];
  }

  /** Fetch cached DagNode for Group */
  getControlNodeFor(group: DagGroup) {
    return this.controlNodes[group.id];
  }

  broadcastIterChange(
      group: DagGroup, iterationNode: GroupIterationRecord['iterationNode']) {
    const iter = {path: this.dagPath, group, iterationNode};
    this.groupIterationChanged.emit(iter);
    this.stateService?.setIterationChange(iter);
  }

  /**
   * Generate a globally unique a11y HTML ID for a node so that screenreaders
   * know which element gets toggled by the interactables on the page
   */
  a11yIdFor(node: DagGroup|DagNode) {
    const pathString = [...this.path, node.id].join('_');
    return `a11y-id-for-${this.getNodeType(node)}-${pathString}`;
  }

  /**
   * Cleans any outdated id'd Expanded Groups, usually after a new Groups
   * assignment. If there are entries that do NOT belong in `this.groups`, they
   * will be removed
   *
   * This prevents memory leaks.
   */
  sanitizeExpandedGroups() {
    for (const id of Array.from(this.expandedGroups)) {
      if (this.nodeMap.groups[id]) continue;
      this.expandedGroups.delete(id);
    }
  }
  isGroupExpanded(g: DagGroup|string) {
    const n = this.ensureTargetEntity(g, 'group');
    return this.expandedGroups.has(n.id);
  }

  storeSubDagDims(dims: GraphDims, group: DagGroup|string) {
    const groupNode = this.ensureTargetEntity(group) as EnhancedDagGroup;
    const oldDims = groupNode.expandedDims;
    if (oldDims && oldDims.width === dims.width &&
        oldDims.height === dims.height) {
      return;
    }
    groupNode.expandedDims = dims;
    this.updateGraphLayout();
  }

  isCustomNode(node: DagNode|CustomNode): node is CustomNode {
    return node instanceof CustomNode;
  }

  getCustomNodeTemplateFor(node: CustomNode) {
    const {templateRef} = node;
    return this.customNodeTemplates[templateRef];
  }

  /**
   * Handler passed to a custom node to trigger change detection on the DAG
   * Component
   *
   * Constructor will bind `this` to this so it can be run from any scope
   * properly
   */
  updateDAG() {
    this.updateGraphLayout();
  }

  /**
   * Allows the developer of a custom node to pass / toggle the selection state
   * of the custom node using the output curried function of this method
   */
  customNodeToggleSelectionCurry(node: DagNode) {
    /** Set selection state of current node to true / false */
    const setSelection = (state?: boolean) => {
      if (state === undefined) return this.toggleSelectedNode(node);
      if (state && this.selectedNode?.node === node) return;
      if (!state && this.selectedNode?.node !== node) return;
      return this.toggleSelectedNode(node);
    };
    return setSelection;
  }

  /**
   * Handler passed to a custom node to trigger nodes change detection on the
   * DAG Component
   *
   * Constructor will bind `this` to this so it can be run from any scope
   * properly
   */
  updateGraphLayoutFromNodesChange() {
    if (!this.nodes.length && !this.groups.length) return;
    const g = this.dagreGraph!;
    const {
      getNodeWidth,
      height: nodeHeight,
      iconSpaceWidth,
      condensedIconWidth,
    } = this.dims;

    // Adds additional props for dagre graph spacing
    const enhanceNode = (node: DagNode|CustomNode) => {
      if (node instanceof CustomNode) return node;
      let width = getNodeWidth(node.state, node.conditionalQuery);
      const isCollapsedArtifact = node.type === 'artifact' && this.collapsed;
      if (isCollapsedArtifact) {
        width = condensedIconWidth;
      } else if (node.type === 'artifact') {
        width = getNodeWidth('NO_STATE_STATIC', '');
      }
      const height = isCollapsedArtifact ? width : nodeHeight;
      return Object.assign(node, {width, height});
    };

    for (const node of this.nodes) {
      g.setNode(node.id, enhanceNode(node));
    }

    dagre.layout(g);

    type Orientation = 'center'|'right'|'left';
    const getDim = (dim: 'x'|'y', orient: Orientation = 'center'): number[] => {
      let nodeOff = (node: CustomNode|DagNode|DagGroup) => {
        const type = this.getNodeType(node);
        if (type === 'group' || node instanceof CustomNode) {
          return (dim === 'x' ? node.width : node.height) / 2;
        }
        if (orient === 'center' || dim !== 'x') return 0;
        if (type === 'artifact' && this.collapsed) return iconSpaceWidth;
        return getNodeWidth(node.state, node.conditionalQuery) / 2;
      };
      if (orient === 'left') {
        const tmp = nodeOff;
        nodeOff = (...a) => -tmp(...a);
      }
      return [
        this.nodes.map(n => n[dim] + nodeOff(n)),
        this.groups.map(g => g[dim] + nodeOff(g)),
        this.edges.map(e => e.points!.map(p => p[dim])),
      ].flat(3)
          .filter(i => !isNaN(i));
    };

    const xOffset = Math.min(...getDim('x', 'left'));
    const {graphMargin} = this.dims;
    const margin =
        Object.fromEntries((['left', 'right', 'top', 'bottom'] as Direction[])
                               .map(i => [i, getMargin(graphMargin, i)]));
    for (const node of this.nodes) {
      node.x += -xOffset + this.nodePad + margin['left'];
      node.y += this.nodePad + margin['top'];
    }
    for (const group of this.groups) {
      group.x += -xOffset + this.nodePad + margin['left'];
      group.y += this.nodePad + margin['top'];
    }
    for (const edge of this.edges) {
      if (this.theme.edgeStyle === 'snapped') {
        this.snapEdgeConnectionPoints(edge);
      } else {
        for (const p of edge.points!) {
          p.x += -xOffset + this.nodePad + margin['left'];
          p.y += this.nodePad + margin['top'];
        }
      }
      this.resnapPointsForGroups(edge);
    }

    const maxX = Math.max(...getDim('x', 'right'));
    const maxY = Math.max(...getDim('y'));
    this.graphWidth = maxX + this.nodePad + margin['right'];
    this.graphHeight = maxY + nodeHeight / 2 + this.nodePad + margin['bottom'];
    this.graphResize.emit({width: this.graphWidth, height: this.graphHeight});
  }

  // This method is debounced in the constructor by 50ms
  updateGraphLayout() {
    this.updateGraphLayoutSync();
  }
  updateGraphLayoutSync() {
    if (!this.nodes.length && !this.groups.length) return;
    this.getNodesAndWatch();
    const g = new dagre.graphlib.Graph();
    this.dagreGraph = g;

    g.setGraph(this.convertToDagreOptions(this.layout));

    const {
      getNodeWidth,
      height: nodeHeight,
      iconSpaceWidth,
      condensedIconWidth,
    } = this.dims;

    // Adds additional props for dagre graph spacing
    const enhanceNode = (node: DagNode|CustomNode) => {
      if (node instanceof CustomNode) return node;
      let width = getNodeWidth(node.state, node.conditionalQuery);
      const isCollapsedArtifact = node.type === 'artifact' && this.collapsed;
      if (isCollapsedArtifact) {
        width = condensedIconWidth;
      } else if (node.type === 'artifact') {
        width = getNodeWidth('NO_STATE_STATIC', '');
      }
      const height = isCollapsedArtifact ? width : nodeHeight;
      return Object.assign(node, {width, height});
    };
    // Adds additional props for dagre graph spacing
    const enhanceGroup = (group: DagGroup) => {
      const expandedGroup = group as EnhancedDagGroup;
      let width =
          getNodeWidth(group.state, group.conditionalQuery) + 6 * this.nodePad;
      let height = nodeHeight + 5 * this.nodePad;
      // Size of protrusion outside the border for a group
      let padY = 0;
      const {expandedDims} = expandedGroup;
      if (this.expandedGroups.has(group.id)) {
        padY = group.hasControlNode ? nodeHeight / 2 : 0;
        [width, height] = [
          Math.max(width, expandedDims?.width || 0),
          Math.max(height + padY, (expandedDims?.height || 0) + padY),
        ];
      }
      return Object.assign(expandedGroup, {width, height, padY});
    };

    for (const node of Object.values(this.controlNodes)) {
      // We DO NOT want these in Dagre, but we do want width and height
      // calculcated for the view
      enhanceNode(node);
    }
    for (const node of this.nodes) {
      g.setNode(node.id, enhanceNode(node));
    }
    for (const group of this.groups) {
      g.setNode(group.id, enhanceGroup(group));
    }
    for (const e of this.edges) {
      g.setEdge(e.from, e.to, e);
    }

    dagre.layout(g);

    type Orientation = 'center'|'right'|'left';
    const getDim = (dim: 'x'|'y', orient: Orientation = 'center'): number[] => {
      let nodeOff = (node: CustomNode|DagNode|DagGroup) => {
        const type = this.getNodeType(node);
        if (type === 'group' || node instanceof CustomNode) {
          return (dim === 'x' ? node.width : node.height) / 2;
        }
        if (orient === 'center' || dim !== 'x') return 0;
        if (type === 'artifact' && this.collapsed) return iconSpaceWidth;
        return getNodeWidth(node.state, node.conditionalQuery) / 2;
      };
      if (orient === 'left') {
        const tmp = nodeOff;
        nodeOff = (...a) => -tmp(...a);
      }
      return [
        this.nodes.map(n => n[dim] + nodeOff(n)),
        this.groups.map(g => g[dim] + nodeOff(g)),
        this.edges.map(e => e.points!.map(p => p[dim])),
      ].flat(3)
          .filter(i => !isNaN(i));
    };

    const xOffset = Math.min(...getDim('x', 'left'));
    const {graphMargin} = this.dims;
    const margin =
        Object.fromEntries((['left', 'right', 'top', 'bottom'] as Direction[])
                               .map(i => [i, getMargin(graphMargin, i)]));
    for (const node of this.nodes) {
      node.x += -xOffset + this.nodePad + margin['left'];
      node.y += this.nodePad + margin['top'];
    }
    for (const group of this.groups) {
      group.x += -xOffset + this.nodePad + margin['left'];
      group.y += this.nodePad + margin['top'];
    }
    for (const edge of this.edges) {
      if (this.theme.edgeStyle === 'snapped') {
        this.snapEdgeConnectionPoints(edge);
      } else {
        for (const p of edge.points!) {
          p.x += -xOffset + this.nodePad + margin['left'];
          p.y += this.nodePad + margin['top'];
        }
      }
      this.resnapPointsForGroups(edge);
    }

    const maxX = Math.max(...getDim('x', 'right'));
    const maxY = Math.max(...getDim('y'));
    this.graphWidth = maxX + this.nodePad + margin['right'];
    this.graphHeight = maxY + nodeHeight / 2 + this.nodePad + margin['bottom'];
    this.graphResize.emit({width: this.graphWidth, height: this.graphHeight});

    this.a11ySortedNodes = [...this.nodes, ...this.groups].sort(
        (a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
  }

  // Only for tests
  detectChanges() {
    this.cdr.detectChanges();
  }

  getTopCenterPoint(node: DagNode|DagGroup): Point {
    return {x: node.x, y: node.y - node.height / 2};
  }
  getBottomCenterPoint(node: DagNode|DagGroup): Point {
    return {x: node.x, y: node.y + node.height / 2};
  }
  getLeftCenterPoint(node: DagNode|DagGroup): Point {
    return {x: node.x - node.width / 2, y: node.y};
  }
  getRightCenterPoint(node: DagNode|DagGroup): Point {
    return {x: node.x + node.width / 2, y: node.y};
  }

  /**
   * Set edge points with the node border center point based on direction.
   * http://screen/9pr65gGswBgzicS
   *
   * Relation table: which point to get based on direction and from/to node.
   *       | from  | to
   * ------|-------|-------
   *   LR  | right | left
   * ------|-------|-------
   *   RL  | left  | right
   * ------|-------|-------
   *   TB  | bottom| top
   * ------|-------|-------
   *   BT  | top   | bottom
   **/
  snapEdgeConnectionPoints(edge: DagEdge) {
    const fromTarget = this.ensureTargetEntity(edge.from);
    const toTarget = this.ensureTargetEntity(edge.to);

    const layoutDirection = this.layout.rankDirection;
    if (layoutDirection === 'LR') {
      edge.points = [
        this.getRightCenterPoint(fromTarget),
        this.getLeftCenterPoint(toTarget),
      ];
    } else if (layoutDirection === 'RL') {
      edge.points = [
        this.getLeftCenterPoint(fromTarget),
        this.getRightCenterPoint(toTarget),
      ];
    } else if (layoutDirection === 'BT') {
      edge.points = [
        this.getTopCenterPoint(fromTarget),
        this.getBottomCenterPoint(toTarget),
      ];
    } else {
      edge.points = [
        this.getBottomCenterPoint(fromTarget),
        this.getTopCenterPoint(toTarget),
      ];
    }
  }

  /**
   * Detect edges that point to the top of a group, and see:
   * - If they're close enough to the control node, then snap to the top-center
   * of the control node
   * - If not, then bring lower to snap to the group border
   * - This function only needs to worry about top border
   *
   * This function relies on `expandedDims` to have been calculated as it
   * operates on expanded DAGs
   */
  resnapPointsForGroups(edge: DagEdge) {
    // Point snapping to Expanded Groups with Control Nodes
    const target = this.ensureTargetEntity(edge.to);
    const anchorPt = edge.points!.slice(-1)[0];
    if (target instanceof DagNode || !this.isGroupExpanded(target) ||
        !target.hasControlNode) {
      return;
    }
    const groupF = target as EnhancedDagGroup;
    if (!groupF.expandedDims) return;
    const topBorderY =
        groupF.y + groupF.padY! / 2 - groupF.expandedDims.height / 2;
    // Ignore if anchor point is below the top border of the group, coordinates
    // grow as they are lower!
    if (anchorPt.y - topBorderY > 2) return;
    const nodeWidth =
        this.dims.getNodeWidth(target.state, target.conditionalQuery);
    const snapToBorder = Math.abs(anchorPt.x - groupF.x) > nodeWidth / 2;
    if (snapToBorder) {
      anchorPt.y = topBorderY;
      return;
    }
    Object.assign(anchorPt, {x: groupF.x, y: topBorderY - groupF.padY!});
  }

  adjustNodeHover(
      node: DagNode|DagGroup, value: boolean, source: 'node'|'badge') {
    if (source === 'badge') {
      this.hoveredNodeFromBadge = value ? node : undefined;
    } else {
      this.hoveredNodeFromNode = value ? node : undefined;
    }
    const [nodeNode, badgeNode] = [
      this.hoveredNodeFromNode,
      this.hoveredNodeFromBadge,
    ];

    const finalValue = nodeNode || badgeNode;
    this.hoveredNode = finalValue ?
        node :
        (this.hoveredNode === node ? undefined : this.hoveredNode);
    this.cdr.detectChanges();
  }

  /**
   * Converts the graph layout options interface to the structure used by
   * dagre.
   */
  convertToDagreOptions(layout: LayoutOptions): dagre.GraphLabel {
    const alignment = layout.rankAlignment === RankAlignment.NONE ?
        undefined :
        layout.rankAlignment;

    return {
      rankdir: layout.rankDirection,
      align: alignment,
      ranksep: layout.rankSeparation,
      nodesep: layout.nodeSeparation,
      edgesep: layout.edgeSeparation,
      ranker: layout.ranker,
      marginx: 0,
      marginy: 0,
    };
  }

  /** Macro to toggle CSS Classes on an element on or off */
  toggleClass(state: boolean, className: string) {
    return state ? className : '';
  }

  getNodesAndWatch() {
    this.nodeMap = DagNode.createNodeMap(this.nodes, this.edges, this.groups);
    for (const node of [...this.nodes, ...this.groups]) {
      this.objDiffers[node.id] = this.differs.find(node).create();
    }
  }

  handleChangeOn() {
    // TODO: Implement change handling
    // this.updateGraphLayout();
  }

  unselectNode() {
    if (!this.selectedNode) return;
    this.toggleSelectedNode(null);
  }

  toggleSelectedNode(node: DagNode|DagGroup|null, $event?: MouseEvent|Event) {
    $event?.preventDefault();
    $event?.stopPropagation();
    if (this.selectedNode?.node === node) {
      node = null;
    }
    this.selectedNode = node ? {node, path: this.dagPath.slice(0)} : null;
    return !!node;
  }

  refBadgeClick(refNode: DagNode|DagGroup, ref: NodeRef, $event?: MouseEvent|Event) {
    $event?.preventDefault();
    $event?.stopPropagation();
    const value = this.selectedNode?.node === refNode ? null : {
      node: refNode,
      path: ref.path.slice(0),
    };
    this.stateService?.setSelectedNode(value);
    value && this.stateService?.setExpandPath(ref.path);
  }

  /**
   * Marks a node on the graph as selected if a valid `id` is provided
   *
   * @param id Id for a `DagNode` within the `nodes` provided to this graph
   * @return If the renderer was able to find the node by the given id
   */
  selectNodeById(id?: string): boolean {
    if (id === undefined) return false;
    const node = this.a11ySortedNodes.find(n => n.id === id);
    if (!node) return false;
    if (node === this.selectedNode?.node) return true;
    return this.toggleSelectedNode(node);
  }

  setEdgeHover(edge: DagEdge, state: boolean) {
    if (this.hoveredEdge === edge && !state) {
      this.hoveredEdge = undefined;
    } else {
      this.hoveredEdge = edge;
    }
    this.cdr.detectChanges();
  }

  /**
   * Toggles the expansion state of the sub-group
   *
   * @return Did expansion state actually change
   */
  toggleExpand(group: string|DagGroup, value?: boolean) {
    const id = group instanceof DagGroup ? group.id : group;
    const beforeCt = this.expandedGroups.size;
    if (this.isGroupExpanded(group) && value !== true) {
      this.expandedGroups.delete(id);
    } else if (value !== false) {
      this.expandedGroups.add(id);
    }
    this.updateGraphLayout();
    return beforeCt !== this.expandedGroups.size;
  }

  getIterationsFor(group: DagGroup) {
    const nodes = [...group.groups, ...group.nodes];
    // Sort in descending order of interestingness of states
    return nodes;
  }

  getArrowMarkerId(edge: DagEdge|undefined): string {
    if (!edge || !edge.points) return '';
    const [from, to] = [edge.from, edge.to].map(s => s.replace(/[^\w]/g, '-'));
    return `arrow_${from}_${to}`;
  }

  getEdgeMarkerEndId(edge: DagEdge|undefined): string|undefined {
    const markerStyle = edge?.toMarkerStyle || this.theme.edgeToMarkerStyle;
    if (!edge || !edge.points || markerStyle === 'circle') {
      return undefined;
    }
    return `url(#${this.getArrowMarkerId(edge)})`;
  }

  getControlPointsForBezierCurve(start: Point, end: Point): Point[] {
    if (this.layout.rankDirection === 'LR' ||
        this.layout.rankDirection === 'RL') {
      return [
        {x: (start.x + end.x) / 2, y: start.y},
        {x: (start.x + end.x) / 2, y: end.y},
      ];
    }

    return [
      {x: start.x, y: (start.y + end.y) / 2},
      {x: end.x, y: (start.y + end.y) / 2},
    ];
  }

  /**
   * When the edge is in a reversed direction, in order to avoid overlapping
   * between the edges and nodes, the position of the edges in the reversed
   * direction are revised. The middle points of the edges are moved from
   * within two nodes to outside of the two nodes.
   */
  getControlPointsForReversedEdge(start: Point, end: Point): Point[] {
    const layoutDirection = this.layout.rankDirection;
    if (layoutDirection === 'LR' || layoutDirection === 'RL') {
      const deltaX = start.x - end.x;
      const directionY = start.y - end.y < 0 ? -1 : 1;
      const deltaY = directionY *
          Math.max(REVERSE_EDGE_CONTROL_DISTANCE, Math.abs((start.y - end.y)));
      return [
        {x: start.x + deltaX / 3, y: start.y + deltaY / 3},
        {x: end.x - deltaX / 3, y: start.y + deltaY / 3},
      ];
    } else {
      const directionX = start.x - end.x < 0 ? -1 : 1;
      const deltaX = directionX *
          Math.max(REVERSE_EDGE_CONTROL_DISTANCE, Math.abs((start.x - end.x)));
      const deltaY = start.y - end.y;
      return [
        {x: start.x + deltaX / 3, y: start.y + deltaY / 3},
        {x: start.x + deltaX / 3, y: end.y - deltaY / 3}
      ];
    }
  }

  buildPath(edge: DagEdge|undefined): string {
    if (!edge || !edge.points) return '';
    const pts = edge.points;
    const [xs, ys] = ['x', 'y'].map(i => pts.map(p => p[i as 'x' | 'y']));

    const start = {x: xs.shift(), y: ys.shift()};
    const end = {x: xs.pop(), y: ys.pop()};

    if (this.theme.edgeStyle === 'snapped') {
      const [m1, m2] =
          this.hasEdgeInReversedDirection(start as Point, end as Point) ?
          this.getControlPointsForReversedEdge(start as Point, end as Point) :
          this.getControlPointsForBezierCurve(start as Point, end as Point);
      return `M${start.x} ${start.y} C${m1.x} ${m1.y} ${m2.x} ${m2.y} ${
          end.x} ${end.y}`;
    }

    const middlePoints = xs.map((x, i) => {
      const y = ys[i];
      return `${x},${y}`;
    });
    // Builds a spline curve from all points given to us by Dagre.
    return `M${start.x},${start.y} S${middlePoints.join(' ')} ${end.x},${
        end.y}`;
  }

  /**
   * In 'snapped' edge style, check if there is edge line in reversed direction
   * than normal.
   */
  hasEdgeInReversedDirection(start: Point, end: Point) {
    const layoutDirection = this.layout.rankDirection;
    if (layoutDirection === 'LR') {
      return start.x >= end.x;
    } else if (layoutDirection === 'RL') {
      return start.x <= end.x;
    } else if (layoutDirection === 'TB') {
      return start.y >= end.y;
    } else {
      return start.y <= end.y;
    }
  }

  /**
   * This function is needed by Angular NgFor to allow for proper tracking of
   * edge-labels, otherwise the `ngFor` will simply remove and re-render these,
   * which will make all animations fail on edge-labels. This also has a linear
   * performance boost for any edge-labels added to the DAG.
   *
   * More info:
   * https://medium.com/simars/improve-ngfor-usability-and-performance-with-trackby-97f32ab92f1c
   */
  edgeLabelTrack(index: number, e: ReturnType<this['getEdgeLabels']>[0]) {
    return e.id;
  }

  edgeTrack(index: number, e: DagEdge) {
    return `edge-${e.from}->${e.to}`;
  }

  nodeOrGroupTrack(i: number, n: DagNode|DagGroup|NodeRef) {
    return n.id;
  }

  /** Get the correct list of edges that have a label and valid mid-point */
  getEdgeLabels() {
    return this.edges
        .map(e => ({
               id: `${e.from}->${e.to}`,
               label: e.label,
               edge: e,
               mid: this.getMiddleEdgePoint(e),
             }))
        .filter(({label, mid}) => label && mid);
  }
  getMiddleEdgePoint(edge: DagEdge): Point|undefined {
    const {points = []} = edge;
    if (points.length < 1) return points[0];
    const distances = points
                          .map((p, i) => {
                            if (!i) return 0;
                            const dist = euclideanDistance(p, points[i - 1]);
                            return dist;
                          })
                          .slice(1);
    let remainingDistance = distances.reduce((p, c) => p + c, 0) / 2;
    for (let i = 0; i < points.length; i++) {
      const thisDistance = distances[i];
      if (thisDistance < remainingDistance) {
        remainingDistance -= thisDistance;
        continue;
      }
      // We can get the midpoint within the current line segment
      const [ptA, ptB] = points.slice(i, i + 2);
      const ratio = remainingDistance / thisDistance;
      const midPoint = {
        x: ptA.x + (ptB.x - ptA.x) * ratio,
        y: ptA.y + (ptB.y - ptA.y) * ratio,
      };
      return midPoint as Point;
    }
    // This code path is impossible
    return;
  }

  classNameState(entity: DagGroup): string {
    return entity.state.toLowerCase();
  }

  listChildren(node: DagNode) {
    const {nodes, groups} = this.nodeMap;
    const edges = [...nodes[node.id]?.edges, ...groups[node.id]?.edges];
    return edges.map(({to}) => nodes[to] ? nodes[to].node : groups[to]?.group);
  }

  resolveReference(ref: NodeRef) {
    return this.stateService?.resolveReference(ref) as DagNode;
  }

  animatedEdge(e: DagEdge) {
    const [from, to] = [e.from, e.to].map(e => this.ensureTargetEntity(e));
    return to.state === 'RUNNING' ||
        (from.state === 'RUNNING' && this.getNodeType(to) === 'artifact' &&
         convertStateToRuntime(to.state) === 'Runtime');
  }

  ensureTargetEntity(
      target: DagNode|DagGroup|string,
      forceType: 'node'|'group'|'any' = 'any'): DagNode|DagGroup {
    if (target instanceof DagNode || target instanceof DagGroup) return target;
    const {nodes, groups} = this.nodeMap;
    if (forceType !== 'group' && nodes[target]) {
      return nodes[target].node;
    } else if (forceType !== 'node' && groups[target]) {
      return groups[target].group;
    }
    // This should never happen, and is a FATAL state error-handle, this means
    // that the node id being fetched from an edge is not in the list of
    // DagNodes passed in as input. This can happen when the edges and nodes
    // are not in sync
    const humanReadableType =
        forceType === 'any' ? '' : ` [type: ${forceType}]`;
    const repo = forceType === 'node' ?
        nodes :
        (forceType === 'group' ? groups : {...nodes, ...groups});
    const error = `An entity${humanReadableType} (id: ${
        target}) was requested from nodeMap (${
        Object.keys(repo).join(
            ', ')}). This means there is inconsistency between the nodes and edges provided to the component`;

    // This is a critical error that really needs to be surfaced to the
    // environment
    console['error']('SEVERE DAG ERROR:', error);
    return new DagNode('fake_node', 'artifact');
  }

  ensureNode(node: DagNode|string): DagNode {
    return this.ensureTargetEntity(node, 'node') as DagNode;
  }

  /** Will ascertain if the node is `static` or in `pending` state */
  pendingOrStatic(node: DagNode|DagGroup|string) {
    const nodeEns = this.ensureTargetEntity(node);
    return convertStateToRuntime(nodeEns.state) === 'Static' ||
        nodeEns.state === 'PENDING';
  }

  getNodeType(node: DagNode|DagGroup|string) {
    const n = this.ensureTargetEntity(node);
    return n instanceof DagNode ? n.type : 'group';
  }

  edgeMarkerClassesFor(e: DagEdge, point: 'from'|'to') {
    const [from, to] = [e.from, e.to].map(e => this.ensureTargetEntity(e));
    const currPt = point === 'from' ? from : to;
    return [
      point,
      this.getNodeType(currPt),
      this.pendingOrStatic(to) ? 'pending-or-static' : '',
      currPt instanceof CustomNode ? 'custom-node-type' : '',
      currPt instanceof CustomNode && currPt.hideEdgeMarkers ? 'hidden' : '',
    ];
  }

  makeSafeNode(node: DagNode, isControlNode?: boolean): DagNode;
  makeSafeNode(node: undefined, isControlNode?: boolean): undefined;
  makeSafeNode(node: DagNode|undefined, isControlNode = false) {
    if (!node) return;
    type ExpandedNode = DagNode&{origIcon?: NodeIcon};
    const expNode = node as ExpandedNode;
    const origIcon = expNode.origIcon =
        (expNode.origIcon || {...expNode.icon}) as unknown as NodeIcon;
    // While we are actually using a very ambitious config here to save on a
    // ton of processing time, this needs to be coerced to work within the
    // bounds of the program
    expNode.icon = generateFullIconFor(
                       origIcon, isControlNode ? 'group' : node.type,
                       this.theme) as unknown as NodeIcon;
    return node;
  }

  /**
   * Generate fields needed in the DAG for the nodes. And pre-computes a list of
   * dynamically generated Control Nodes for all groups
   *
   * Helps improve performance since all the node fields are precomputed
   *
   * Old `IconConfig` is stored in `DagNode.origIcon`
   */
  makeSafeNodes<T extends DagNode[]|DagGroup[]>(nodes: T): T {
    if (!nodes.length) return nodes;
    if (nodes[0] instanceof DagNode) {
      for (const node of (nodes as DagNode[])) {
        this.makeSafeNode(node);
      }
      return nodes;
    }

    const groups = nodes as DagGroup[];
    const controlNodes: Record<string, DagNode> = {};
    const oldControlNodes = this.controlNodes;

    for (const group of groups) {
      if (!group.hasControlNode) continue;
      const {width, height} = oldControlNodes[group.id] || {};
      const newNode = group.generateControlNode()!;
      this.makeSafeNode(newNode, true);
      // We don't want to lose pre-calculated width and height on update
      if (!isNaN(width) && width) Object.assign(newNode, {width, height});
      controlNodes[group.id] = newNode;
    }
    this.controlNodes = controlNodes;
    return nodes;
  }

  getEdgeWidth(edge: DagEdge, includeHover = true) {
    const weight = Math.abs(edge.weight || 1);
    const width = Math.max(0, weight * this.theme.edgeWidth);
    const hoverEffect =
        includeHover && this.hoveredEdge === edge ? 2 + .1 * width : 0;
    return width + Math.floor(hoverEffect);
  }

  getEdgeColor(edge: DagEdge) {
    if (this.pendingOrStatic(edge.to)) return;
    return edge.color || this.theme.edgeColor;
  }

  fetchIcon = (icon: NodeIcon, key: keyof NodeIcon) => fetchIcon(icon, key);

  isDagreInit = (element: DagNode|DagEdge|DagGroup) =>
      isDagreInit(element, e => this.ensureTargetEntity(e));
  isNoState = isNoState;
  convertStateToRuntime = convertStateToRuntime;
  min = Math.min;
  max = Math.max;
}

@NgModule({
  imports: [
    CommonModule,
    WorkflowGraphIconModule,
    DagIconsModule,
    DagNodeModule,
    NodeRefBadgeModule,
    GroupIterationSelectorModule,
    DragDropModule,
  ],
  declarations: [
    DagRaw,
  ],
  exports: [
    DagRaw,
  ],
})
export class DagRawModule {
}
