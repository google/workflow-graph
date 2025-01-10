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

import {LiveAnnouncer} from '@angular/cdk/a11y';
import {CdkDrag, CdkDragMove, CdkDragStart, DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, ElementRef, EventEmitter, Input, KeyValueDiffer, KeyValueDiffers, NgModule, OnDestroy, OnInit, Optional, Output, QueryList, TemplateRef, ViewChildren} from '@angular/core';
import * as dagre from 'dagre';  // from //third_party/javascript/typings/dagre
import {Subscription} from 'rxjs';

import {DagStateService} from './dag-state.service';
import {convertStateToRuntime, createDAGFeatures, type DagTheme, DEFAULT_LAYOUT_OPTIONS, DEFAULT_THEME, defaultFeatures, Dimension, Direction, getMargin, isNoState, type LayoutOptions, NODE_HEIGHT, NODE_HEIGHT_PADDING, NODE_WIDTH_PADDING, NodeIcon, type PadType, PointWithTransform, RankAlignment, SizeConfig, SVG_ELEMENT_SIZE} from './data_types_internal';
import {GroupIterationSelectorModule} from './group_iteration_select';
import {fetchIcon, generateFullIconFor} from './icon_util';
import {WorkflowGraphIconModule} from './icon_wrapper';
import {DagNodeModule} from './node';
import {NodeRefBadgeModule} from './node_ref_badge';
import {CustomNode, type DagEdge, DagGroup, DagNode, GroupIterationRecord, GroupToggleEvent, isDagreInit, isSamePath, NodeMap, NodeRef, NodeType, Point, type SelectedNode, SnapPoint} from './node_spec';
import {UserConfigService} from './user_config.service';
import {debounce, isPinch} from './util_functions';

// tslint:disable:no-dict-access-on-struct-type

const CENTER = 0.5;
const START = 0;
const END = 1;

const DEFAULT_EDGE_START_SNAP_ANCHORS = {
  'LR': {
    horizontalPercent: END,
    verticalPercent: CENTER,
  },
  'RL': {
    horizontalPercent: START,
    verticalPercent: CENTER,
  },
  'BT': {
    horizontalPercent: CENTER,
    verticalPercent: START,
  },
  'TB': {
    horizontalPercent: CENTER,
    verticalPercent: END,
  },

};

const DEFAULT_EDGE_END_SNAP_ANCHORS = {
  'LR': {
    horizontalPercent: START,
    verticalPercent: CENTER,
  },
  'RL': {
    horizontalPercent: END,
    verticalPercent: CENTER,
  },
  'BT': {
    horizontalPercent: CENTER,
    verticalPercent: END,
  },
  'TB': {
    horizontalPercent: CENTER,
    verticalPercent: START,
  },

};

/**
 * Calculates the where alongside an axis will the edge be attached, based on
 * the node length along said axis, and edge's anchor and offset.
 */
function edgeAttachmentPoint(length: number, percent: number, offset: number) {
  return length * (percent - 0.5) + offset;
}

/**
 * To better position edge labels, we need a higher resolution representation of
 * edge points than what dagre returns. This function will calculate the points
 * along the edge with a default resolution of 0.01, returning 100 points.
 */
function getPointsOnBezierCurveDeCasteljau(
    points: Array<{x: number, y: number}>, resolution: number = 0.01) {
  const n = points.length;
  const pointsOnCurve = [];

  for (let u = 0; u <= 1; u += resolution) {
    // Create a copy of the control points for recursive subdivision
    const tempPoints = [...points];

    // Perform De Casteljau's algorithm
    for (let i = 1; i < n; i++) {
      for (let j = 0; j < n - i; j++) {
        tempPoints[j] = {
          x: (1 - u) * tempPoints[j].x + u * tempPoints[j + 1].x,
          y: (1 - u) * tempPoints[j].y + u * tempPoints[j + 1].y,
        };
      }
    }

    // The final point in the subdivided array is the point on the curve
    const p = tempPoints[0];
    pointsOnCurve.push(p);
  }

  return pointsOnCurve;
}

/** Get the Euclidean Distance between 2 points */
export function euclideanDistance(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Get translate string for positioning to the desired coordinates and center
 * item over it
 */
function getTransformTranslateString(x: number, y: number) {
  return `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
}

// Adds additional props for dagre graph spacing
function setNodeSizeProps(
    node: DagNode|CustomNode, dims: SizeConfig['dims'], collapsed: boolean) {
  const {
    getNodeWidth,
    height: nodeHeight,
    condensedIconWidth,
  } = dims;

  if (node instanceof CustomNode) return node;
  let width = getNodeWidth(node.state, node.conditionalQuery);
  const isCollapsedArtifact = node.type === 'artifact' && collapsed;
  if (isCollapsedArtifact) {
    width = condensedIconWidth;
  } else if (node.type === 'artifact') {
    width = getNodeWidth('NO_STATE_STATIC', '');
  }
  const height = isCollapsedArtifact ? width : nodeHeight;
  return Object.assign(node, {width, height});
}

// Adds additional props for dagre graph spacing
function setGroupSizeProps(
    group: DagGroup,
    dims: SizeConfig['dims'],
    nodePad: number,
    expandedGroups: Set<string>,
    showControlNode: boolean,
) {
  const {getNodeWidth, height: nodeHeight} = dims;
  const expandedGroup = group as EnhancedDagGroup;
  let width = getNodeWidth(group.state, group.conditionalQuery) +
      NODE_WIDTH_PADDING * nodePad;
  let height = nodeHeight + NODE_HEIGHT_PADDING * nodePad;
  if (group.customControlNode) {
    width = group.customControlNode.width + NODE_WIDTH_PADDING * nodePad;
    height = group.customControlNode.height + NODE_HEIGHT_PADDING * nodePad;
  }
  // Size of protrusion outside the border for a group
  let padY = 0;
  const {expandedDims} = expandedGroup;
  if (expandedGroups.has(group.id)) {
    padY = showControlNode ? nodeHeight / 2 : 0;
    [width, height] = [
      Math.max(width, expandedDims?.width || 0),
      Math.max(height + padY, (expandedDims?.height || 0) + padY),
    ];
  }
  return Object.assign(expandedGroup, {width, height, padY});
}

/**
 * Sets the selection state of a group.
 * _cachedSelection is a property that should be refactored to be clearer. It is
 * used to determine which node/group is rendered within an iteration group.
 */
export function setEnhancedGroupSelection(
    group: DagGroup,
    selection: DagGroup|DagNode,
) {
  const enhancedGroup = group as EnhancedDagGroup;
  enhancedGroup._cachedSelection = selection;
  enhancedGroup.selectedLoopId = selection?.id;
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
type Orientation = 'center'|'right'|'left'|'bottom';

/**
 * Renders the workflow DAG.
 */
@Component({
  standalone: false,
  selector: 'ai-dag-raw',
  styleUrls: ['directed_acyclic_graph_raw.scss'],
  templateUrl: 'directed_acyclic_graph_raw.ng.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DagRaw implements DoCheck, OnInit, OnDestroy {
  readonly nodePad = 10;
  @ViewChildren(CdkDrag) draggableComponents?: QueryList<CdkDrag>;

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
  memoizedEdgeCurvePoints: {[key: string]: Array<{x: number, y: number}>} = {};

  isDragging = false;

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

  @Input() noEmptySpaceAlloc = false;
  @Output() onGroupExpandToggled = new EventEmitter<GroupToggleEvent>();

  @Input() resolveReference?: (ref: NodeRef) => DagNode | DagGroup | undefined;

  // DAG Props Converted (for interaction with Renderer)
  @Output() graphResize = new EventEmitter<GraphDims>();

  @Input('extraPadding')
  set extraPadding(padType: PadType) {
    this.$extraPadding = padType;
    this.calculateDims();
    this.updateGraphLayout();
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

  /**
   * If set to false, the contents of the DAG will not be rendered to optimize
   * for performance.
   */
  @Input() visible = true;

  @Input('nodes')
  set nodes(nodes: DagNode[]) {
    // Avoid pointer/reference stability, so that angular will pick up the
    // change, in case someone modifies the list directly
    this.$nodes = this.makeSafeNodes(nodes.slice(0));
    this.updateGraphLayoutAndReselect();
  }
  get nodes() {
    return this.$nodes;
  }

  @Input('edges')
  set edges(edges: DagEdge[]) {
    // Avoid pointer/reference stability, so that angular will pick up the
    // change, in case someone modifies the list directly
    this.$edges = edges.slice(0);
    this.updateGraphLayoutAndReselect();
  }
  get edges() {
    return this.$edges;
  }

  @Input('groups')
  set groups(groups: DagGroup[]) {
    // Avoid pointer/reference stability, so that angular will pick up the
    // change, in case someone modifies the list directly
    this.$groups = this.makeSafeNodes(groups.slice(0));
    this.nodeMap = DagNode.createNodeMap(this.nodes, this.edges, this.groups);
    this.sanitizeExpandedGroups();
    this.updateGraphLayoutAndReselect();
  }
  get groups(): EnhancedDagGroup[] {
    return this.$groups as EnhancedDagGroup[];
  }

  @ViewChildren('subDag') subDags?: QueryList<DagRaw>;

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

  @Input() features = createDAGFeatures();
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

  @Input() isPanning: boolean = false;

  constructor(
      private readonly differs: KeyValueDiffers,
      private readonly cdr: ChangeDetectorRef,
      readonly userConfigService: UserConfigService,
      private readonly liveAnnouncer: LiveAnnouncer,
      private readonly elementRef: ElementRef,
      @Optional() private readonly stateService?: DagStateService,
  ) {
    this.updateGraphLayout = debounce(this.updateGraphLayout, 50, this);
    this.updateGraphLayoutAndReselect =
        debounce(this.updateGraphLayoutAndReselect, 50, this);
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
        this.detectChanges();
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
  }

  makePathTo(id: string|string[]) {
    const idArr = id instanceof Array ? id : [id];
    return [...this.path, ...idArr];
  }

  /** Fetch cached DagNode for Group */
  getControlNodeFor(group: DagGroup): DagNode|CustomNode {
    const controlNode = this.controlNodes[group.id];
    if (!!group.customControlNode) return group.customControlNode as CustomNode;

    return controlNode as DagNode;
  }

  /** Fetch cached DagNode for Group */
  getCustomControlNodeFor(group: DagGroup) {
    return this.controlNodes[group.id] as CustomNode;
  }

  showControlNode(group: DagGroup) {
    return group.hasControlNode &&
        !(group.hideControlNodeOnExpand && this.isGroupExpanded(group));
  }

  showGroupLabel(group: DagGroup) {
    if (!group.groupLabel) return false;
    if (this.isGroupExpanded(group) && group.hasControlNode &&
        !group.hideControlNodeOnExpand) {
      return false;
    }

    return true;
  }

  broadcastIterChange(
      group: DagGroup, iterationNode: GroupIterationRecord['iterationNode']) {
    (group as any)._cachedSelection = iterationNode;
    if (group.selectedLoopId !== iterationNode.id) {
      setEnhancedGroupSelection(group, iterationNode);
      const iter = {path: this.dagPath, group, iterationNode};
      this.stateService?.setIterationChange(iter);
    }
  }

  /**
   * Generate a globally unique a11y HTML ID for a node so that screenreaders
   * know which element gets toggled by the interactables on the page
   */
  a11yIdFor(node: DagGroup|DagNode) {
    const pathString = [...this.path, node.id].join('_').replace(' ', '-');
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
    for (const node of this.nodes) {
      g.setNode(node.id, setNodeSizeProps(node, this.dims, this.collapsed));
    }
    dagre.layout(g);


    this.positionAllElementsOnGraph();
    this.updateGraphSize();
  }

  // This method is debounced in the constructor by 50ms
  updateGraphLayout() {
    this.updateGraphLayoutSync();
  }

  // This method is debounced in the constructor by 50ms
  updateGraphLayoutAndReselect() {
    const selectedPath = this.selectedNode?.path;
    const selectedId = selectedPath && isSamePath(selectedPath, this.dagPath) ?
        this.selectedNode?.node?.id :
        null;
    this.updateGraphLayoutSync();
    if (selectedId) {
      this.selectNodeById(selectedId);
    }
  }

  updateGraphLayoutSync() {
    if (!this.nodes.length && !this.groups.length) {
      this.a11ySortedNodes = [];
      this.cdr.detectChanges();
      return;
    }

    this.getNodesAndWatch();
    const g = new dagre.graphlib.Graph();
    this.dagreGraph = g;

    g.setGraph(this.convertToDagreOptions(this.layout));

    for (const node of Object.values(this.controlNodes)) {
      // We DO NOT want these in Dagre, but we do want width and height
      // calculcated for the view
      setNodeSizeProps(node, this.dims, this.collapsed);
    }
    for (const node of this.nodes) {
      g.setNode(node.id, setNodeSizeProps(node, this.dims, this.collapsed));
    }
    for (const group of this.groups) {
      if (group.expanded && !this.expandedGroups.has(group.id)) {
        this.expandedGroups.add(group.id);
      }
      g.setNode(
          group.id,
          setGroupSizeProps(
              group, this.dims, this.nodePad, this.expandedGroups,
              this.showControlNode(group)));
      Object.assign(group, {expanded: this.expandedGroups.has(group.id)});
    }
    for (const e of this.edges) {
      g.setEdge(e.from, e.to, e);
    }

    dagre.layout(g);

    this.positionAllElementsOnGraph();
    this.updateGraphSize();

    this.a11ySortedNodes = [...this.nodes, ...this.groups].sort(
        (a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
  }

  updateGraphSize() {
    const {
      height: nodeHeight,
    } = this.dims;
    const margin = this.getGraphMargin();
    const rightMostPointX = Math.max(
        ...this.getAllGraphItemsCoordinateForAxisAndOrientation('x', 'right'));
    const topMostPointY = Math.max(
        ...this.getAllGraphItemsCoordinateForAxisAndOrientation('y', 'bottom'));
    this.graphWidth = rightMostPointX + this.nodePad + margin['right'];
    this.graphHeight = topMostPointY + this.nodePad + margin['bottom'];
    this.graphResize.emit({width: this.graphWidth, height: this.graphHeight});
  }

  getGraphMargin() {
    const {graphMargin} = this.dims;
    return Object.fromEntries(
               (['left', 'right', 'top', 'bottom'] as Direction[])
                   .map(i => [i, getMargin(graphMargin, i)])) as
        {[key in Direction]: number};
  }

  positionAllElementsOnGraph() {
    const margin = this.getGraphMargin();

    const xOffset = Math.min(
        ...this.getAllGraphItemsCoordinateForAxisAndOrientation('x', 'left'));
    for (const node of this.nodes) {
      node.x += -xOffset + this.nodePad + margin['left'];
      node.y += this.nodePad + margin['top'];
      node.cssTransform = getTransformTranslateString(node.x, node.y);
    }
    for (const group of this.groups) {
      group.x += -xOffset + this.nodePad + margin['left'];
      group.y += this.nodePad + margin['top'];
      group.cssTransform =
          getTransformTranslateString(group.x, group.y + group.padY! / 2);
    }
    for (const edge of this.edges) {
      if (this.theme.edgeStyle === 'snapped') {
        this.snapEdgeConnectionPoints(edge);
      } else {
        for (const p of edge.points || []) {
          p.x += -xOffset + this.nodePad + margin['left'];
          p.y += this.nodePad + margin['top'];
        }
      }
      this.resnapPointsForGroups(edge);
    }
  }

  getAllGraphItemsCoordinateForAxisAndOrientation(
      dim: 'x'|'y', orient: Orientation = 'center'): number[] {
    const {getNodeWidth, height, iconSpaceWidth} = this.dims;
    let nodeOff = (node: CustomNode|DagNode|DagGroup) => {
      const type = this.getNodeType(node);
      if (type === 'group' || node instanceof CustomNode) {
        return (dim === 'x' ? node.width : node.height) / 2;
      }
      if (orient === 'bottom' && dim === 'y') {
        return node.height / 2;
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
      this.edges.map(e => (e.points || []).map(p => p[dim])),
    ].flat(3)
        .filter(i => !isNaN(i));
  }

  // Only for tests
  detectChanges() {
    this.cdr.detectChanges();
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

    const layoutDirection = this.layout.rankDirection ?? 'TB';

    const startHorizontalAnchor = edge.startSnapPoint?.horizontalPercent ??
        DEFAULT_EDGE_START_SNAP_ANCHORS[layoutDirection].horizontalPercent;
    const startVerticalAnchor = edge.startSnapPoint?.verticalPercent ??
        DEFAULT_EDGE_START_SNAP_ANCHORS[layoutDirection].verticalPercent;
    const endHorizontalAnchor = edge.endSnapPoint?.horizontalPercent ??
        DEFAULT_EDGE_END_SNAP_ANCHORS[layoutDirection].horizontalPercent;
    const endVerticalAnchor = edge.endSnapPoint?.verticalPercent ??
        DEFAULT_EDGE_END_SNAP_ANCHORS[layoutDirection].verticalPercent;

    const startPoint = {
      x: fromTarget.x +
          edgeAttachmentPoint(
              fromTarget.width,
              startHorizontalAnchor,
              edge.startSnapPoint?.horizontalOffset ?? 0,
              ),
      y: fromTarget.y +
          edgeAttachmentPoint(
              fromTarget.height,
              startVerticalAnchor,
              edge.startSnapPoint?.verticalOffset ?? 0,
              ),
    };
    const endPoint = {
      x: toTarget.x +
          edgeAttachmentPoint(
              toTarget.width,
              endHorizontalAnchor,
              edge.endSnapPoint?.horizontalOffset ?? 0,
              ),
      y: toTarget.y +
          edgeAttachmentPoint(
              toTarget.height,
              endVerticalAnchor,
              edge.endSnapPoint?.verticalOffset ?? 0,
              ),
    };

    edge.points = [startPoint, endPoint];
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
    if (target instanceof DagNode || !this.isGroupExpanded(target) ||
        !this.showControlNode(target)) {
      return;
    }
    const groupF = target as EnhancedDagGroup;
    if (!groupF.expandedDims) return;
    const topBorderY =
        groupF.y + groupF.padY! / 2 - groupF.expandedDims.height / 2;
    // Ignore if anchor point is below the top border of the group, coordinates
    // grow as they are lower!
    const anchorPt = (edge.points || []).slice(-1)[0];
    if (!anchorPt || anchorPt.y - topBorderY > 2) return;
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

  refBadgeClick(
      refNode: DagNode|DagGroup, ref: NodeRef, $event?: MouseEvent|Event) {
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
    const isGroupExpanded = this.isGroupExpanded(group);

    // TODO: A11y announcements translation b/300590261
    if (isGroupExpanded && value !== true) {
      const groupToCollapse =
          group instanceof DagGroup ? group : this.nodeMap.groups[id]?.group;
      if (groupToCollapse) groupToCollapse.expanded = false;
      this.expandedGroups.delete(id);
      this.liveAnnouncer?.announce('Collapsed');
      this.onGroupExpandToggled.emit({groupId: id, isExpanded: false});
      this.stateService?.setGroupExpandToggled(
          {groupId: id, isExpanded: false});
    } else if (!isGroupExpanded && value !== false) {
      this.expandedGroups.add(id);
      this.liveAnnouncer?.announce('Expanded');
      this.onGroupExpandToggled.emit({groupId: id, isExpanded: true});
      this.stateService?.setGroupExpandToggled({groupId: id, isExpanded: true});
    }
    this.updateGraphLayout();
    this.detectChanges();
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
    return `${this.path.join('-')}_arrow_${from}_${to}`;
  }

  getEdgeMarkerEndId(edge: DagEdge|undefined): string|undefined {
    const markerStyle = edge?.toMarkerStyle || this.theme.edgeToMarkerStyle;
    if (!edge || !edge.points || markerStyle === 'circle' ||
        markerStyle === 'hidden') {
      return undefined;
    }
    return `url(#${this.getArrowMarkerId(edge)})`;
  }

  getFromArrowMarkerId(edge: DagEdge|undefined): string {
    if (!edge || !edge.points) return '';
    const [from, to] = [edge.from, edge.to].map(s => s.replace(/[^\w]/g, '-'));
    return `${this.path.join('-')}_arrow_${to}_${from}`;
  }

  getEdgeMarkerStartId(edge: DagEdge|undefined): string|undefined {
    const markerStyle = edge?.fromMarkerStyle || this.theme.edgeFromMarkerStyle;
    if (!edge || !edge.points || markerStyle === 'circle' ||
        markerStyle === 'hidden') {
      return undefined;
    }
    return `url(#${this.getFromArrowMarkerId(edge)})`;
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

  calculateBezierCurvePoints(points: Point[]): Point[] {
    /* Generate points on the curve for more accurate label positions */
    const curveKey = points.map(p => `[${p.x},${p.y}]`).join(',');
    const cachedBezier = this.memoizedEdgeCurvePoints[curveKey];
    const bezierPoints =
        cachedBezier ? cachedBezier : getPointsOnBezierCurveDeCasteljau(points);
    /**
     * Save calculated curve points to avoid recalculation due to template
     * function calls
     */
    if (!cachedBezier) {
      this.memoizedEdgeCurvePoints[curveKey] = bezierPoints;
    }

    return bezierPoints;
  }

  getMiddleEdgePoint(edge: DagEdge): PointWithTransform|undefined {
    const {points = []} = edge;
    if (points.length < 1) {
      return undefined;
    }

    /* Generate points on the curve for more accurate label positions */
    const bezierPoints = this.calculateBezierCurvePoints(points);

    const distances = bezierPoints
                          .map((p, i) => {
                            if (!i) return 0;
                            const dist =
                                euclideanDistance(p, bezierPoints[i - 1]);
                            return dist;
                          })
                          .slice(1);
    let remainingDistance = distances.reduce((p, c) => p + c, 0) / 2;
    for (let i = 0; i < bezierPoints.length; i++) {
      const thisDistance = distances[i];
      if (thisDistance < remainingDistance) {
        remainingDistance -= thisDistance;
        continue;
      }
      // We can get the midpoint within the current line segment
      const [ptA, ptB] = bezierPoints.slice(i, i + 2);
      const ratio = remainingDistance / thisDistance;
      const midPoint = {
        x: ptA.x + (ptB.x - ptA.x) * ratio,
        y: ptA.y + (ptB.y - ptA.y) * ratio,
      };
      return {
        x: midPoint.x,
        y: midPoint.y,
        cssTransform: getTransformTranslateString(midPoint.x, midPoint.y)
      } as PointWithTransform;
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

  makeSafeNode(node: DagNode|DagGroup|undefined, isControlNode?: boolean):
      DagNode|undefined {
    if (!node || node instanceof DagGroup) return;
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
      if (!this.showControlNode(group)) continue;
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

  getEdges(node: DagNode|DagGroup): DagEdge[] {
    return this.edges.filter(e => e.from === node.id);
  }

  onNodeWheel(event: WheelEvent) {
    if (this.features.naturalScrolling && !isPinch(event)) {
      const end = this.elementRef.nativeElement;
      let node = null;
      for (node = event.target as Element; node && node !== end;
           node = node.parentElement) {
        // Avoid triggering canvas scroll when over scrolling DAG node content
        // that will scroll.
        if (willScroll(node, event)) {
          event.stopPropagation();
          return;
        }
      }
    }
  }
}

function willScroll(node: Element, event: WheelEvent) {
  return willScrollX(node, event) || willScrollY(node, event);
}

function willScrollX(node: Element, event: WheelEvent) {
  // As documented on MDN, scrollLeft stays within its prescribed bounds no
  // matter what it is set to. So, if it can't be changed then the element
  // won't scroll.
  // http://go/mdn/API/Element/scrollLeft
  const orig = node.scrollLeft;
  node.scrollLeft += event.deltaX;
  const updated = node.scrollLeft;
  node.scrollLeft = orig;
  return updated !== orig;
}

function willScrollY(node: Element, event: WheelEvent) {
  // As documented on MDN, scrollTop stays within its prescribed bounds no
  // matter what it is set to. So, if it can't be changed then the element
  // won't scroll.
  // http://go/mdn/API/Element/scrollTop
  const orig = node.scrollTop;
  node.scrollTop += event.deltaY;
  const updated = node.scrollTop;
  node.scrollTop = orig;
  return updated !== orig;
}

@NgModule({
  imports: [
    CommonModule,
    WorkflowGraphIconModule,
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
