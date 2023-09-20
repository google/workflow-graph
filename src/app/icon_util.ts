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

import {DagTheme, IconConfig, isTextIcon, NodeIcon, NodeState} from './data_types_internal';
import {translateMessage} from './i18n';
import {sizeMap} from './icons_service';
import {NodeType} from './node_spec';

/**
 * Default config for `IconConfig | TextIcon` that is used by icon utility
 * functions
 */
export const iconConfigDefaults = {
  text: '',
  name: '',
  iconset: 'common',
  iconColors: 'normal',
  color: 'black',
  contrastColor: 'white',
  get size() {
    return sizeMap[(this as unknown as NodeIcon).iconset!] || 'small';
  },
};
/**
 * Generates an ambitious config for an Icon for every node in the DAG, which
 * allows us to save a ton of runtime computation as we no longer need to check
 * for fallback values dynamically everytime a change propagates to the renderer
 */
export function generateFullIconFor(
    icon: NodeIcon|undefined, nodeType: NodeType|'group', theme: DagTheme) {
  const defaultIcon = {
    'artifact': theme.artifactIcon,
    'execution': theme.executionIcon,
    'group': theme.groupIcon,
  }[nodeType];
  const final = {...iconConfigDefaults, ...defaultIcon, ...icon};
  delete final[isTextIcon(icon) ? 'name' : 'text'];
  return final;
}
/**
 * Very ambitious config for matching all icon types. Every combination of
 * values for `IconConfig`, `NodeIcon`, `TextIcon` can be fetched from this
 * object
 */
export type FullIconConfig = ReturnType<typeof generateFullIconFor>;

export {NodeIcon, IconConfig} from './data_types_internal';

/** Returns an IconConfig key for resolved an icon config. */
export function fetchIcon(icon: NodeIcon, key: keyof NodeIcon|'bg'): string {
  if (key === 'color' || key === 'bg') {
    const color = icon.color || iconConfigDefaults.color;
    const contrastColor =
        icon.contrastColor || iconConfigDefaults.contrastColor;
    if (icon.iconColors === 'inverted') {
      return key === 'color' ? contrastColor : color;
    }
    return key === 'color' ? color : 'transparent';
  }
  let val = '';
  // This is needed to work with variable rewriting done on prod builds
  switch (key) {
    case 'contrastColor':
      val = icon.contrastColor || iconConfigDefaults.contrastColor;
      break;
    case 'name':
      val = icon.name || iconConfigDefaults.name;
      break;
    case 'iconset':
      val = icon.iconset || iconConfigDefaults.iconset;
      break;
    case 'size':
      val = icon.size || iconConfigDefaults.size;
      break;
    case 'iconColors':
      val = icon.iconColors || iconConfigDefaults.iconColors;
      break;
    case 'text':
      val = icon.text || iconConfigDefaults.text;
      break;
    default:
      throw new Error(`Unknown icon key [${key}] is being fetched`);
  }
  if (!val) {
    console.error(`Could not fetch a value for [key: ${key}] in: ${
        JSON.stringify(icon)}`);
  }
  return val;
}


/**
 * Rescales icons from any sized iconset to target sizes required on the
 * Visual DAG
 */
export function iconRescale(
    icon: IconConfig|undefined, targetSize: IconConfig['size']) {
  if (!icon) {
    return '';
  }
  const size = fetchIcon(icon, 'size') as typeof targetSize;
  if (!targetSize || size === targetSize) return '';
  const [sizePx, targetPx] = [size!, targetSize].map(s => iconSizeToPx(s));
  return `scale(${targetPx / sizePx})`;
}

/** Returns the pixel value for a given Icon Size. */
export function iconSizeToPx(size: Exclude<IconConfig['size'], undefined>) {
  switch (size) {
    case 'small':
      return 18;
    case 'medium':
      return 24;
    case 'large':
      return 32;
    default:
      throw new Error(`Unknown size [${size}] is being used`);
  }
}

/** Returns an IconConfig for a given NodeState. */
export function iconForState(state: NodeState, theme: DagTheme): IconConfig|
    undefined {
  let icon: IconConfig;
  switch (state) {
    case 'PENDING':
      icon = {name: 'status-pending', iconset: 'cloud_ai'};
      break;

    case 'RUNNING':
      icon = {name: 'status-running', iconset: 'cloud_ai'};
      break;

    case 'SKIPPED':
      icon = {name: 'status-skipped', iconset: 'cloud_ai'};
      break;

    case 'SUCCEEDED':
      icon = {name: 'status-success', iconset: 'cloud_ai'};
      break;

    case 'TIMEOUT':
      icon = {name: 'status-warning', iconset: 'cloud_ai'};
      break;

    case 'CANCEL_PENDING':
    case 'CANCELLING':
      icon = {name: 'working'};
      break;

    case 'NOT_TRIGGERED':
      icon = {name: 'status-not-triggered', iconset: 'cloud_ai'};
      break;

    case 'CANCELLED':
      icon = {name: 'status-canceled', iconset: 'cloud_ai'};
      break;

    case 'FAILED':
      icon = {name: 'status-error', iconset: 'cloud_ai'};
      break;

    case 'NO_STATE_RUNTIME':
    case 'NO_STATE_STATIC':
      return undefined;

    default:
      throw new Error(`Dag state config is not exhaustive, state: ${state}`);
  }
  icon.color = theme.statusColors[state] || icon.color;
  return icon;
}

/** Returns an icon background color for a given NodeState. */
export function bgForState(state: NodeState, theme: DagTheme): string {
  const fallback = '#f0f0f0';
  return theme.statusBg[state] || fallback;
}

/**
 * @desc Label for an running execution that is preparing to change
 * state due to user intervention.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_WORKING =
    translateMessage('Working');

/**
 * @desc Label for an execution that has not started.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_PENDING =
    translateMessage('Pending');

/**
 * @desc Label for an execution that was stopped by the user.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_CANCELLED =
    translateMessage('Cancelled');

/**
 * @desc Label for an execution that failed to complete.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_FAILED = translateMessage('Failed');

/**
 * @desc Label for an execution that is currently in progress.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_RUNNING =
    translateMessage('Running');

/**
 * @desc Label for an execution that was skipped due to the step being
 * cached.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_CACHED = translateMessage('Cached');

/**
 * @desc Label for an execution that did not complete due to a timeout.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_TIMEOUT =
    translateMessage('Timeout');

/**
 * @desc Label for an execution that did not run because its trigger
 * policy didn't match.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_NOT_TRIGGERED =
    translateMessage('Not Triggered');

/**
 * @desc Label for an execution that completed successfully.
 * @suppress { messageConventions }
 */
const AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_COMPLETED =
    translateMessage('Completed');

/** Returns a display name for a NodeState. */
export function labelForState(state: NodeState): string {
  switch (state) {
    case 'CANCEL_PENDING':
    case 'CANCELLING':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_WORKING;

    case 'CANCELLED':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_CANCELLED;

    case 'FAILED':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_FAILED;

    case 'PENDING':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_PENDING;

    case 'RUNNING':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_RUNNING;

    case 'SKIPPED':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_CACHED;

    case 'SUCCEEDED':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_COMPLETED;

    case 'TIMEOUT':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_TIMEOUT;

    case 'NOT_TRIGGERED':
      return AI_DIRECTED_ACYCLIC_GRAPH_NODE_STATE_NOT_TRIGGERED;

    case 'NO_STATE_RUNTIME':
    case 'NO_STATE_STATIC':
      return '';

    default:
      throw new Error(`Dag state config is not exhaustive, state: ${state}`);
  }
}
