
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

import {CdkDragEnd, CdkDragMove, CdkDragStart, DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ElementRef, EventEmitter, Input, NgModule, OnDestroy, OnInit, Optional, Output, TemplateRef, ViewChild} from '@angular/core';
import * as dagre from 'dagre';  // from //third_party/javascript/typings/dagre
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ShortcutService} from './a11y/shortcut.service';
import {DagStateService} from './dag-state.service';
import {STATE_SERVICE_PROVIDER} from './dag-state.service.provider';
import {assert, baseColors, BLUE_THEME, clampVal, CLASSIC_THEME, convertStateToRuntime, createDAGFeatures, createDefaultZoomConfig, createNewSizeConfig, DagTheme, DEFAULT_LAYOUT_OPTIONS, DEFAULT_THEME, defaultFeatures, defaultZoomConfig, FeatureToggleOptions, generateTheme, getMargin, isPoint, LayoutOptions, Logger, MinimapPosition, nanSafePt, NODE_HEIGHT, NODE_WIDTH, NodeState, OrientationMarginConfig, RankAlignment, RankDirection, RankerAlgorithim, SCROLL_STEP_PER_DELTA, SizeConfig, SVG_ELEMENT_SIZE, ZoomConfig} from './data_types_internal';
import {DagRaw, DagRawModule, EnhancedDagGroup, GraphDims} from './directed_acyclic_graph_raw';
import {DagLogger} from './logger/dag_logger';
import {CustomNode, DagEdge, DagGroup, DagNode, GraphSpec, GroupIterationRecord, isDagreInit, NodeMap, NodeRef, Point, SelectedNode} from './node_spec';
import {ResizeEventData, ResizeMonitorModule} from './resize_monitor_directive';
import {DagSidebar} from './sidebar';
import {debounce} from './util_functions';

// tslint:disable:g3-no-void-expression

/**
 * Expose internal Shared Objects
 */
export {
  baseColors,
  BLUE_THEME,
  CLASSIC_THEME,
  createDAGFeatures,
  createNewSizeConfig,
  DEFAULT_LAYOUT_OPTIONS as DEFAULT_DAGRE_CONFIG,
  DEFAULT_THEME,
  defaultFeatures,
  defaultZoomConfig,
  FeatureToggleOptions,
  generateTheme,
  getMargin,
  GroupIterationRecord,
  LayoutOptions as DagreOptions,
  MinimapPosition,
  NODE_HEIGHT,
  NODE_WIDTH,
  NodeState,
  OrientationMarginConfig,
  RankAlignment as DagreRankAlignment,
  RankDirection as DagreRankDirection,
  RankerAlgorithim as DagreRankerAlgorithm,
  SizeConfig,
  SVG_ELEMENT_SIZE,
  ZoomConfig
};

type DagFieldType = DagNode|DagGroup|DagEdge;

/** Start of drag context required to finalize and preview drags */
interface GraphPanContext {
  graph: Point;
}

/** Camera panning options */
interface CameraMoveOpts {
  /** Should the panning be animated */
  animate?: boolean;
  /** The camera should center on this point, or use as its top-left anchor */
  align?: 'center'|'top-left';
}

/**
 * Renders the workflow DAG.
 */
@Component({
  selector: 'ai-dag-renderer',
  styleUrls: ['directed_acyclic_graph.scss'],
  templateUrl: 'directed_acyclic_graph.ng.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    STATE_SERVICE_PROVIDER,
  ],
})
export class DirectedAcyclicGraph implements AfterViewInit, OnInit, OnDestroy {
  destroy = new Subject<void>();

  readonly nodePad = 10;

  // DOM Elements
  @ViewChild('mmViewBox') private readonly mmViewBox!: ElementRef;
  @ViewChild('dagWrapper') private readonly dagWrapper!: ElementRef;
  @ViewChild('rootDag') private readonly rootDag?: DagRaw;
  @ContentChild(DagSidebar) readonly sidebarRef?: DagSidebar;

  // Dag Related Props
  private $sizeConfig = SVG_ELEMENT_SIZE();
  private dims = this.sizeConfig.dims;
  private $nodes: DagNode[] = [];
  private $edges: DagEdge[] = [];
  private $groups: DagGroup[] = [];
  private $logger?: Logger;
  layout: LayoutOptions = DEFAULT_LAYOUT_OPTIONS;
  dagreGraph?: dagre.graphlib.Graph;
  nodeMap: NodeMap = {nodes: {}, groups: {}};
  graphWidth: number = 0;
  graphHeight: number = 0;
  graphX: number = 0;
  graphY: number = 0;
  private $graphPanning = false;
  graphPanningCtx?: GraphPanContext;
  graphResetPan: Point = {x: 0, y: 0};
  zoom: number = 1;
  collapsed = true;
  zoomStepConfig = createDefaultZoomConfig({step: defaultZoomConfig.step / 2});
  themeConfig = DEFAULT_THEME;
  animateMove = false;
  mousedown = false;
  private $customNodeTemplates: Record<string, TemplateRef<any>> = {};
  private $features = defaultFeatures;

  private readonly uniqueId: string;

  set graphPanning(panning: boolean) {
    this.$graphPanning = panning;
    if (this.sidebarRef) this.sidebarRef.disableMouseInteractions = panning;
  }
  get graphPanning() {
    return this.$graphPanning;
  }

  // State props
  rootDagInitialized = false;
  private observers: Subscription[] = [];
  private $selectedNode: SelectedNode|null = null;

  // Minimap Props
  mmX: number = 0;
  mmY: number = 0;
  private $lazymmPos: Point = {x: 0, y: 0};
  set lazymmPos(val: Point) {
    this.$lazymmPos = val;
    this.mmX = val.x;
    this.mmY = val.y;
  }
  get lazymmPos() {
    return this.$lazymmPos;
  }
  lazymmY: number = 0;
  mmLazyZoom: number = this.zoom;
  mmWidth: number = 0;
  mmHeight: number = 0;
  mmScale: number = 0;
  mmWinScale: number = 0;
  mmWinWidth: number = 0;
  mmWinHeight: number = 0;
  mmPressed = false;
  mmFocused = false;
  canvasWidth: number = 0;
  canvasHeight: number = 0;
  lastResizeEv: ResizeEventData = {width: 0, height: 0};
  minimapInnerWidth = new BehaviorSubject(this.mmWidth);
  minimapInnerHeight = new BehaviorSubject(this.mmHeight);
  zoomReset$?: Subscription;

  @Input('theme')
  set theme(theme: DagTheme) {
    this.stateService.setTheme(theme);
  }
  get theme() {
    return this.themeConfig;
  }

  @Input() enableMinimap = true;

  @Input() minimapPosition: MinimapPosition = 'top';

  @Input() loading = false;

  /**
   * This property allows the DAG to treat `graphSpec` reassignments as an edit
   * rather than a recreation of the DAG. This is common for ORM / Skeleton
   * based re-constructions which make the DAG think that a reassignment
   * happened instead of a CRUD update. This can be alleviated by copying over
   * some Dagre initialization data from the old data the new nodes.
   *
   * ___Bear in mind:__ Doing this will have a small performance hit_
   */
  @Input() optimizeForOrm = false;

  @Input('sizeConfig')
  set sizeConfig(config) {
    this.$sizeConfig = config;
    this.dims = config.dims;
  }
  get sizeConfig() {
    return this.$sizeConfig;
  }

  @Input('nodes')
  set nodes(nodes: DagNode[]) {
    if (this.optimizeForOrm) this.copyDagreInit(this.nodes, nodes);
    this.$nodes = nodes;
    this.isListCrudUpdated(nodes) || this.markGraphDirty();
  }
  get nodes() {
    return this.$nodes;
  }
  @Input('groups')
  set groups(groups: DagGroup[]) {
    if (this.optimizeForOrm) this.copyDagreInit(this.groups, groups);
    this.$groups = groups;
    this.validateOutdatedSelection();
    this.isListCrudUpdated(groups) || this.markGraphDirty();
  }
  get groups() {
    return this.$groups;
  }

  @Input('edges')
  set edges(edges: DagEdge[]) {
    if (this.optimizeForOrm) this.copyDagreInit(this.edges, edges);
    this.$edges = edges;
    this.isListCrudUpdated(edges) || this.markGraphDirty();
  }
  get edges() {
    return this.$edges;
  }

  // This type of initialization is okay here, as we only care about emitting
  // when an internal piece of code changes this variable.
  @Input('selectedNode')
  set selectedNode(n: SelectedNode|null) {
    this.stateService.setSelectedNode(n);
  }
  get selectedNode() {
    return this.$selectedNode;
  }
  @Output() selectedNodeChange = new EventEmitter<SelectedNode|null>();
  @Output() groupIterationChanged = new EventEmitter<GroupIterationRecord>();

  @Input() hoveredEdge?: DagEdge;

  @Input() followNode: NodeRef|null = null;

  @Input('features')
  set features(f: FeatureToggleOptions) {
    this.$features = f;
    this.stateService.setFeatures(f);
  }
  get features() {
    return this.$features;
  }

  @Input('logger')
  set logger(logger: Logger|undefined) {
    if (logger) {
      this.$logger = logger;
      this.dagLogger?.setLogger(logger);
    }
  }
  get logger() {
    return this.$logger!;
  }

  @Input('zoomStepConfig')
  set onZoomConfigSet(z: ZoomConfig) {
    this.zoomStepConfig = z;
    this.handleResize();
  }

  @Input('collapsedArtifacts')
  set onCollapsedSet(c: boolean) {
    this.stateService.setCollapsed(c);
  }

  @Input('zoom')
  set onZoomSet(zoom: number) {
    this.zoomingTo(zoom);
  }
  @Output() zoomChange = new EventEmitter();

  @Input('layout')
  set onLayoutSet(layout: LayoutOptions|undefined) {
    this.layout = {
      ...DEFAULT_LAYOUT_OPTIONS,
      ...layout || {},
    };
    this.stateService.setLayout(this.layout);
  }

  @Input('customNodeTemplates')
  set customNodeTemplates(templates: Record<string, TemplateRef<any>>) {
    this.$customNodeTemplates = templates;
    this.stateService.setCustomNodeTemplates(templates);
  }
  get customNodeTemplates() {
    return this.$customNodeTemplates;
  }

  @Input() customMinimapNodeTemplates: Record<string, TemplateRef<any>> = {};

  constructor(
      private readonly cdr: ChangeDetectorRef,
      @Optional() private readonly dagLogger: DagLogger|null,
      private readonly shortcutService: ShortcutService,
      readonly stateService: DagStateService,
  ) {
    this.focusElement = debounce(this.focusElement, 50, this);
    this.onVisualUpdate = debounce(this.onVisualUpdate, 50, this);
    this.handleResizeAsync = debounce(this.handleResizeAsync, 50, this);
    this.resetAnimationMode = debounce(this.resetAnimationMode, 1200, this);
    this.resolveReference = this.resolveReference.bind(this);
    this.uniqueId = `${Date.now()}`;
  }

  /** Provides unique id attribute to grid background pattern declaration. */
  getGridPatternUniqueId() {
    return `cfc-dag-grid-pattern-${this.uniqueId}`;
  }

  /** Provides url to grid background pattern declaration. */
  getGridPatternUrl() {
    return `url(#${this.getGridPatternUniqueId()})`;
  }

  detectChanges() {
    this.cdr.detectChanges();
  }

  private stepCanvasOffset(direction: 'up'|'right'|'down'|'left') {
    const newPt = {x: -this.graphX, y: -this.graphY};
    switch (direction) {
      case 'up':
        newPt.y -= 100;
        break;
      case 'right':
        newPt.x += 100;
        break;
      case 'down':
        newPt.y += 100;
        break;
      case 'left':
        newPt.x -= 100;
        break;
      default:
    }
    this.mmWindowPan(this.convertCanvasPtToMinimap(newPt));
  }

  ngOnInit() {
    this.observers = this.stateService.listenAll({
      collapsed: v => {
        this.collapsed = v;
      },
      features: v => {
        this.$features = v;
        this.handleResize();
      },
      layout: v => {
        this.layout = v;
      },
      selectedNode: v => {
        this.$selectedNode = v;
        // Emit is here so it's a one time fire rather than twice
        this.selectedNodeChange.emit(v);
      },
      theme: v => {
        this.themeConfig = v;
        this.detectChanges();
      },
      expandPath: path => {
        this.expandUntil(path);
      },
      iterationChange: iter => {
        iter && this.groupIterationChanged.emit(iter);
      },
    });

    this.zoomReset$ = this.stateService.zoomReset.pipe(takeUntil(this.destroy))
                          .subscribe(() => this.resetZoom());

    this.shortcutService.registerShortcutAction(
        'CANVAS_UP', () => this.stepCanvasOffset('up'));
    this.shortcutService.registerShortcutAction(
        'CANVAS_RIGHT', () => this.stepCanvasOffset('right'));
    this.shortcutService.registerShortcutAction(
        'CANVAS_DOWN', () => this.stepCanvasOffset('down'));
    this.shortcutService.registerShortcutAction(
        'CANVAS_LEFT', () => this.stepCanvasOffset('left'));
  }

  ngOnDestroy() {
    this.stateService.destroyAll(this.observers);
    this.destroy.next();
    this.destroy.complete();
  }

  ngAfterViewInit() {
    if (!this.enableMinimap || !this.rootDagInitialized) return;
    assert(this.mmViewBox instanceof ElementRef, 'mmViewBox set by @ViewChild');
  }

  /**
   * Invalidate Graph Loaded state, so that the DAG waits on children before
   * re-rendering the minimap
   *
   * We **do not** want to do this when a CRUD update happens, because node
   * added would cause the minimap to flash, so use `isListCrudUpdated()` to
   * make sure if this function should run!
   */
  markGraphDirty() {
    this.rootDagInitialized = false;
  }

  /**
   * Scan for an element that seems to have been dagre initialized.
   *
   * The purpose of this function is act as a detecter that ***the graph seems
   * like it is*** is simply being CRUD updated (like a simple addition or
   * removal)
   *
   * This allows us to then conditionally mark Graph as dirty **only** if all
   * elements in the new list are new (which indicates a new dataset was instead
   * added)
   *
   * _**Note:** At some point this could be used as an indicator to toggle
   * automatic loading state, rather than by input from user_
   */
  isListCrudUpdated(list: DagNode[]|DagEdge[]|DagGroup[]) {
    if (!list.length) return true;
    return list.some((e: typeof list[0]) => isDagreInit(e));
  }

  isDagEdge(edge: DagFieldType): edge is DagEdge {
    return 'from' in edge;
  }

  getIdFromDagObject(obj: DagFieldType) {
    return this.isDagEdge(obj) ? `edge-${obj.from}->${obj.to}` : obj.id;
  }

  makeIdMapFrom<T extends DagNode[]|DagGroup[]|DagEdge[]>(arr: T):
      Record<string, T[0]> {
    return Object.fromEntries(
        arr.map((e: T[0]) => [this.getIdFromDagObject(e), e]));
  }

  /**
   * Reads old initialization dagre config and copies it to the new one if
   * matches are found, so that the DAG doesn't flash when the update re-runs.
   *
   * This is achieved by copying the `x`,`y` props from the nodes / edges /
   * groups in the old DAG Entries to the new entries
   */
  copyDagreInit<T extends DagNode[]|DagGroup[]|DagEdge[]>(
      oldArr: T,
      newArr: T,
  ) {
    const oldRef = this.makeIdMapFrom(oldArr);
    for (const elem of newArr) {
      const oldMatch = oldRef[this.getIdFromDagObject(elem)];
      if (!oldMatch) continue;
      if (this.isDagEdge(oldMatch) && oldMatch.points) {
        const {points} = oldMatch;
        Object.assign(elem, {points});
        continue;
      }
      const {x, y} = oldMatch as Point;
      if (isNaN(x)) continue;
      Object.assign(elem, {x, y});
      // `elem` will always be the same type as `oldMatch` but TS is not that
      // aware
      if (oldMatch instanceof DagGroup && elem instanceof DagGroup) {
        if (!isNaN(oldMatch.width)) {
          const {expandedDims, padY, width, height, _cachedSelection} =
              oldMatch as EnhancedDagGroup;
          Object.assign(
              elem, {expandedDims, width, height, padY, _cachedSelection});
        }

        // Recurse for sub-dag graphspecs as well
        this.copyDagreInit(oldMatch.nodes, elem.nodes);
        this.copyDagreInit(oldMatch.edges, elem.edges);
        this.copyDagreInit(oldMatch.groups, elem.groups);
      }
    }
  }

  /**
   * Scans to see if the assigned groups contain the `selectedNode`, if not
   * reset to `null`
   */
  validateOutdatedSelection() {
    if (!this.selectedNode) return;
    const {node, path} = this.selectedNode;
    const id = node.id;
    try {
      const group = DagGroup.navigatePath(this.getGraphSpec(), path);
      if (!group.nodes.find(n => n.id === id) &&
          !group.groups.find(g => g.id === id)) {
        this.selectedNode = null;
      }
    } catch {
      // Invalid path means that it's outdated for sure
      this.selectedNode = null;
    }
  }

  nodeOrGroupTrack(index: number, n: DagNode|DagGroup) {
    return n.id;
  }

  /**
   * Expand all `sub-dag`s along the path specified
   *
   * @return the number of expansions performed (not including previously
   *     expanded segments)
   */
  expandUntil(path: string[]): number {
    let dagEl = this.rootDag;
    let expansions = 0;
    path = [...path];
    while (path.length) {
      const segment = path.shift()!;
      const parent = dagEl;
      dagEl = dagEl?.subDags?.find(sub => sub.dagPath.slice(-1)[0] === segment);
      if (!dagEl) break;
      if (parent?.toggleExpand(segment, true)) {
        // this will be true when expansion succeeded (not when it was a no-op)
        expansions++;
      }
    }
    return expansions;
  }

  getGraphSpec(): GraphSpec {
    return {
      nodes: this.nodes,
      edges: this.edges,
      groups: this.groups,
    };
  }

  getSidebarDims(dims: MinimapPosition) {
    if (dims !== this.minimapPosition) {
      return 0;
    }
    const pad = 12;
    const sidebarOffset = this.mmHeight + 2 * pad;
    if (!this.lastResizeEv.height) {
      return sidebarOffset;
    }
    return Math.min(sidebarOffset, this.lastResizeEv.height / 2);
  }

  /** Resolved a `NodeRef` to its actual node (be it a group or a node) */
  resolveReference(ref: NodeRef): DagNode|DagGroup {
    const destLoc = DagGroup.navigatePath(this as GraphSpec, ref.path);
    const {nodes, edges, groups} = destLoc;
    const nodeMap = DagNode.createNodeMap(nodes, edges, groups);
    return nodeMap.nodes[ref.id]?.node || nodeMap.groups[ref.id]?.group;
  }

  async sleep(time: number) {
    await new Promise(res => {
      setTimeout(res, time);
    });
  }

  /** Keyboard controls for minimap navigation */
  kbdMinimapPan(event: KeyboardEvent) {
    const {mmX, mmY} = this;
    const {key, shiftKey, ctrlKey} = event;
    const pt: Point = {x: mmX, y: mmY};
    let scrollAmt: number;

    // Modifier on move intensity
    if (shiftKey && ctrlKey) {
      scrollAmt = 50;
    } else if (ctrlKey) {
      scrollAmt = 20;
    } else if (shiftKey) {
      scrollAmt = 1;
    } else {
      scrollAmt = 5;
    }

    // Directional point translation
    switch (key) {
      case 'ArrowLeft':
        pt.x -= scrollAmt;
        break;
      case 'ArrowRight':
        pt.x += scrollAmt;
        break;
      case 'ArrowUp':
        pt.y -= scrollAmt;
        break;
      case 'ArrowDown':
        pt.y += scrollAmt;
        break;
      default:
        return;
    }

    this.mmWindowPan(pt);
  }

  /** ViewBox controls for minimap navigation */
  viewBoxMinimapPan(ev: CdkDragMove) {
    this.dagLogger?.logPanning(
        'drag_minimap', this.zoom, ev.pointerPosition.x, ev.pointerPosition.y);
    this.mmWindowPan(ev);
  }

  /**
   * Brings the target reference node as close to the center of the DAG as
   * possible
   *
   * The API is very similar to `domEl.scrollIntoView()`
   */
  async scrollNodeIntoView(ref: NodeRef, opts?: CameraMoveOpts) {
    const expandedGroups = this.expandUntil(ref.path);
    // Guess on how long to wait before centering camera...
    await this.sleep(260 * expandedGroups);
    const offset = this.getNodeOffset(ref);
    const x = offset.x * this.zoom;
    const y = offset.y * this.zoom;

    return this.centerCameraOn({x, y}, opts);
  }

  /**
   * Calculate Node offset of a Group / Node no matter how nested it is in the
   * DAG
   *
   * Unique identification of the node is achieved with `NodeRef`. This method
   * recursively accumulates offsets from the root DAG till it has the total
   * offset value.
   *
   * _**Note:** This returns the center offset of the node, **NOT** the top-left
   * offset_
   */
  getNodeOffset(ref: NodeRef) {
    const node = this.resolveReference(ref);
    const offset: Point = {x: 0, y: 0};
    let groups = this.groups;
    for (const segment of ref.path) {
      const segGroup = groups.find(g => g.id === segment) as EnhancedDagGroup;
      groups = segGroup?.groups ?? [];
      const width = segGroup.expandedDims?.width || segGroup.width;
      const height = segGroup.expandedDims?.height || segGroup.height;
      offset.x += segGroup.x - width / 2;
      offset.y += segGroup.y - height / 2;
    }
    offset.x += node.x;
    offset.y += node.y;
    return offset;
  }

  /**
   * Performs updates required when a visual update takes place:
   * - Follow a node if the Graph has an active `followNode` reference
   * - Inject the minimap height to the sidebar if possible
   *
   * _**Note:** this method is debounced by 50ms_
   */
  onVisualUpdate() {
    this.followNode && this.scrollNodeIntoView(this.followNode);
  }

  /**
   * Aware whether focus happened via mouse or keyboard, and accordingly
   * schedules the focus handler to run or not
   */
  focusElementFiltered(e: FocusEvent) {
    if (!e.target || this.mousedown) return;
    this.focusElement(e);
  }

  /**
   * Handles any internal focus events that fire when this event occurs
   *
   * _**Note:** this method is debounced by 50ms_
   */
  focusElement(e: FocusEvent) {
    let el = e.target as HTMLElement;
    const offset: Point = {
      x: el.offsetLeft,
      y: el.offsetTop,
    };
    el = el.offsetParent as HTMLElement;
    while (el && !el.classList.contains('root-dag')) {
      const {offsetLeft, offsetTop, offsetWidth, offsetHeight} = el;

      offset.x += offsetLeft - (offsetLeft ? offsetWidth / 2 : 0);
      offset.y += offsetTop - (offsetTop ? offsetHeight / 2 : 0);

      el = el.offsetParent! as HTMLElement;
    }
    offset.x *= this.zoom;
    offset.y *= this.zoom;
    this.centerCameraOn(offset);
  }

  resizeGraph(dims: GraphDims) {
    if (this.rootDagInitialized && this.graphWidth === dims.width &&
        this.graphHeight === dims.height) {
      this.onVisualUpdate();
      return;
    }
    this.graphWidth = dims.width;
    this.graphHeight = dims.height;
    this.rootDagInitialized = true;
    this.handleResize();
  }

  handleResizeWithEvent(resizeEventData: ResizeEventData) {
    this.lastResizeEv = resizeEventData;
    this.handleResize();
  }

  handleResize() {
    if (this.rootDagInitialized) return this.handleResizeAsync();
    return this.handleResizeSync();
  }

  /** This method is asyncified in the constructor by using `debounce` */
  private handleResizeAsync() {
    this.handleResizeSync();
  }

  /**
   * Handle Resizing checks for minimap for Graph
   *
   * `mmLazyZoom` is created to only updated minimap's zoom when this function
   * actually updates the view
   */
  private handleResizeSync(withoutPanning?: boolean) {
    const resizeEventData = this.lastResizeEv;
    const {width, height} = resizeEventData;
    const zoom = Math.min(this.zoom, 1);
    const canvasWidth = Math.max(width, this.graphWidth * zoom);
    const canvasHeight = Math.max(height, this.graphHeight * zoom);
    const mmWidth = this.dims.minimapWidth;
    const mmScale = mmWidth / this.graphWidth;
    const mmWinHeight = mmScale * height;
    const mmWinWidth = mmScale * width;
    const mmHeight = this.graphHeight * mmScale;
    Object.assign(this, {
      mmLazyZoom: zoom,
      mmWidth,
      mmHeight,
      mmScale,
      mmWinWidth,
      mmWinHeight,
      canvasWidth,
      canvasHeight,
    });
    // Reposition the DAG so it's within bounds (account for features)
    if (!withoutPanning) {
      if (this.enableMinimap) {
        this.mmBgClickPan();
      } else {
        this.graphPan('validate');
      }
    }
    this.minimapInnerWidth.next(
        this.graphWidth * this.mmScale * Math.min(this.mmLazyZoom, 1));
    this.minimapInnerHeight.next(
        this.graphHeight * this.mmScale * Math.min(this.mmLazyZoom, 1));
    this.detectChanges();
    this.onVisualUpdate();
  }

  /**
   * Minimap view window panning handler
   * @param freeMove Turning off dag area boundaries control. If true, can pan
   *     out of the visible minimap area.
   */
  mmWindowPan(ev: CdkDragMove|Point, freeMove?: boolean) {
    let newPt: Point = {x: 0, y: 0};

    // Calculating the graph's offset from the top and left edges of the
    // available canvas, when the zoom is under 1.
    const offsets = this.zoom > 1 ? {x: 0, y: 0} : {
      x: (this.graphWidth * this.zoom - this.graphWidth) / -2,
      y: (this.graphHeight * this.zoom - this.graphHeight) / -2,
    };

    const {x: mmOffsetLeft, y: mmOffsetTop} = this.convertCanvasPtToMinimap(offsets);

    if (isPoint(ev)) {
      if (freeMove) {
        // Positioning the view area to the given coordinates without control
        this.lazymmPos = newPt = ev;
      } else {
        const {x, y} = ev;
        const {winH, winW} = this.getMinimapWindowDims();

        // This point should be a minimap scoped point.
        const clampedPt = {
          x: clampVal(
                 x, -mmOffsetLeft,
                 Math.max(this.mmWidth - winW) - mmOffsetTop) ||
              0,
          y: clampVal(
                 y, -mmOffsetLeft,
                 Math.max(this.mmHeight - winH) - mmOffsetTop) ||
              0,
        };
        this.lazymmPos = newPt = clampedPt;
      }
    } else {
      if (!this.enableMinimap) return;  // Cannot happen, confidence check
      const {offsetLeft, offsetTop} = ev.source.element.nativeElement;
      const {x, y} = nanSafePt(ev.source.getFreeDragPosition());
      this.mmX = newPt.x = x + offsetLeft - mmOffsetLeft;
      this.mmY = newPt.y = y + offsetTop - mmOffsetTop;
    }
    newPt = this.convertMinimapPtToCanvas(newPt);
    this.graphX = -newPt.x;
    this.graphY = -newPt.y;
    this.detectChanges();
  }

  /**
   * Centers the viewbox of the DAG (along with the minimap) to center on the
   * coordinates supplied
   *
   * _**Note:** Will accept point as positive coords (not negative offsets)_
   */
  async centerCameraOn(pt: Point, {
    animate = true,
    align = 'center',
  }: CameraMoveOpts = {}) {
    if (align === 'center') {
      const {width, height} = this.lastResizeEv;
      // Don't try this when the ViewBox dims aren't known
      if (!width || !height) return;
      pt.x -= width / 2;
      pt.y -= height / 2;
    }
    const mmPt = this.convertCanvasPtToMinimap(pt);

    // Animation
    this.resetAnimationMode();  // We run this immediately, since it will
                                // debounce run after 1.1s
    this.animateMove = animate;
    this.detectChanges();
    await this.sleep(10);
    this.mmWindowPan(mmPt);
    this.detectChanges();
    animate && await this.sleep(1000);
  }

  /**
   * Reset the `animateMove` property on the DAG, but is debounced by 1.1s so
   * competing calls to reset in close enough interactions don't force a snap
   */
  resetAnimationMode() {
    this.animateMove = false;
    this.detectChanges();
  }

  /**
   * Click to pan Minimap Window to that location
   *
   * If run without args, then just realign the ViewWindow within it's bounds
   */
  mmBgClickPan(ev?: MouseEvent) {
    assert(
        this.enableMinimap,
        '`mmBgClickPan` should only run when minimap is enabled!');
    const $mmWindow = this.mmViewBox?.nativeElement;
    if (ev && ev.target === $mmWindow) return;
    const {winH, winW} = this.getMinimapWindowDims();
    const {offsetLeft = 0, offsetTop = 0} = this.mmViewBox?.nativeElement || {};
    // Pan while offsetting click by half of the width
    // We're also converting a center aligned point to a top-left point
    // When zoom is under 1, we must deduct the offset of the viewbox
    const x = ev ? ev.offsetX - winW / 2 - offsetLeft : this.mmX;
    const y = ev ? ev.offsetY - winH / 2 - offsetTop : this.mmY;

    this.dagLogger?.logPanning('click_minimap', this.zoom, x, y);
    this.mmWindowPan({x, y});
  }

  /** Graph Panning handler, updates the minimap as well */
  graphPan(stage: 'start', ev: CdkDragStart): void;
  graphPan(stage: 'end', ev: CdkDragEnd): void;
  graphPan(stage: 'move', ev: CdkDragMove): void;
  graphPan(stage: 'validate'): void;
  graphPan(
      stage: 'start'|'move'|'end'|'validate',
      ev?: CdkDragMove|CdkDragStart|CdkDragEnd,
      ): void {
    const currClick =
        nanSafePt(ev?.source.getFreeDragPosition() || {x: 0, y: 0});
    if (stage === 'start') {
      this.graphPanning = true;
      this.graphPanningCtx = {
        graph: {
          x: nanSafePt(this.graphX),
          y: nanSafePt(this.graphY),
        },
      };
      return;
    }
    if (stage === 'end') {
      this.graphPanning = false;
      if (ev) {
        /* We want to reset this since a move is done, we can record the change,
         * and allow this panning slider to always be in the reset position for
         * the next pan */
        this.graphResetPan = {x: 0, y: 0};
      }
      return;
    }
    let {graphX: x, graphY: y} = this;
    if (stage === 'validate') {
      this.mmWindowPan(this.convertCanvasPtToMinimap({x: -x, y: -y}));
      return;
    }
    if (!this.graphPanning) return;
    const ctx = this.graphPanningCtx!;
    x = (ctx.graph.x + currClick.x) * -1;
    y = (ctx.graph.y + currClick.y) * -1;
    this.dagLogger?.logPanning(
        'drag_graph', this.zoom, this.graphX, this.graphY);
    this.mmWindowPan(this.convertCanvasPtToMinimap({x, y}));
  }
  /** Get dimensions on minimap window */
  getMinimapWindowDims() {
    const zoom = Math.max(this.zoom, 1);
    const winW = this.mmWinWidth / zoom;
    const winH = this.mmWinHeight / zoom;
    return {winW, winH};
  }
  /** Minimap to Canvas Point Conversion */
  convertCanvasPtToMinimap(pt: Point): Point {
    const ratio = this.mmScale / Math.max(this.zoom, 1);
    return {
      x: pt.x * ratio,
      y: pt.y * ratio,
    };
  }
  /** Canvas to Minimap Point Conversion */
  convertMinimapPtToCanvas(pt: Point): Point {
    const ratio = this.mmScale / Math.max(this.zoom, 1);
    return {
      x: pt.x / ratio,
      y: pt.y / ratio,
    };
  }

  /** Handles zooming done via scroll events */
  scrollZoom($e: WheelEvent) {
    $e.preventDefault();
    if (!this.features.scrollToZoom) return;

    const invSign = $e.deltaY > 0 ? -1 : 1;
    const newZoom = this.zoom +
        invSign *
            Math.min(
                SCROLL_STEP_PER_DELTA * Math.abs($e.deltaY),
                this.zoomStepConfig.step);

    this.zoomingTo(newZoom, {x: $e.x, y: $e.y});
    this.dagLogger?.logZoom(invSign === 1 ? 'in' : 'out', 'wheel');
  }

  private zoomingTo(zoom: number, to?: Point) {
    const {min, max} = this.zoomStepConfig;
    zoom = clampVal(zoom, min, max);
    if (this.zoom === zoom) return;

    const container = this.dagWrapper.nativeElement.getBoundingClientRect();

    // Previous top-left position converted into the new zoom level.
    const position = {
      x: -this.graphX / this.zoom * zoom,
      y: -this.graphY / this.zoom * zoom
    };

    // relative place of the cursor within the viewport at the time of zoom.
    // if not available, using the center
    const relativePos = {
      x: to ? (to.x - container.left) / this.lastResizeEv.width : 0.5,
      y: to ? (to.y - container.top) / this.lastResizeEv.height : 0.5
    };

    // Taking the difference between the viewport under the old and new zoom,
    // then multiplying with the relative position of the cursor.
    const diffX = (zoom - this.zoom) * this.lastResizeEv.width / this.zoom;
    const diffY = (zoom - this.zoom) * this.lastResizeEv.height / this.zoom;

    position.x += relativePos.x * diffX;
    position.y += relativePos.y * diffY;

    this.mmWindowPan(this.convertCanvasPtToMinimap(position), true);

    this.zoom = zoom;
    this.zoomChange.emit(zoom);
    this.handleResizeSync(true);
  }

  /**
   * Sets zoom value to 100%
   *
   * If `$e` is provided the default action is disabled along with bubbling
   * Also resetting the panning position, so we rule out the possibility to zoom
   * to an empty place on the edge.
   */
  resetZoom($e?: MouseEvent) {
    if ($e) {
      $e.preventDefault();
      $e.stopPropagation();
    }
    this.onZoomSet = 1;
    // Safe resetting the pan position
    this.mmWindowPan({x: this.mmX, y: this.mmY});
  }

  middleClickResetZoom($e: MouseEvent) {
    // From:
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#Return_value
    if (!$e || ($e.button !== 1)) return;
    this.resetZoom($e);
  }

  /** Macro to toggle CSS Classes on an element on or off */
  toggleClass(state: boolean, className: string) {
    return state ? className : '';
  }

  getNodeType(node: DagNode|DagGroup) {
    return node instanceof DagNode ? node.type : 'group';
  }

  classNameState(node: DagNode|DagGroup): string {
    return node.state.toLowerCase();
  }

  hasCustomMinimapNodeTemplateForNode(node: DagNode): boolean {
    if (node instanceof CustomNode) {
      return !!node.minimapTemplateRef;
    }
    return false;
  }

  getCustomMinimapNodeTemplateForNode(node: DagNode): TemplateRef<any>|null {
    if (node instanceof CustomNode) {
      const templateRefName = node.minimapTemplateRef;
      if (!templateRefName) return null;
      return this.customMinimapNodeTemplates[templateRefName];
    }
    return null;
  }

  // We're okay not sending a resolver because we do not handle rendering here,
  // and deep validation is not required to mark the graph as dirty
  isDagreInit = (element: DagFieldType) => isDagreInit(element);
  convertStateToRuntime = convertStateToRuntime;
  min = Math.min;
  max = Math.max;
}

@NgModule({
  imports: [
    CommonModule,
    DagRawModule,
    DragDropModule,
    ResizeMonitorModule,
  ],
  declarations: [
    DirectedAcyclicGraph,
  ],
  exports: [
    DirectedAcyclicGraph,
  ],
})
export class DirectedAcyclicGraphModule {
}
