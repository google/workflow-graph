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
 * @fileoverview This file contains all the fake data json payloads for the
 * various testing scenarios
 */

import {DagNodeSkeleton, DagSkeleton, repeatedMetaNodes, StateTable} from '../../node_spec';


const entrypointMeta = {
  state: 'NO_STATE_RUNTIME',
  subType: 'model',
  icon: {
    name: 'artifact-model',
    iconset: 'cloud_ai',
    size: 'large',
  },
};

const iterationMeta = {
  state: 'TIMEOUT',
  hasControlNode: true,
  treatAsLoop: true,
  icon: {
    name: 'group-iterative',
    iconset: 'cloud_ai',
    size: 'medium',
  },
};

const artifactRefsMeta = {
  state: 'NO_STATE_RUNTIME',
  artifactRefs: [
    {id: 'Entry point', path: []},
    {id: 'Entry point', path: ['Iteration', 'it-1']},
    {id: 'Not-existing node', path: ['Not-existing path']},
  ],
};

/**
 * A graph dataset containing artifact referencing to nodes inside a multi level
 * iteration. Contains 3 references: to the entry node, to the entry node under
 * the level 1 iteration's first run and to a not-existent node (which should
 * not appear). Can be used by `DagNode.createFromSkeleton()` to generate a
 * GraphSpec.
 */
export const fakeGraph: DagSkeleton = {
  state: {
    'Entry point': entrypointMeta,
    'Iteration': {
      ...iterationMeta,
      description: 'Level 1',
      selectedLoopId: 'it-1',
      groupMeta: repeatedMetaNodes(
          ['it-1', 'it-2'],
          i => ({
            state: 'SUCCEEDED',
            displayName: `Iteration ${i.slice(3)}`,
            groupMeta: {
              'Entry point': entrypointMeta,
              'Iteration': {
                ...iterationMeta,
                description: 'Level 2',
                selectedLoopId: 'it-2',
                groupMeta: repeatedMetaNodes(
                    ['it-1', 'it-2'], i => ({
                                        state: 'SUCCEEDED',
                                        displayName: `Iteration ${i.slice(3)}`,
                                        groupMeta: {
                                          'Artifact refs': artifactRefsMeta,
                                        },
                                      }))
              },
            },
          })),
    },
  } as StateTable,
  skeleton: [
    {
      id: 'Entry point',
      type: 'artifact',
      next: [
        {
          id: 'Iteration',
          type: 'group',
          definition: Array.from(
              {length: 2}, (e, i) => ({
                             id: `it-${i + 1}`,
                             type: 'group',
                             definition: [
                               {
                                 id: 'Entry point',
                                 type: 'artifact',
                                 next: [
                                   {
                                     id: 'Iteration',
                                     type: 'group',
                                     definition: Array.from(
                                         {length: 2}, (e, i) => ({
                                                        id: `it-${i + 1}`,
                                                        type: 'group',
                                                        definition: [
                                                          {
                                                            id: 'Artifact refs',
                                                            type: 'execution',
                                                          },
                                                        ]
                                                      }))
                                   },
                                   {
                                     id: 'Execution',
                                     type: 'execution',
                                   }
                                 ]
                               },
                             ]
                           }))
        },
        {
          id: 'Execution',
          type: 'execution',
        }
      ]
    } as DagNodeSkeleton,
  ],
};
