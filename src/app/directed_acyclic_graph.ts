
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
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChild, ElementRef, EventEmitter, Input, NgModule, OnDestroy, OnInit, Optional, Output, TemplateRef, ViewChild} from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import * as dagre from 'dagre';  // from //third_party/javascript/typings/dagre
import {Subject, Subscription} from 'rxjs';
import {takeUntil, throttleTime} from 'rxjs/operators';

import {ShortcutService} from './a11y/shortcut.service';
import {DagStateService} from './dag-state.service';
import {STATE_SERVICE_PROVIDER} from './dag-state.service.provider';
import {baseColors, BLUE_THEME, clampVal, CLASSIC_THEME, createDAGFeatures, createDefaultZoomConfig, createNewSizeConfig, type DagTheme, DEFAULT_LAYOUT_OPTIONS, DEFAULT_THEME, defaultFeatures, defaultZoomConfig, EdgeStyle, type FeatureToggleOptions, generateTheme, getMargin, isPoint, type LayoutOptions, type Logger, MarkerStyle, type MinimapPosition, nanSafePt, NODE_HEIGHT, NODE_WIDTH, NodeState, OrientationMarginConfig, RankAlignment, RankDirection, RankerAlgorithim, SCROLL_STEP_PER_DELTA, SizeConfig, SVG_ELEMENT_SIZE, type ZoomConfig} from './data_types_internal';
import {DagRaw, DagRawModule, EnhancedDagGroup, GraphDims} from './directed_acyclic_graph_raw';
import {Translations, TranslationsService} from './i18n';
import {DagLogger} from './logger/dag_logger';
import {Minimap, MinimapModule} from './minimap/minimap';
import {type DagEdge, DagGroup, DagNode, GraphSpec, GroupIterationRecord, isDagreInit, NodeMap, type NodeRef, Point, type SelectedNode} from './node_spec';
import {ResizeEventData, ResizeMonitorModule} from './resize_monitor_directive';
import {DagSidebar} from './sidebar';
import {debounce} from './util_functions';
import {ZoomingLayer} from './zooming_layer.directive';

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
  type EdgeStyle,
  type FeatureToggleOptions,
  generateTheme,
  getMargin,
  type GroupIterationRecord,
  type LayoutOptions as DagreOptions,
  type MarkerStyle,
  type MinimapPosition,
  NODE_HEIGHT,
  NODE_WIDTH,
  type NodeState,
  type OrientationMarginConfig,
  RankAlignment as DagreRankAlignment,
  RankDirection as DagreRankDirection,
  RankerAlgorithim as DagreRankerAlgorithm,
  type SizeConfig,
  SVG_ELEMENT_SIZE,
  type ZoomConfig
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

interface ElementOffset {
  transformX: number;
  transformY: number;
  offsetWidth: number;
  offsetHeight: number;
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
export class DirectedAcyclicGraph implements OnInit, OnDestroy {
  readonly nodePad = 10;

  // DOM Elements
  @ViewChild('dagWrapper') readonly dagWrapper!: ElementRef;
  @ViewChild('minimap') private readonly minimap?: Minimap;
  @ViewChild('rootDag') private readonly rootDag?: DagRaw;
  @ContentChild(DagSidebar) readonly sidebarRef?: DagSidebar;

  // Dag Related Props
  private $sizeConfig = SVG_ELEMENT_SIZE();
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
  collapsed = true;
  themeConfig = DEFAULT_THEME;
  animateMove = false;
  mousedown = false;
  private $customNodeTemplates: Record<string, TemplateRef<any>> = {};
  private $features = defaultFeatures;
  private graphPanMove$ = new Subject<CdkDragMove>();
  destroy$ = new Subject<void>();

  private readonly uniqueId: string;
  protected readonly rootDagClass = 'root-dag';

  @Input()
  set zoom(zoom: number) {
    this.stateService.zoom.next(zoom);
  }
  get zoom() {
    return this.stateService.zoom.value;
  }

  set graphPanning(panning: boolean) {
    this.$graphPanning = panning;
    if (this.sidebarRef) this.sidebarRef.disableMouseInteractions = panning;
    this.isPanning.emit(panning);
  }
  get graphPanning() {
    return this.$graphPanning;
  }

  // State props
  rootDagInitialized = false;
  private observers: Subscription[] = [];
  private $selectedNode: SelectedNode|null = null;

  canvasWidth: number = 0;
  canvasHeight: number = 0;
  lastResizeEv: ResizeEventData = {width: 0, height: 0};

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
  @Input() showLoadingUntilGraphRendered = false;

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
  @Output() isPanning = new EventEmitter<boolean>();
  @Output() isZooming = new EventEmitter<boolean>();
  @Output() selectedNodeChange = new EventEmitter<SelectedNode|null>();
  @Output() groupIterationChanged = new EventEmitter<GroupIterationRecord>();

  @Input() hoveredEdge?: DagEdge;

  @Input() followNode: NodeRef|null = null;

  @Input('features')
  set features(f: FeatureToggleOptions) {
    const {scrollToZoom, naturalScrolling} = f;
    if (scrollToZoom && naturalScrolling) {
      throw new Error(
          'At most one of `scrollToZoom` and `naturalScrolling` can be set');
    }

    this.$features = f;
    this.propagateFeatures();
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

  @Input() zoomStepConfig?: ZoomConfig;

  @Input('collapsedArtifacts')
  set onCollapsedSet(c: boolean) {
    this.stateService.setCollapsed(c);
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
      private readonly translationsService: TranslationsService,
  ) {
    this.focusElement = debounce(this.focusElement, 50, this);
    this.onVisualUpdate = debounce(this.onVisualUpdate, 50, this);
    this.handleResizeAsync = debounce(this.handleResizeAsync, 50, this);
    this.resetAnimationMode = debounce(this.resetAnimationMode, 1200, this);
    this.resolveReference = this.resolveReference.bind(this);
    this.uniqueId = `${Date.now()}`;

    this.graphPanMove$.pipe(throttleTime(25), takeUntil(this.destroy$))
        .subscribe((event: CdkDragMove) => {
          this.graphPan('move', event);
        });
  }

  handleIsZooming(isZooming: boolean) {
    this.isZooming.emit(isZooming);
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

  markForCheck() {
    this.cdr.markForCheck();
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
    this.windowPan(newPt);
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
        if (v) {
          this.expandUntil(v.path);
          this.detectChanges();
        }
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
  }

  ngOnDestroy() {
    this.stateService.destroyAll(this.observers);
    this.destroy$.next();
    this.destroy$.complete();
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

  /**
   * Expand all `sub-dag`s along the path specified
   *
   * @return the number of expansions performed (not including previously
   *     expanded segments)
   */
  expandUntil(path: string[]): number {
    let dagEl = this.rootDag;
    let expansions = 0;
    let pathDepth = 0;
    path = [...path];
    while (path.length) {
      const segment = path.shift()!;
      const parent = dagEl;
      dagEl = dagEl?.subDags?.find(sub => {
        // Groups and nodes match exactly with the path
        if (sub.dagPath.slice(-1)[0] === segment) return true;

        /*
         * Loops match the first segment and have a path depth that increases
         * with 2.
         */
        if ((sub.dagPath.length - pathDepth) > 1 &&
            sub.dagPath.slice(-2).includes(segment)) {
          // The exact iteration from the path
          // Find the group associated with the iteration
          const loopGroup = parent?.$groups?.find(g => g.id === segment);
          if (loopGroup) {
            const selectedLoop = path.shift()!;
            loopGroup.selectedLoopId = selectedLoop;
            // Increase pathDepth as we've consumed 2 path segments
            pathDepth++;
            return true;
          }
        }

        return false;
      });
      if (!dagEl) break;
      if (parent?.toggleExpand(segment, true)) {
        // this will be true when expansion succeeded (not when it was a no-op)
        expansions++;
        // Detect changes so groups can expand properly
        this.detectChanges();
      }
      pathDepth++;
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

  /** Resolved a `NodeRef` to its actual node (be it a group or a node) */
  resolveReference(ref: NodeRef): DagNode|DagGroup|undefined {
    try {
      const destLoc = DagGroup.navigatePath(this as GraphSpec, ref.path);
      const {nodes, edges, groups} = destLoc;
      const nodeMap = DagNode.createNodeMap(nodes, edges, groups);
      return nodeMap.nodes[ref.id]?.node || nodeMap.groups[ref.id]?.group;
    } catch (error) {
      console.error(error);
      return;
    }
  }

  async sleep(time: number) {
    await new Promise(res => {
      setTimeout(res, time);
    });
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
    const node = this.resolveReference(ref)!;
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
   * If enableCenterCameraOnFocus is true, centers the camera on the nearest
   * ancestor custom-node or dag-node in the component tree.
   *
   * Offsets are computed by getting the CSS transform from the CSS object model
   * (which gives position of the top-left corner of the node) and then
   * adjusting width/height and scaling.
   *
   * _**Note:** this method is debounced by 50ms_
   */
  focusElement(e: FocusEvent) {
    if (!this.features.enableCenterCameraOnFocus || !e.target) {
      return;
    }

    let el = e.target as HTMLElement;
    const pathElements: HTMLElement[] = [];
    // collect path to root dag
    while (el && !el.classList.contains(this.rootDagClass)) {
      pathElements.push(el);
      el = el.offsetParent! as HTMLElement;
    }


    const transformX = pathElements.map(el => this.getOffset(el).transformX)
                           .reduce((a, b) => a + b, 0);
    const transformY = pathElements.map(el => this.getOffset(el).transformY)
                           .reduce((a, b) => a + b, 0);

    const {offsetWidth, offsetHeight} = this.getOffset(e.target as HTMLElement);
    const offsetX = (transformX + Math.floor(offsetWidth / 2)) * this.zoom;
    const offsetY = (transformY + Math.floor(offsetHeight / 2)) * this.zoom;

    this.centerCameraOn({x: offsetX, y: offsetY});
  }

  private getOffset(element: HTMLElement): ElementOffset {
    const computedTransformStyle =
        window.getComputedStyle(element).getPropertyValue('transform');

    const transformMatrix = new DOMMatrixReadOnly(computedTransformStyle);

    const {m41: transformX, m42: transformY} = transformMatrix;
    const {offsetWidth, offsetHeight} = element;

    return {transformX, transformY, offsetWidth, offsetHeight};
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
   */
  handleResizeSync(withoutPanning?: boolean) {
    const resizeEventData = this.lastResizeEv;
    const {width, height} = resizeEventData;
    const zoom = Math.min(this.zoom, 1);
    const canvasWidth = Math.max(width, this.graphWidth * zoom);
    const canvasHeight = Math.max(height, this.graphHeight * zoom);
    Object.assign(this, {
      canvasWidth,
      canvasHeight,
    });
    // Reposition the DAG so it's within bounds (account for features)
    if (!withoutPanning) {
      this.graphPan('validate');
    }

    this.detectChanges();
    this.onVisualUpdate();
  }

  /**
   * Minimap view window panning without dag area boundaries control. Can pan
   * out of the visible minimap area.
   */
  freeWindowPan(newPosition: Point) {
    this.graphX = -newPosition.x;
    this.graphY = -newPosition.y;
    this.markForCheck();
  }

  /**
   * Minimap view window panning handler
   */
  windowPan(newPosition: Point) {
    // Calculating the graph's offset from the top and left edges of the
    // available canvas, when the zoom is under 1.
    const offsets = this.zoom >= 1 ? {x: 0, y: 0} : {
      x: (this.graphWidth * this.zoom - this.graphWidth) / -2,
      y: (this.graphHeight * this.zoom - this.graphHeight) / -2,
    };

    this.graphX = -clampVal(
        newPosition.x, -offsets.x,
        (this.graphWidth * Math.max(this.zoom, 1) - this.lastResizeEv.width -
         offsets.x));
    this.graphY = -clampVal(
        newPosition.y, -offsets.y,
        this.graphHeight * Math.max(this.zoom, 1) - this.lastResizeEv.height -
            offsets.y);

    this.markForCheck();
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

    // Animation
    this.resetAnimationMode();  // We run this immediately, since it will
                                // debounce run after 1.1s
    this.animateMove = animate;
    this.detectChanges();
    await this.sleep(10);
    this.windowPan(pt);
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

  /** ThrottledGraph Panning handler */
  graphPanThrottled(stage: 'move', ev: CdkDragMove): void {
    this.graphPanMove$.next(ev);
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
      this.windowPan({x: -x, y: -y});
      return;
    }
    if (!this.graphPanning) return;
    const ctx = this.graphPanningCtx!;
    x = (ctx.graph.x + currClick.x) * -1;
    y = (ctx.graph.y + currClick.y) * -1;
    this.dagLogger?.logPanning(
        'drag_graph', this.zoom, this.graphX, this.graphY);
    this.windowPan({x, y});
  }

  // We're okay not sending a resolver because we do not handle rendering here,
  // and deep validation is not required to mark the graph as dirty
  isDagreInit = (element: DagFieldType) => isDagreInit(element);

  /**
   * Propagate DAG Features to elements, manually (either on init or after
   * change)
   */
  propagateFeatures() {
    if (this.features.enableShortcuts) {
      this.shortcutService.registerShortcutAction(
          'CANVAS_UP', () => this.stepCanvasOffset('up'));
      this.shortcutService.registerShortcutAction(
          'CANVAS_RIGHT', () => this.stepCanvasOffset('right'));
      this.shortcutService.registerShortcutAction(
          'CANVAS_DOWN', () => this.stepCanvasOffset('down'));
      this.shortcutService.registerShortcutAction(
          'CANVAS_LEFT', () => this.stepCanvasOffset('left'));
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    DagRawModule,
    DragDropModule,
    ResizeMonitorModule,
    MatProgressSpinnerModule,
    MinimapModule,
    ZoomingLayer,
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
