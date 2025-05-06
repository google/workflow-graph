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

import {assert, baseColors, convertStateToRuntime, Dimension, EdgeStyle, IconConfig, isNoState, isTextIcon, MarkerStyle, NodeIcon, NodeState, PartialBy, Point, RuntimeState, STATE_PRIORITY, TextIconConfig} from './data_types_internal';

/**
 * Expose internal shared Properties
 */
export {
  baseColors,
  convertStateToRuntime,
  type EdgeStyle,
  type IconConfig,
  isNoState,
  isTextIcon,
  type MarkerStyle,
  type NodeIcon,
  type NodeState,
  type Point,
  type RuntimeState,
  type TextIconConfig,
};

/**
 * Icon style for nodes
 */
export type IconStyle = 'normal'|'inverted';

/**
 * Modifiers that can be applied to a `DagNode` or `DagGroup`
 */
export type NodeModifier = 'deleted';

/**
 * Arbitrary key value storage per node
 */
export interface Options {
  // tslint:disable-next-line:no-any Allows any type to be stored in a node's payload.
  [s: string]: any;
}

/** The super types nodes can exist as */
export type NodeType = 'artifact'|'execution';

/** Get a type across DagNode and DagGroup in a single handy function */
export function getNodeType(node: DagNode|DagGroup) {
  if (node instanceof DagGroup) return 'group';
  return node.type;
}

/** Full context a node reference anywhere in the DAG */
export interface NodeRef {
  /** Reference target node */
  id: string;
  /**
   * Fully qualified `id` path to follow to get to this node
   *
   * Id would be a list of `group`s leading to this node. Use
   * `DagGroup.navigatePath()` to traverse this
   *
   * A path value of `[]` would mean the node is at root level
   */
  path: string[];
}

/**
 * Callout interface that allows you to generate a custom callout that puts a
 * badge based text on the node text-area
 */
export type NodeCallout = string|{
  text: string;
  bg: string;
  color: string;
};

/** Full context for a selected node */
export interface SelectedNode extends Omit<NodeRef, 'id'> {
  /** Reference for the selected node */
  node: DagNode|DagGroup;
  path: string[];
}

/** Detects if the NodePath supplied matches another one */
export function isSamePath(a: string[], b: string[]) {
  return a === b || a.length === b.length && a.every((id, i) => id === b[i]);
}

/**
 * Allows for multiple nodes to be defined with similar or exact config.
 *
 * Example:
 * ```js
 * ...repeatedNodes(['ct1', 'ct2', 'ct3', 'ct4'], {
 *   state: 'NO_STATE_RUNTIME',
 *   subType: 'common',
 *   displayName: '/common/topic',
 *   icon: iconFor('common_topic'),
 * }),
 * ```
 */
export function repeatedMetaNodes(
    ids: string[], config: DagMeta|((id: string) => DagMeta)) {
  return Object.fromEntries(
      ids.map(id => [id, typeof config === 'function' ? config(id) : config]));
}

/**
 * Will tell you if a node / edge / group has been Dagre initialized
 *
 * NOTE: The return needs to be a ***strict*** `boolean` due to how `*ngIf`
 * works
 *
 * @param nodeResolver Helps this function resolve nodes or groups referenced by
 *     the `DagEdge` entries to perform deeper validation on edges
 */
export function isDagreInit(
    entity: DagNode|DagGroup|DagEdge,
    nodeResolver?: (id: string) => DagNode | DagGroup): boolean {
  if (!entity) return false;
  if (entity instanceof DagNode || entity instanceof DagGroup) {
    return entity.x > -1 && entity.y > -1;
  }
  if (!entity.points || !entity.points.length) return false;
  if (!nodeResolver) return true;
  return [entity.from, entity.to]
      .map(e => nodeResolver(e))
      .map(e => isDagreInit(e))
      .reduce((p, c) => p && c, true);
}

interface RawDagNodeSkeleton {
  id: string;
  /**
   * If you want to make this node custom, specify `templateRef` in the DagMeta
   * entry for this node
   */
  type: NodeType;
  next?: DagNodeSkeleton[];
  edgeLabel?: string;
  edgeOpts?: Omit<Partial<DagEdge>, 'from'|'to'|'points'|'next'|'label'>;
}
type GroupDagNodeSkeleton = Omit<RawDagNodeSkeleton, 'type'>&{
  type: 'group';
  definition: DagNodeSkeleton[];
};

/**
 * Get an object with all Methods in an Object
 *
 * Borrowed from: https://stackoverflow.com/a/63990350/2162893
 */
type Methods<T> = {
  [P in keyof T as T[P] extends Function ? P : never]: T[P]
};

/** Extract the optional fields that NEED to exist in the constructor */
type GetOptionalParamsFor<Class> = Partial<Pick<
    Class,
    Exclude<
        keyof Class,
        keyof Dimension|keyof Point|keyof GraphSpec|keyof Methods<Class>|'id'|
        'state'|'type'>>>;

/**
 * The minimal information to bootstrap a node.
 * `id` is the primary key used to identify a unique node
 *
 * `id` for groups are exclusive with nodes in `root` DAG (and MUST be unique)
 *
 * Please pay attention to your `id` field in your proto, it may not be unique
 * across `artifacts` and `executions`
 *
 * This is required, so that we can deterministically render child nodes at
 * the same locations everytime
 */
export type DagNodeSkeleton = RawDagNodeSkeleton|GroupDagNodeSkeleton;

/**
 * Type check for a Skeleton Node to check if it describes a `DagGroup` instead
 * of a `DagNode`
 */
export function skeletonIsGroup(s: DagNodeSkeleton): s is GroupDagNodeSkeleton {
  return s.type === 'group';
}

/**
 * The full skeleton definition of the DAG with State coverage for all node and
 * groups
 */
export interface DagSkeleton {
  /** The structural and critical information for DAG Construction */
  skeleton: DagNodeSkeleton[];
  /** The state and metadata information per DAG Level */
  state?: StateTable;
}

/**
 * The structure for the Object converted to entries for the state map for
 * `DagNode.createFromSkeleton()` call
 */
export interface StateTable {
  [id: string]: DagMeta;
}

/**
 * The emitter payload for when an iteration record is changed on any part of
 * the DAG. Uniquely identifies which group the event occored on, and which
 * iteration object was picked!
 */
export interface GroupIterationRecord {
  /** Path to the iterator-loop's parent DAG */
  path: string[];
  /** Source looping group where the iteration was selected */
  group: DagGroup;
  /** Iteration node / group that was selected */
  iterationNode: DagGroup|DagNode;
}

/**
 * The emitter payload for when a group is expanded or collapsed
 */
export interface GroupToggleEvent {
  groupId: string;
  isExpanded: boolean;
}

/**
 * Sub DAG Group config for Nested DAGs
 *
 * `id` is the unique identifier that is used across nodes / groups to identify
 * a sub-dag.
 */
export class DagGroup implements
    Omit<GraphSpec, 'nodeMap'>,
    PartialBy<
        Required<
            Omit<DagGroupMeta, 'definition'|'groupMeta'|'customControlNode'>>,
        'icon'|'subType'> {
  id = '';
  displayName = '';
  groupLabel = '';
  nodes: DagNode[] = [];
  edges: DagEdge[] = [];
  groups: DagGroup[] = [];
  state: NodeState = 'NO_STATE_STATIC';
  description = '';
  descriptionTooltip = '';
  hasControlNode = false;
  hideControlNodeOnExpand = false;
  customControlNode?: CustomNode;
  treatAsLoop = false;
  conditionalQuery = '';
  callout: NodeCallout = '';
  modifiers = new Set<NodeModifier>();
  stateTooltip = '';
  iconTooltip = '';
  subType?: unknown;
  icon?: NodeIcon;
  options = {} as Options;
  artifactRefs = [] as NodeRef[];
  selectedLoopId = '';
  x = -1;
  y = -1;
  cssTransform = '';
  width = 0;
  height = 0;
  expanded = false;

  constructor(
      id: string, nodes: DagNode[] = [], edges: DagEdge[] = [],
      groups: DagGroup[] = [], state: NodeState = 'NO_STATE_STATIC', {
        displayName = '',
        groupLabel = '',
        description = '',
        descriptionTooltip = '',
        conditionalQuery = '',
        callout = '',
        modifiers = new Set<NodeModifier>(),
        hasControlNode = false,
        hideControlNodeOnExpand = false,
        customControlNode = undefined,
        expanded = false,
        stateTooltip = '',
        iconTooltip = '',
        treatAsLoop = false,
        subType = undefined,
        icon = undefined,
        options = {},
        artifactRefs = [],
        selectedLoopId,
      }: GetOptionalParamsFor<DagGroup> = {}) {
    if (!!customControlNode && !hideControlNodeOnExpand) {
      throw new Error(
          'Custom control nodes are not supported in the expanded state');
    }
    Object.assign(this, {
      id,
      nodes,
      edges,
      groups,
      state,
      displayName,
      groupLabel,
      description,
      descriptionTooltip,
      conditionalQuery,
      callout,
      modifiers,
      hasControlNode,
      hideControlNodeOnExpand,
      customControlNode,
      expanded,
      stateTooltip,
      iconTooltip,
      subType,
      treatAsLoop,
      selectedLoopId,
      icon: icon ? {...icon} : icon,
      artifactRefs,
      options,
    });
  }

  /** Generates a `DagNode` control for this group if allowed */
  generateControlNode() {
    if (!this.hasControlNode) return;
    if (this.customControlNode) {
      this.height = this.customControlNode.height;
      this.width = this.customControlNode.width;
      return this.customControlNode;
    }
    return new DagNode(this.id, 'execution', this.state, {...this});
  }

  /**
   * Gets the display name
   */
  getNodeDisplayName(): string {
    return this.displayName || this.id;
  }

  /** Clones the DagNode */
  clone() {
    const clonedGraph = cloneGraph(this);
    return new DagGroup(
        this.id, clonedGraph.nodes, clonedGraph.edges, clonedGraph.groups,
        this.state, {...this});
  }

  /**
   * Create a `GraphSpec` equivalent to this `DagGroup`. A use for this exists
   * when you are processing the ROOT level of your DAG with a group, and then
   * want to collapse it down to a simple `GraphSpec`
   */
  toGraphSpec(): GraphSpec {
    const {nodes, edges, groups} = this;
    return {nodes, edges, groups};
  }

  /**
   * Traverses a path found in `SelectedNode` to target the correct DagGroup
   * where edits could be made by an application
   */
  static navigatePath(g: DagGroup|GraphSpec, path: string[]) {
    let navigatedGroup: DagGroup|GraphSpec|undefined = g;
    // clone the array so the original is preserved
    path = [...path];
    if (path[0] === 'root') path.shift();
    while (path.length) {
      const id = path.shift();
      navigatedGroup = navigatedGroup.groups.find(graph => graph.id === id);
      if (!navigatedGroup) {
        throw new Error(`Invalid id: ${id} in path traversal`);
      }
    }
    return navigatedGroup;
  }

  /**
   * Construct a `DagGroup` from any supported foreign type
   *
   * While `id` is required when node is `GraphSpec`, it is optionally used as
   * the overriding id when used with a `DagNode`
   */
  static from(node: GraphSpec, id: string): DagGroup;
  static from(node: DagNode, id?: string): DagGroup;
  static from(node: DagGroup, id?: string): DagGroup;
  static from(node: DagNode|GraphSpec|DagGroup, id?: string) {
    if (node instanceof DagGroup) {
      node.id = id || node.id;
      return node;
    }
    if (node instanceof DagNode) {
      return new DagGroup(id || node.id, [], [], [], node.state, node);
    }
    const {nodes, edges, groups} = node;
    return new DagGroup(id!, nodes, edges, groups);
  }
}

/**
 * Position in the node where the edge should be attached.
 * Only relevant if using theme with edge mode set to 'snapped'.
 */
export interface SnapPoint {
  /**
   * Anchor point, in percentage of width/height of the node from which real
   * edge attachment point is then offset from.
   *
   * Anchor is calculated from top-left of the node, and defaults to the
   * corresponding edge (0 or 1) of the node in the layout axis, and center of
   * the node (0.5) on the other axis.
   */
  horizontalPercent?: number;
  verticalPercent?: number;
  /**
   * Offset, in px, from the anchor point, to where the edge is be attached.
   * Both offsets default to 0.
   */
  horizontalOffset?: number;
  verticalOffset?: number;
}

/**
 * Dag Edge relationship
 *
 * Looks like `{from: parentId, to: childId}`
 */
export interface DagEdge {
  from: string;
  to: string;
  label?: string;
  points?: Point[];
  color?: string;
  labelColor?: string;
  toMarkerStyle?: MarkerStyle;  // circle by default.
  fromMarkerStyle?: MarkerStyle;  // circle by default.
  /**
   * Multiplier for how thick an edge should be relative to the base thickness.
   * The base value this is multiplied to is stored in Theme.edgeWidth = 1
   *
   * `weight` of `2` on a default themed edge-width of `1px` would result in
   * `2px`, whereas if the default edge-width was `2px` it would be `4px` for
   * this edge
   */
  weight?: number;
  /** The number of ranks to keep between the source and target of the edge. */
  minlen?: number;
  /**
   * Only relevant for snapped edges.
   * Edge mode can be set to 'snapped' in the theme.
   */
  startSnapPoint?: SnapPoint;
  endSnapPoint?: SnapPoint;
}

/**
 * Mapping between Node Key and its node value and edges
 */
export interface NodeMap {
  nodes: {
    [id: string]: {
      node: DagNode|CustomNode,
      edges: DagEdge[],
    }
  };
  groups: {
    [id: string]: {
      group: DagGroup,
      edges: DagEdge[],
    }
  };
}

/**
 * A graph specification based on Node and Edge defs here
 */
export interface GraphSpec {
  nodes: Array<DagNode|CustomNode>;
  edges: DagEdge[];
  groups: DagGroup[];
  nodeMap?: NodeMap;
}

/**
 * Links the DagNodeSkeleton to each node's state
 */
export interface DagNodeMeta {
  displayName?: string;
  state?: NodeState;
  stateTooltip?: string;
  iconTooltip?: string;
  /**
   * Optional subtype that can be used for custom logic, and will show up in
   * the NodeIcon hover tooltip
   */
  subType?: unknown;
  icon?: NodeIcon;
  options?: Options;
  description?: string;
  descriptionTooltip?: string;
  /**
   * If a node is conditional this is set to `''` else it is considered
   * conditional, and the condition value is based on whether the state is
   * `NOT_TRIGGERED` (for `false`) or any other state for `true`
   */
  conditionalQuery?: string;

  /**
   * Modifiers that can be used to flavor the node or provide alternate
   * begavior or styling
   *
   * Examples: `Deleted`, `Blinking` (NOT IMPLEMENTED)
   */
  modifiers?: Set<NodeModifier>;

  /** A callout that shows as a badge on the node's text-area */
  callout?: NodeCallout;

  /**
   * Used to denote artifact relationships to the current node from an outside
   * or separate context (where no edge can be drawn from source artifact to
   * current node).
   *
   * Usually should only be used on `DagGroup` and `executions` (`DagNode`)
   *
   * An example of this can be:
   * - Artifact `A1` was produced in sub-dag `S1`
   * - [ref] Artifact `A1` was used in an execution in parent DAG (_special case
   * where it needs to be shown on the edge?_)
   * - [ref] Artifact `A1` was used in an execution in Sub-Dag `S2`
   */
  artifactRefs?: NodeRef[];
}

/**
 * Links the DagNodeSkeleton to each node's state
 */
export type DagCustomNodeMeta = DagNodeMeta&Partial<CustomNodeProps>;

/**
 * Links the DagNodeSkeleton to each group's state
 *
 * - `hasControlNode` is only allowed for `DagGroup` entries
 */
export interface DagGroupMeta extends DagNodeMeta {
  /** A label to display on the group */
  groupLabel?: string;
  /** The nested metadata for this group's members */
  groupMeta?: StateTable;
  /** Should we generate a controlNode via parameters given to group */
  hasControlNode?: boolean;
  customControlNode?: CustomNode;
  /**
   * Should the DagGroup be shown as a loop, in which case no `edges` should be
   * passed in
   */
  treatAsLoop?: boolean;
  /**
   * If `treatAsLoop` is enabled, you can optionally set the selected iteration
   * by id
   */
  selectedLoopId?: string;
  /** If the group is expanded */
  expanded?: boolean;
  /** If the control node should be hidden when the group is expanded */
  hideControlNodeOnExpand?: boolean;
}

/**
 * Metadata information for nodes listed in `dagNodeSkeleton`. Used in
 * `DagNode.createFromSkeleton()`
 */
export type DagMeta = DagNodeMeta|DagCustomNodeMeta|DagGroupMeta;

/**
 * Helper function to allow cloning an entire DAG Graph, so that datasets can
 * remain immutable vs the data that's injected into the component
 * @param g The `GraphSpec` being cloned
 */
export function cloneGraph(g: GraphSpec): GraphSpec {
  const {nodes, edges, groups} = g;
  return {
    nodes: nodes.map(n => n.clone()),
    edges: edges.map(e => ({...e})),
    groups: groups.map(g => g.clone()),
  };
}

/**
 * Assert that the object provided is completely empty (with the exception of
 * `keysToIgnore`)
 */
export function assertCompleteDereference(
    // tslint:disable-next-line:no-any This is a generic test for all object types and as such requires an any here, unknown won't work
    obj: Record<string, any>, errorMessage: string) {
  const clone = {...obj};
  const objKeys = Object.keys(clone);
  const addendumError = `. Unexpected Keys: ${objKeys.join(', ')}`;
  assert(objKeys.length === 0, errorMessage + addendumError);
}

/**
 * DAG Node implementation
 */
export class DagNode implements
    Required<Omit<RawDagNodeSkeleton, 'next'|'edgeLabel'|'edgeOpts'>>,
    PartialBy<Required<DagNodeMeta>, 'icon'>, Point, Dimension {
  id: string = '';
  // If set, overrides the component display name.
  displayName: string = '';
  type: NodeType = 'execution';
  subType: unknown;
  state: NodeState = 'NO_STATE_STATIC';
  stateTooltip: string = '';
  iconTooltip: string = '';
  conditionalQuery = '';
  modifiers = new Set<NodeModifier>();
  callout: NodeCallout = '';
  icon?: NodeIcon;
  options: Options = {};
  description: string = '';
  descriptionTooltip: string = '';
  // TODO(b/304716390) rename this field to nodeRefs
  artifactRefs = [] as NodeRef[];
  /** X Position, Value of `-1` represents an unset value */
  x = -1;
  /** Y Position, Value of `-1` represents an unset value */
  y = -1;
  width = 0;
  height = 0;
  cssTransform = '';

  constructor(
      id: string, type: NodeType, state: NodeState = 'NO_STATE_STATIC', {
        displayName = '',
        options = {},
        icon = undefined,
        description = '',
        descriptionTooltip = '',
        conditionalQuery = '',
        modifiers = new Set<NodeModifier>(),
        callout = '',
        stateTooltip = '',
        iconTooltip = '',
        subType = undefined,
        artifactRefs = [],
      }: GetOptionalParamsFor<DagNode> = {}) {
    Object.assign(this, {
      id,
      type,
      state,
      stateTooltip,
      iconTooltip,
      icon: icon ? {...icon} : icon,
      displayName,
      options,
      subType,
      conditionalQuery,
      modifiers,
      callout,
      description,
      descriptionTooltip,
      artifactRefs,
    });
  }

  /** Clones the DagNode */
  clone() {
    return new DagNode(this.id, this.type, this.state, {...this});
  }

  /**
   * Gets the display name
   */
  getNodeDisplayName(): string {
    return this.displayName || this.id;
  }

  getIconTitle() {
    if (this.iconTooltip) return this.iconTooltip;
    return this.type + (this.subType ? ` - ${this.subType}` : '');
  }

  /**
   * Construct a `DagNode` from any supported foreign type
   *
   * Default type coercion is to retain type, unless the source is a group. In
   * which case we will assume `execution` unless otherwise specified
   */
  static from(node: DagGroup, coerceType: NodeType): DagNode;
  static from(node: DagNode, coerceType?: NodeType): DagNode;
  static from(node: DagNode|DagGroup, coerceType?: NodeType) {
    if (node instanceof DagNode) {
      node.type = coerceType || node.type;
      return node;
    }
    return new DagNode(
        node.id, coerceType || 'execution', node.state, {...node});
  }

  static createNodeMap(
      nodes: DagNode[], edges: DagEdge[], groups: DagGroup[] = []): NodeMap {
    const nodeMap: NodeMap = {nodes: {}, groups: {}};
    for (const node of nodes) {
      nodeMap.nodes[node.id] = {node, edges: []};
    }
    for (const group of groups) {
      nodeMap.groups[group.id] = {group, edges: []};
    }
    for (const e of edges) {
      const {from} = e;
      if (nodeMap.nodes[from]) {
        nodeMap.nodes[from].edges.push(e);
      } else if (nodeMap.groups[from]) {
        nodeMap.groups[from].edges.push(e);
      }
    }
    for (const group of groups) {
      nodeMap.groups[group.id].edges = group.edges;
    }
    return nodeMap;
  }

  static bootstrapSkeletonNode(node: DagNodeSkeleton, nodeMeta: DagNodeMeta):
      DagNode;
  static bootstrapSkeletonNode(
      node: DagNodeSkeleton, nodeMeta: DagCustomNodeMeta): CustomNode;
  static bootstrapSkeletonNode(node: DagNodeSkeleton, nodeMeta: DagGroupMeta):
      DagGroup;
  static bootstrapSkeletonNode(node: DagNodeSkeleton, nodeMeta: DagMeta) {
    const {id, type, next, edgeLabel, edgeOpts, ...parentRemains} = node;
    if (node.type === 'group') {
      const {
        id,
        type,
        next,
        edgeLabel,
        edgeOpts,
        definition,
        ...groupParentRemains
      } = node;
      assertCompleteDereference(
          groupParentRemains, `Unexpected keys found in DagNodeSkeleton`);
    } else {
      assertCompleteDereference(
          parentRemains, `Unexpected keys found in DagNodeSkeleton`);
    }
    if (type !== 'group') {
      const {
        displayName,
        icon,
        state,
        stateTooltip,
        iconTooltip,
        options,
        description,
        descriptionTooltip,
        conditionalQuery,
        modifiers,
        callout,
        subType,
        templateRef,
        artifactRefs,
        width,
        height,
        hideEdgeMarkers,
        includeInStepCount,
        ...remains
      } = nodeMeta as DagCustomNodeMeta;
      assertCompleteDereference(
          remains, 'Not all fields of DagNode were assigned via Skeleton');
      const node = new DagNode(id, type, state, {
        displayName,
        icon: icon ? {...icon} : icon,
        options,
        description,
        descriptionTooltip,
        conditionalQuery,
        modifiers,
        callout,
        stateTooltip,
        iconTooltip,
        subType,
        artifactRefs,
      });
      if (!templateRef) {
        if (width || height) {
          throw new Error(
              'Cannot supply (width or height) as metadata for a normal node (supply `templateRef` so your node is treated as custom)');
        }
        return node;
      }
      if (typeof width === 'undefined' || typeof height === 'undefined') {
        throw new Error(
            'Width or height is not passed in along with templateRef, which means there is not enough information to generate a CustomNode');
      }
      return new CustomNode(node, templateRef, width, height, {
        hideEdgeMarkers,
        includeInStepCount,
      });
    }
    const {
      state,
      description,
      descriptionTooltip,
      conditionalQuery,
      modifiers,
      callout,
      hasControlNode,
      hideControlNodeOnExpand,
      customControlNode,
      expanded,
      displayName,
      groupLabel,
      stateTooltip,
      iconTooltip,
      subType,
      icon,
      options,
      artifactRefs,
      treatAsLoop,
      selectedLoopId,
      groupMeta,
      ...remains
    } = nodeMeta as DagGroupMeta;
    assertCompleteDereference(
        remains, 'Not all fields of DagGroup were assigned via Skeleton');
    if (!!customControlNode && !hideControlNodeOnExpand) {
      throw new Error(
          'Custom control nodes are not supported in the expanded state');
    }
    return new DagGroup(id, undefined, undefined, undefined, state, {
      description,
      descriptionTooltip,
      conditionalQuery,
      hasControlNode,
      hideControlNodeOnExpand,
      customControlNode,
      expanded,
      modifiers,
      callout,
      displayName,
      groupLabel,
      stateTooltip,
      iconTooltip,
      subType,
      icon,
      options,
      artifactRefs,
      treatAsLoop,
      selectedLoopId,
    });
  }
  static createFromSkeleton = createFromSkeleton;
}

interface CustomNodeProps extends Dimension {
  /**
   * Template reference string to allow DAG Component to scan and find the
   * reference so it can be used via `NgTemplateOutlet`
   */
  templateRef: string;
  /** Should this node be included in the DAG Toolbar step counting? */
  includeInStepCount: boolean;
  /** Show / hide edge markers on this element */
  hideEdgeMarkers: boolean;

  /**
   * Template reference string to allow the minimap component to create a custom
   * minimap node via `NgTemplateOutlet`. Custom template must be an
   * <article> with CSS class `node`.
   */
  minimapTemplateRef: string|undefined;
}

/**
 * Custom node implementation for Dag Component, that allows for Arbitrary node
 * content on the page
 *
 * You can still choose to fill out all the fields of the node as you would in a
 * normal `DagNode` but the hard requirements are:
 * - All mandatatory fields from `DagNode`
 * - Width, Height of element
 */
export class CustomNode extends DagNode implements CustomNodeProps {
  templateRef: string;
  includeInStepCount = false;
  hideEdgeMarkers = false;
  minimapTemplateRef: string|undefined = undefined;

  constructor(
      node: DagNode, templateRef: string, width: number, height: number, {
        includeInStepCount = false,
        hideEdgeMarkers = false,
        minimapTemplateRef = undefined,
      }: Partial<CustomNodeProps> = {}) {
    super(node.id, node.type, node.state, {...node});
    this.templateRef = templateRef;
    this.width = width;
    this.height = height;
    Object.assign(
        this, {includeInStepCount, hideEdgeMarkers, minimapTemplateRef});
  }

  override clone(): CustomNode {
    return new CustomNode(
        this as DagNode, this.templateRef, this.width, this.height, this);
  }
}


/**
 * DAG Nodes, with ancestry within (for implementations not using Dagre or D3)
 *
 * DEPRECATED: And could be full of issues. This class is untested
 */
export class DagNodeLinked extends DagNode {
  parents: DagNodeLinked[] = [];
  next: DagNodeLinked[] = [];
  constructor(
      id: string, type: NodeType, state: NodeState = 'NO_STATE_STATIC', {
        displayName = '',
        descriptionTooltip = '',
        conditionalQuery = '',
        stateTooltip = '',
        iconTooltip = '',
        next = [] as DagNodeLinked[],
        options = {} as Options,
        icon = undefined as NodeIcon | undefined,
        description = '',
        subType = undefined as never,
      } = {}) {
    super(id, type, state, {
      displayName,
      icon,
      options,
      description,
      descriptionTooltip,
      conditionalQuery,
      stateTooltip,
      iconTooltip,
      subType,
    });
    for (const c of next) {
      this.addChild(c);
    }
  }

  /**
   * Returns the list of children associated with a node.
   */
  listChildren(): DagNodeLinked[] {
    return this.next;
  }

  /**
   * Attach new child nodes to this element
   * @return the child node
   */
  addChild(child: DagNodeLinked): DagNodeLinked {
    // Check if child is already attached
    if (!this.next.some(c => c.id === child.id)) this.next.push(child);
    if (!child.parents.some(p => p.id === this.id)) child.parents.push(this);
    return child;
  }

  /**
   * Attach or verify a parent for this node
   * @return the parent node
   */
  addParent(parent: DagNodeLinked): DagNodeLinked {
    return parent.addChild(this);
  }
}

/**
 * Will bootstrap an entire DAG using skeleton markup language, this allows for
 * quickly testing multiple different types of DAGs for test case validation or
 * before your application's ORM is written
 */
function createFromSkeleton(
    skeleton: DagNodeSkeleton[], meta: StateTable = {}): GraphSpec {
  const nodes: DagNode[] = [];
  const groups: DagGroup[] = [];
  let edges: DagEdge[] = [];
  const nodeMap: NodeMap = {nodes: {}, groups: {}};

  let queue = [...skeleton];
  while (queue.length) {
    const skNode = queue.shift()!;
    const {id, next} = skNode;
    const nodeMeta = meta[id] || {};
    const foundNode = (nodeMap.nodes[id] || nodeMap.groups[id]) as
            typeof nodeMap[keyof typeof nodeMap][0] |
        undefined;
    let node;
    if (foundNode) {
      node = 'node' in foundNode ? foundNode.node : foundNode.group;
    } else {
      node = DagNode.bootstrapSkeletonNode(skNode, nodeMeta);
    }
    const nodeEdges: DagEdge[] = [];

    if (!foundNode) {
      if (node instanceof DagNode) {
        nodes.push(node);
      } else {
        groups.push(node);
      }
    }
    if (next) {
      for (const ch of next) {
        const edge: DagEdge = {
          from: id,
          to: ch.id,
          ...(ch.edgeLabel ? {label: ch.edgeLabel} : {}),
          ...(ch.edgeOpts ? ch.edgeOpts : {}),
        };
        nodeEdges.push(edge);
      }
    }
    edges = [...edges, ...nodeEdges];
    if (foundNode) {
      foundNode.edges = foundNode.edges.concat(nodeEdges);
    } else {
      if (node instanceof DagNode) {
        nodeMap.nodes[id] = {node, edges: nodeEdges};
      } else {
        nodeMap.groups[id] = {group: node, edges: nodeEdges};
      }
    }
    if (next) queue = [...queue, ...next];
    if (!(node instanceof DagNode) && skeletonIsGroup(skNode) &&
        skNode.definition) {
      const groupMeta = nodeMeta as DagGroupMeta;
      const d =
          DagNode.createFromSkeleton(skNode.definition, groupMeta.groupMeta);
      node.edges = d.edges;
      node.nodes = d.nodes;
      node.groups = d.groups;
      node.treatAsLoop &&
          assert(
              d.edges.length === 0,
              'A for-loop type Sub-DAG (DagGroup) cannot have edges, since all' +
                  ' child nodes and sub-dags are the dropdown elements, and edges' +
                  ' ARE IGNORED',
          );
    }
  }
  return {nodes, edges, groups, nodeMap};
}



/**
 * Calculate overall GraphState based on individual node states within
 */
export function calculateGraphState(
    nodes: DagNode[], groups: DagGroup[]): NodeState {
  let statePriority = -1;
  let finalState: NodeState = 'NO_STATE_STATIC';
  for (const node of [...nodes, ...groups]) {
    const {state} = node;
    const pri = STATE_PRIORITY[state];
    if (pri < statePriority) continue;
    statePriority = pri;
    finalState = state;
  }
  return finalState;
}
