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
 * The internal data interfaces, classes and types required for DAG Renderer
 */

// #region TYPESCRIPT TYPE WRANGLING HELPERS
/** Export a without type for Type Exclusion in TypeScript */
export type Without<T, U> = {
  [P in Exclude<keyof T, keyof U>]?: never
};

/** Export an XOR type for Mutual Type Exclusion in TypeScript */
export type XOR<T, U> =
    (T|U) extends object ? (Without<T, U>&U)|(Without<U, T>&T) : T|U;

/** Allow marking certain fields as partial in TypeScript */
export type PartialBy<T, K extends keyof T> = Omit<T, K>&Partial<Pick<T, K>>;
// #endregion

// #region CORE INTERFACES AND METHODS
/**
 * Different directions that node layers can be rendered in.
 */
export enum RankDirection {
  TOP_TO_BOTTOM = 'TB',
  BOTTOM_TO_TOP = 'BT',
  LEFT_TO_RIGHT = 'LR',
  RIGHT_TO_LEFT = 'RL',
}

/**
 * How nodes within a layer should be aligned with each other.
 */
export enum RankAlignment {
  NONE = 'NONE',
  UP_LEFT = 'UL',
  UP_RIGHT = 'UR',
  DOWN_LEFT = 'DL',
  DOWN_RIGHT = 'DR',
}

/**
 * Options for configuring how the graph is layed out.
 */
export interface LayoutOptions {
  /**
   * The direction that node layers should be rendered in. For example:
   * 'top to bottom', or 'left to right'.
   */
  rankDirection?: RankDirection;

  /**
   * How nodes within a layer should be aligned. For example, all aligned
   * to the top-left of the layer.
   */
  rankAlignment?: RankAlignment;

  /**
   * The algorithim that should be used to determine what layer each node
   * belongs to.
   */
  ranker?: RankerAlgorithim;

  /** The number of pixels that separate edges. */
  edgeSeparation?: number;

  /** The number of pixels that separate layers. */
  rankSeparation?: number;

  /** The number of pixels that separate nodes within a layer. */
  nodeSeparation?: number;
}

/**
 * Different algorithims available to use to assign nodes to layers in the
 * graph.
 */
export enum RankerAlgorithim {
  NETWORK_SIMPLEX = 'network-simplex',
  TIGHT_TREE = 'tight-tree',
  LONGEST_PATH = 'longest-path',
}

/**
 * Represents the a coordinate object type
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents a point on the UI with the transform: translate(...) calculated
 */
export interface PointWithTransform extends Point {
  cssTransform: string;
}

/**
 * Represents the a coordinate object type
 */
export interface Dimension {
  width: number;
  height: number;
}

type Margin =
    number|{left: number, right: number}|{top: number, bottom: number};

/** Common directions */
export type Direction = 'left'|'right'|'top'|'bottom';

/** Position of the minimap. The minimap is always presented right-aligned. */
export type MinimapPosition = 'top'|'bottom';

/**
 * Orientation Margin config
 *
 * - x: number, y: number
 * - x: {l: number, t: number}, etc...
 */
export interface OrientationMarginConfig {
  x?: Margin;
  y?: Margin;
}

/** Fetch margin for a dimension from config */
export function getMargin(m: OrientationMarginConfig, dir: Direction) {
  let subConfig = m.y;
  if (dir === 'left' || dir === 'right') {
    subConfig = m.x;
  }
  if (!subConfig) return 0;
  if (typeof subConfig === 'number') return subConfig;
  if (!(dir in subConfig)) {
    throw new Error(
        `Invalid config passed! Your config needs to match 'left|right' with 'x' and 'top|bottom' with 'y'`);
  }
  return subConfig[dir as keyof typeof subConfig];
}

/**
 * Takes in an unsafe point or number and converts it to one that can be
 * reliably used without causing `NaN`s to flow through your code
 *
 * Default fallback value is `0` and can be made anything else.
 */
export function nanSafePt(pt: number, fallback?: number): number;
export function nanSafePt(pt: Point, fallback?: number): Point;
export function nanSafePt(pt: number|Point, fallback = 0) {
  if (typeof pt === 'number') {
    return isNaN(pt) ? fallback : pt;
  }
  const {x, y} = pt;
  return {x: nanSafePt(x, fallback), y: nanSafePt(y, fallback)} as Point;
}

/** Type gate for checking point */
// tslint:disable-next-line:no-any This is a type gate and needs any so we can process any type
export function isPoint(pt: any): pt is Point {
  return 'x' in pt && 'y' in pt;
}

/** Default Node Height */
export const NODE_HEIGHT = 56;
/** Default Node Width */
export const NODE_WIDTH = 284;
/** Default Node Vertical Spacing */
export const NODE_VERTICAL_SPACING = 60;
/** Default Node Horizontal Spacing */
export const NODE_HORIZONTAL_SPACING = 40;
/** Default Node Width Padding */
export const NODE_WIDTH_PADDING = 6;
/** Default Node Height Padding */
export const NODE_HEIGHT_PADDING = 5;


/**
 * Common LayoutOptions for Dagre
 */
export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  rankDirection: RankDirection.TOP_TO_BOTTOM,
  rankAlignment: RankAlignment.NONE,
  ranker: RankerAlgorithim.NETWORK_SIMPLEX,
  edgeSeparation: 4,
  rankSeparation: NODE_VERTICAL_SPACING,
  nodeSeparation: NODE_HORIZONTAL_SPACING,
};

/**
 * The config used to adjust the graph's core sizes, from icons to node widths
 * to graph margins
 */
export type SizeConfig = ReturnType<typeof SVG_ELEMENT_SIZE>;

/** Types of extra padding that can be allocated to the DAG */
export type PadType = 'none'|'control-node'|'loop';

/**
 * Relative measures of Node elements based on Global Element sizes
 *
 * These values are to be interpreted as `x = ${xx}`
 */
export const SVG_ELEMENT_SIZE = (width = NODE_WIDTH, height = NODE_HEIGHT) => {
  const ICON_SIZE_MEDIUM = 24;
  const ICON_SIZE_LARGE = 32;
  const ICON_SPACE_WIDTH = 48;
  const MINIMAP_WIDTH = 150;

  const dims = {
    getNodeWidth(state: NodeState, conditionalQuery: string) {
      return dims.iconSpaceWidth + dims.textareaWidth +
          dims.getIconStateSpace(state, conditionalQuery);
    },
    height,
    minimapWidth: MINIMAP_WIDTH,
    iconSpaceWidth: ICON_SPACE_WIDTH,
    textareaWidth: width - 2 * ICON_SPACE_WIDTH,
    condensedIconWidth: ICON_SPACE_WIDTH * .8,
    iconSpaceForConditional: ICON_SPACE_WIDTH * 1.5,
    getIconStateSpace(state: NodeState, conditionalQuery: string) {
      const {iconSpaceForConditional: condWidth, iconSpaceWidth: iconWidth} =
          dims;
      const nonState = isNoState(state);
      if (!conditionalQuery) return nonState ? 0 : iconWidth;
      const staticCondWidth = (condWidth - iconWidth) * 1.5;
      return nonState ? staticCondWidth : condWidth;
    },
    /** How much free space should the graph be padded with on each Axis */
    graphMargin: {
      x: {left: width / 2, right: Math.max(MINIMAP_WIDTH, width / 2) * 2},
      y: {top: height, bottom: height * 3},
    } as OrientationMarginConfig,
  };

  return {
    dims,
    getLeanDims(extraPadding: PadType = 'none') {
      let yPadFactor = height / 4;
      if (extraPadding === 'control-node') {
        yPadFactor = height / 1.5;
      } else if (extraPadding === 'loop') {
        yPadFactor = height / 1.5 + height * .6;
      }
      return {
        ...dims,
        graphMargin: {
          x: {left: height / 4, right: height / 1.5},
          y: {bottom: height / 4, top: yPadFactor},
        },
      };
    },
    iconSizes: {
      med: ICON_SIZE_MEDIUM,
      large: ICON_SIZE_LARGE,
    },
  };
};

interface PartialSizeConfig {
  dims?: Partial<Omit<SizeConfig['dims'], 'graphMargin'>&{
    graphMargin: Partial<OrientationMarginConfig>,
  }>;
  getLeanDims?: SizeConfig['getLeanDims'];
  iconSizes?: Partial<SizeConfig['iconSizes']>;
}

/** Creates a new Dimension config for the DAG using partial entry overrides */
export function createNewSizeConfig(
    config: PartialSizeConfig, dims?: Dimension): SizeConfig {
  const {dims: newDims, getLeanDims, iconSizes} = config;
  const {dims: ogDims, ...remainingOgConfig} =
      SVG_ELEMENT_SIZE(dims?.width, dims?.height);
  let finalDims: SizeConfig['dims'] = ogDims;
  if (newDims) {
    const {graphMargin, ...remainingConfig} = newDims;
    finalDims = {
      ...ogDims,
      ...remainingConfig,
      ...(graphMargin ? {graphMargin: {...ogDims.graphMargin, ...graphMargin}} :
                        {}),
    };
  }
  return {
    ...remainingOgConfig,
    ...(getLeanDims ? {getLeanDims} : {}),
    ...(iconSizes ? {...remainingOgConfig.iconSizes, ...iconSizes} : {}),
    dims: finalDims,
  };
}

/**
 * Current runtime state of a node.
 */
export type RuntimeState = 'Static'|'Runtime';

/**
 * Available types for different nodes.
 *
 * Based on states from: 'goog:proto.google.cloud.ml.v1.TaskExecution'
 */
export type NodeState = 'NO_STATE_STATIC'|'NO_STATE_RUNTIME'|'CANCELLED'|
    'CANCELLING'|'CANCEL_PENDING'|'FAILED'|'PENDING'|'RUNNING'|'SKIPPED'|
    'SUCCEEDED'|'TIMEOUT'|'NOT_TRIGGERED'|'DISABLED'|'PAUSED'|'UNKNOWN';

type State2Priority = {
  [state in NodeState]: number;
};

/**
 * A priority table that maps `NodeState`s to the importance they have on the
 * overall graph state
 */
export const STATE_PRIORITY: State2Priority = {
  'NO_STATE_STATIC': 0,
  'NO_STATE_RUNTIME': 0,
  'PENDING': 0.5,
  'NOT_TRIGGERED': .75,
  'SKIPPED': 1,
  'SUCCEEDED': 1.5,
  'RUNNING': 2.5,
  'CANCEL_PENDING': 3,
  'CANCELLING': 3,
  'TIMEOUT': 4,
  'FAILED': 4,
  'CANCELLED': 5,
  'DISABLED': 5,
  'PAUSED': 5,
  'UNKNOWN': 6,
};

/**
 * Confirm whether state supplied is either `Static` or `Runtime` based
 * `NO_STATE`
 */
export function isNoState(state: NodeState) {
  return state === 'NO_STATE_RUNTIME' || state === 'NO_STATE_STATIC';
}

/**
 * Convert Node's state to a graph runtime state
 */
export function convertStateToRuntime(state: NodeState): RuntimeState {
  return state === 'NO_STATE_STATIC' ? 'Static' : 'Runtime';
}

/** Parameters to pass a clamping function */
export interface ClampConfig {
  num: number;
  min: number;
  max: number;
}
/**
 * Clamps a numeric value to its bounds
 */
export function clampVal(config: ClampConfig): number;
export function clampVal(num: number, min: number, max: number): number;
export function clampVal(num: number|ClampConfig, min?: number, max?: number) {
  if (typeof num === 'object') {
    ({num, min, max} = num);
  }
  min = typeof min === 'number' ? min : Number.MAX_SAFE_INTEGER;
  max = typeof max === 'number' ? max : Number.MIN_SAFE_INTEGER;
  return Math.max(min, Math.min(max, num));
}

/**
 * Config to specify how zoom controls should change scale on DAG Component
 */
export interface ZoomConfig {
  /** Minimum zoom to perform. Default: .2 */
  min: number;
  /** Maximum zoom to perform. Default: 1.5 */
  max: number;
  /** Buttons should increment or decrement by what magnitude. Default: .05 */
  step: number;
}
/** Default zoom config that can be used for DAG Toolbar or DAG Renderer */
export const defaultZoomConfig: ZoomConfig = {
  max: 1.5,
  min: .2,
  step: .10,
};

/** Increment or decrement per scroll / trackpad delta. */
export const SCROLL_STEP_PER_DELTA = .02;

/**
 * Allows you to construct a full DAG Zoom Config set from partial entries
 * which override the defaults
 */
export function createDefaultZoomConfig(opts: Partial<ZoomConfig>): ZoomConfig {
  return Object.assign({}, defaultZoomConfig, opts);
}

/** The color theme to use for DAG color variables */
export type Theme = 'device'|'light'|'dark';

/**
 * The different features that can be toggled on the DAG Component
 */
export interface FeatureToggleOptions {
  /** The control to enable or disable scroll action for zooming */
  scrollToZoom: boolean;
  /** Toggles visibility of toolbar zoom buttons */
  zoomControls: boolean;
  /** Toggles visibility of toolbar zoom percentage label */
  disableZoomPercentageLabel: boolean;
  /** Toggles visibility of toolbar collapse toggle */
  collapsibleNodes: boolean;
  /** Persist artifact expanded state on selection */
  selectedArtifactsAreExpanded: boolean;
  /** Allow toggles of visibility of DAG Minimap via Toolbar */
  minimapToolbarToggle: boolean;
  /** Allow toggles to make DAG fullscreen via Toolbar */
  fullscreenToggle: boolean;
  /**
   * Toggles animations that happen when minimap box is hovered on or clicked
   */
  minimapHoverAnimations: boolean;
  /**
   * Make minimap semi-transparent when graph is panning, so the content
   * behind is visible
   */
  seeThroughMinimapOnPan: boolean;
  /**
   * [DEBUG ONLY] Visibly see the panning layer on the DAG so you can debug any
   * issues with Panning logic
   */
  debugPanningLayer: boolean;
  /**
   * Activate A11y keyboard shortcut functionalities
   */
  enableShortcuts: boolean;
  /**
   * When true, scrolls to center a node when it is focused.
   */
  enableCenterCameraOnFocus: boolean;

  /**
   * This option enables "natural scroll" behavior. This amounts to the
   * following:
   *   - wheel events pan the canvas as they would a scrollable element
   *   - wheel events w/ ctrl key zoom the canvas
   *     - works with pinch and zoom as well
   *     - works with both ctrl and cmd on Mac
   *   - Dragging pans the canvas
   * Defaults to `false`.
   *
   * Incompatible with `scrollToZoom: true`.
   */
  naturalScrolling?: boolean;

  /**
   * This option enables free panning behavior
   */
  freePanning?: boolean;

  /**
   * Hides the progress cell in the toolbar. Defaults to `false`.
   */
  hideProgressCell?: boolean;

  /**
   * Disables loading material styles. Use this if your host application already
   * loads the Material stylesheets and wants to avoid duplicates.
   * Defaults to `false`.
   */
  disableLoadingMaterialStyles?: boolean;

  /**
   * Specifies the workflow graph color theme to use. Defaults to `light`.
   * Custom themes can override the theme behavior.
   */
  theme?: Theme;

  /**
   * Whether the layout should respect the order of the nodes in the graph
   * instead of optimizing for space according to the layout algorithm.
   * See https://github.com/dagrejs/dagre/issues/189 for more details on the
   * underlying issue.
   *
   * Defaults to `false`.
   */
  respectNodeOrder?: boolean;
}
/**
 * Default set of functionality to enable / disable in the DAG Component
 * - This object can be passed individually to `dag-renderer` or `toolbar`
 * - OR, directly on the `scaffold` element
 */
export const defaultFeatures: FeatureToggleOptions = {
  scrollToZoom: true,
  zoomControls: true,
  disableZoomPercentageLabel: false,
  collapsibleNodes: true,
  minimapToolbarToggle: true,
  selectedArtifactsAreExpanded: false,
  minimapHoverAnimations: true,
  seeThroughMinimapOnPan: true,
  debugPanningLayer: false,
  fullscreenToggle: false,
  enableShortcuts: false,
  enableCenterCameraOnFocus: true,
  naturalScrolling: false,
  freePanning: false,
  hideProgressCell: false,
  disableLoadingMaterialStyles: false,
  theme: 'light',
  respectNodeOrder: false,
};

/**
 * Allows you to construct a full DAG Feature toggle set from partial entries
 * which override the defaults
 */
export function createDAGFeatures(f: Partial<FeatureToggleOptions> = {}):
    FeatureToggleOptions {
  return Object.assign({}, defaultFeatures, f);
}

/** Additional fields that can be used for Icon Expression for a DAG Node */
export interface NodeIconFields {
  iconColors?: 'normal'|'inverted';
  contrastColor?: 'white'|'black';
}
/** The enum of which style icon the node contains */
export type NodeIcon = XOR<TextIconConfig, IconConfig>&NodeIconFields;

/**
 * Icon information needed to render an icon with cfc-icons
 *
 * - `iconset`: Defaults to `common`
 * - `color`: Defaults to `currentColor`
 * - `size`: Defaults are in
 */
export interface IconConfig {
  name: string;
  iconset?: string;
  color?: string;
  size?: 'small'|'medium'|'large';
}

/**
 * Icon information for nodes when a custom Text Icon is needed
 *
 * - `bg`: Defaults to `common`
 * - `color`: Defaults to `white`
 * - `font`: Defaults to blank (no font override)
 */
export interface TextIconConfig {
  text: string;
  color?: string;
  font?: string;
}

/** Type verification for text-like icons */
export function isTextIcon(icon: NodeIcon|undefined): icon is TextIconConfig {
  return !!(icon && !!icon.text);
}

/** A mapping from NodeStatus to icon colors */
export type StatusPalette = {
  [status in NodeState]: string;
};

/** Marker style to use at the ends of edges in the DAG, `circle` by default */
export type MarkerStyle = 'circle'|'arrow'|'hidden';

/** The layout of Edge drawn on the DAG, this is `dagre` by default */
export type EdgeStyle = 'dagre'|'snapped';  // dagre by default.

/**
 * Theme configuration for the DAG Component. Allows the user to customize
 * various aspects of the DAG and toolbar via color and icon config
 */
export interface DagTheme {
  executionIcon: NodeIcon;
  artifactIcon: NodeIcon;
  groupIcon: NodeIcon;
  iconColors: Exclude<NodeIcon['iconColors'], undefined>;
  statusColors: StatusPalette;
  statusBg: StatusPalette;
  edgeColor: string;
  edgeStyle: EdgeStyle;
  edgeToMarkerStyle: MarkerStyle;
  edgeFromMarkerStyle: MarkerStyle;
  edgeWidth: number;
  background: {
    dots: {
      cx: number; cy: number; width: number; height: number; radius: number;
      fill: string;
    }
  };
  minimap: {outlineColor: string; boxShadow: string;};
}

/**
 * Definition for a DAG theme that is partially complete that can be filled
 * out by `DEFAULT_THEME` to create a complete `DagTheme`
 */
export type PartialDagTheme = Partial<
    Omit<DagTheme, 'statusColors'|'statusBg'>&
    {statusColors: Partial<StatusPalette>, statusBg: Partial<StatusPalette>}>;

/**
 * Allows the user to generate a custom DAG theme by supplying partial theme
 * entries which are built atop the `DEFAULT_THEME`
 */
export function generateTheme(theme: PartialDagTheme) {
  return {
    ...DEFAULT_THEME,
    ...theme,
    statusColors: {...DEFAULT_THEME.statusColors, ...theme.statusColors},
    statusBg: {...DEFAULT_THEME.statusBg, ...theme.statusBg},
  } as DagTheme;
}

/**
 * Map of base colors used to construct the `DEFAULT_THEME` for the DAG
 * Component
 */
export const baseColors = {
  'black': 'var(--workflow-graph-base-color-black)',
  'blue': 'var(--workflow-graph-base-color-blue)',
  'green': 'var(--workflow-graph-base-color-green)',
  'red': 'var(--workflow-graph-base-color-red)',
  'yellow': 'var(--workflow-graph-base-color-yellow)',
  'orange': 'var(--workflow-graph-base-color-orange)',
  'purple': 'var(--workflow-graph-base-color-purple)',
  'gray': 'var(--workflow-graph-base-color-gray)',
  'bg': {
    'blue': 'var(--workflow-graph-base-color-background-blue)',
    'green': 'var(--workflow-graph-base-color-background-green)',
    'red': 'var(--workflow-graph-base-color-background-red)',
    'yellow': 'var(--workflow-graph-base-color-background-yellow)',
    'gray': 'var(--workflow-graph-base-color-background-gray)',
    'white': 'var(--workflow-graph-base-color-background-white)',
    'none': 'transparent',
    'dots': {
      'gray': 'var(--workflow-graph-color-hairline)',
    }
  },
  'minimap': {
    'gray': 'var(--workflow-graph-base-color-gray)',
    'blue': 'var(--workflow-graph-base-color-blue)',
  }
};


/** Icon config used for a non-icon Artifact */
export const GENERIC_ARTIFACT_ICON: NodeIcon = {
  name: 'artifact-generic',
  iconset: 'cloud_ai',
  size: 'large',
  color: baseColors['orange'],
};

/** Icon config used for a non-icon Execution */
export const GENERIC_EXECUTION_ICON: NodeIcon = {
  name: 'execution',
  iconset: 'cloud_ai',
  size: 'large',
  color: baseColors['blue'],
};

/** Icon config used for a non-icon Execution */
export const GENERIC_GROUP_ICON: NodeIcon = {
  name: 'group-generic',
  iconset: 'cloud_ai',
  size: 'medium',
  color: baseColors['blue'],
};

/**
 * Base theme config for the DAG Component
 *
 * All custom themes override this config
 */
export const DEFAULT_THEME: DagTheme = {
  executionIcon: GENERIC_EXECUTION_ICON,
  artifactIcon: GENERIC_ARTIFACT_ICON,
  groupIcon: GENERIC_GROUP_ICON,
  iconColors: 'normal',
  statusColors: Object.fromEntries([
    ['PENDING', baseColors['gray']],
    ...['CANCEL_PENDING', 'CANCELLING'].map(s => [s, baseColors['blue']]),
    ...['RUNNING', 'SKIPPED', 'SUCCEEDED'].map(s => [s, baseColors['green']]),
    ...['TIMEOUT', 'PAUSED'].map(s => [s, baseColors['yellow']]),
    ['FAILED', baseColors['red']],
    ...['CANCELLED', 'NOT_TRIGGERED', 'DISABLED', 'UNKNOWN'].map(
        s => [s, baseColors['gray']]),
    ...['NO_STATE_RUNTIME', 'NO_STATE_STATIC'].map(s => [s, '']),
  ]),
  statusBg: Object.fromEntries([
    ...['RUNNING', 'SKIPPED', 'SUCCEEDED'].map(
        k => [k, baseColors['bg']['green']]),
    ...['CANCEL_PENDING', 'CANCELLING'].map(k => [k, baseColors['bg']['blue']]),
    ...['PENDING', 'CANCELLED', 'NOT_TRIGGERED', 'DISABLED', 'UNKNOWN'].map(
        k => [k, baseColors['bg']['gray']]),
    ...['NO_STATE_RUNTIME', 'NO_STATE_STATIC'].map(k => [k, 'transparent']),
    ...['TIMEOUT', 'PAUSED'].map(k => [k, baseColors['bg']['yellow']]),
    ['FAILED', baseColors['bg']['red']],
  ]),
  edgeColor: baseColors['blue'],
  edgeStyle: 'dagre',
  edgeToMarkerStyle: 'circle',
  edgeFromMarkerStyle: 'circle',
  edgeWidth: 1,
  background: {
    dots: {
      cx: 1,
      cy: 1,
      width: 8,
      height: 8,
      radius: 1,
      fill: baseColors['bg']['dots']['gray'],
    }
  },
  minimap: {outlineColor: baseColors['minimap']['blue'], boxShadow: 'none'},
};

/**
 * Original theme config for the DAG Component
 */
export const CLASSIC_THEME: DagTheme = generateTheme({
  statusColors: Object.fromEntries([
    ['PENDING', '#818181'],
    ...['CANCEL_PENDING', 'CANCELLING'].map(s => [s, '#1A73E8']),
    ...['RUNNING', 'SKIPPED', 'SUCCEEDED'].map(s => [s, '#34A853']),
    ['TIMEOUT', '#F9AB00'],
    ['FAILED', '#E94235'],
    ...['CANCELLED', 'NOT_TRIGGERED'].map(s => [s, '#818181']),
    ...['NO_STATE_RUNTIME', 'NO_STATE_STATIC'].map(s => [s, '']),
  ]),
  statusBg: Object.fromEntries([
    ...['RUNNING', 'SKIPPED', 'SUCCEEDED'].map(
        k => [k, baseColors['bg']['green']]),
    ...['CANCEL_PENDING', 'CANCELLING'].map(k => [k, baseColors['bg']['blue']]),
    ...['PENDING', 'CANCELLED', 'NOT_TRIGGERED'].map(
        k => [k, baseColors['bg']['gray']]),
    ...['NO_STATE_RUNTIME', 'NO_STATE_STATIC'].map(k => [k, 'transparent']),
    ['TIMEOUT', baseColors['bg']['yellow']],
    ['FAILED', baseColors['bg']['red']],
  ]),
  edgeColor: '#1A73E8',
});

/** Alternate theme that can be used to render the DAG */
export const BLUE_THEME: DagTheme = generateTheme({
  executionIcon: {...GENERIC_EXECUTION_ICON, color: baseColors['black']},
  artifactIcon: {...GENERIC_ARTIFACT_ICON, color: baseColors['blue']},
  groupIcon: {...GENERIC_GROUP_ICON, color: baseColors['black']},
  statusColors: Object.fromEntries([
    ...['RUNNING', 'SKIPPED', 'SUCCEEDED'].map(s => [s, baseColors['blue']]),
  ]),
  statusBg: Object.fromEntries([
    ...['RUNNING', 'SKIPPED', 'SUCCEEDED'].map(
        s => [s, baseColors['bg']['blue']]),
  ]),
});
// #endregion

class AssertionError extends Error {}

/**
 * Simple assert function that checks whether the condition is satisfied.
 */
// tslint:disable-next-line:no-any
export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(msg);
  }
}

/** The shape of a log event sent from the graph component. */
export interface LogEvent {
  name: string;
  metadata: {[key: string]: boolean|string|number};
}

/** A default logger interface, provided by consumers of the component. */
export interface Logger {
  logEvent: (event: LogEvent) => void;
}
