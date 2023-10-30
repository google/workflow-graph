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

import {GraphSkeleton} from './shared';

/**
 * A graph dataset containing a recursion (when a pipeline group is calling
 * again itself, eg. after some action logic, checking out a condition). Can be
 * used by `DagNode.createFromSkeleton()` to generate a GraphSpec.
 */
export const fakeGraph: GraphSkeleton = {
  state: {
    'inner-pipeline': {
      description: '',
      groupMeta: {
        'add': {
          description: 'python:3.7',
        },
        'inner-pipeline': {
          description: '',
          groupMeta: {
            'add': {
              description: 'python:3.7',
            },
            'inner-pipeline': {
              description: '',
              hasControlNode: true,
              groupMeta: {
                'add': {
                  description: 'python:3.7',
                },
                'add-2': {
                  description: 'python:3.7',
                },
              },
            },
          },
          hasControlNode: true,
        },
      },
      hasControlNode: true,
    },
  },
  skeleton: [{
    id: 'inner-pipeline',
    type: 'group',
    definition: [
      {
        id: 'add',
        type: 'execution',
        next: [{
          id: 'inner-pipeline',
          type: 'group',
          definition: [{
            id: 'add',
            type: 'execution',
            next: [{
              id: 'inner-pipeline',
              type: 'group',
              definition: [
                {
                  id: 'add',
                  type: 'execution',
                  next: [{id: 'add-2', type: 'execution'}]
                },
              ],
            }]
          }],
        }]
      },
    ],
  }],
};
