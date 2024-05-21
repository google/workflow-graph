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
 * @fileoverview This file contains the fake data json payload for as scenario
 * with all possible edge marker styles
 */

import {GraphSkeleton} from './shared';

/**
 * A graph dataset showcasing all edge marker styles.
 */
export const fakeGraph: GraphSkeleton = {
  state: {
    'Single Node': {
      state: 'SUCCEEDED',
      description: 'Just a node alone',
      icon: {
        name: 'artifact-file',
        iconset: 'cloud_ai',
        size: 'medium',
      },
    },
  },
  skeleton: [{
    id: 'Node 1',
    type: 'execution',
    next: [{
      edgeOpts: {
        fromMarkerStyle: 'circle',
        toMarkerStyle: 'circle',
      },
      id: 'Node 2',
      edgeLabel: 'circle',
      type: 'execution',
      next: [{
        edgeOpts: {
          // NOTE: fromMarkerStyle = 'arrow' is the same as 'circle'.
          fromMarkerStyle: 'arrow',
          toMarkerStyle: 'arrow',
        },
        id: 'Node 3',
        edgeLabel: 'arrow',
        type: 'execution',
        next: [{
          edgeOpts: {
            fromMarkerStyle: 'hidden',
            toMarkerStyle: 'hidden',
          },
          id: 'Node 4',
          edgeLabel: 'hidden',
          type: 'execution',
        }],
      }],
    }],
  }],
};