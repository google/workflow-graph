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

import {Translations} from './i18n';

/**
 * @desc Label for a running execution that is preparing to change
 * state due to user intervention.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_WORKING = goog.getMsg('Working');

/**
 * @desc Label for an execution that has not started.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_PENDING = goog.getMsg('Pending');

/**
 * @desc Label for an execution that was stopped by the user.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_CANCELLED = goog.getMsg('Cancelled');

/**
 * @desc Label for an execution that failed to complete.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_FAILED = goog.getMsg('Failed');

/**
 * @desc Label for an execution that is currently in progress.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_RUNNING = goog.getMsg('Running');

/**
 * @desc Label for an execution that was skipped due to the step being
 * cached.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_CACHED = goog.getMsg('Cached');

/**
 * @desc Label for an execution that did not complete due to a timeout.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_TIMEOUT = goog.getMsg('Timeout');

/**
 * @desc Label for an execution that did not run because its trigger
 * policy didn't match.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_NOT_TRIGGERED =
    goog.getMsg('Not Triggered');

/**
 * @desc Label for an execution that completed successfully.
 */
const MSG_WORKFLOW_GRAPH_NODE_STATE_COMPLETED = goog.getMsg('Completed');

export const TRANSLATIONS: Translations = {
  'nodeStateWorking': MSG_WORKFLOW_GRAPH_NODE_STATE_WORKING,
  'nodeStatePending': MSG_WORKFLOW_GRAPH_NODE_STATE_PENDING,
  'nodeStateCancelled': MSG_WORKFLOW_GRAPH_NODE_STATE_CANCELLED,
  'nodeStateRunning': MSG_WORKFLOW_GRAPH_NODE_STATE_RUNNING,
  'nodeStateTimeout': MSG_WORKFLOW_GRAPH_NODE_STATE_TIMEOUT,
  'nodeStateCached': MSG_WORKFLOW_GRAPH_NODE_STATE_CACHED,
  'nodeStateNotTriggered': MSG_WORKFLOW_GRAPH_NODE_STATE_NOT_TRIGGERED,
  'nodeStateCompleted': MSG_WORKFLOW_GRAPH_NODE_STATE_COMPLETED,
  'nodeStateFailed': MSG_WORKFLOW_GRAPH_NODE_STATE_FAILED,
};
