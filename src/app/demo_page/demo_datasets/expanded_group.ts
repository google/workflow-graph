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

export const fakeGraph: GraphSkeleton = {
  'skeleton': [{
    id: 'node1',
    type: 'execution',
    next: [
      {
        id: 'node2',
        type: 'execution',
        edgeLabel: 'the label',
      },
      {
        id: 'node3',
        type: 'group',
        definition: [{
          id: 'child1',
          type: 'execution',
          next: [{
            id: 'child2',
            type: 'execution',
            next: [{
              id: 'child3',
              type: 'execution',
              next: [{
                id: 'child4',
                type: 'execution',
                next: [{id: 'child5', type: 'execution'}]
              }]
            }]
          }]
        }]
      },
      {id: 'node4', type: 'execution'}
    ]
  }]
};