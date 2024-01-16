/*
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

import {DagNodeSkeleton} from '../../node_spec';

import {GraphSkeleton} from './shared';

class SkeletonNode {
  id: string;
  next: Array<SkeletonNode|SkeletonGroup>;
  type = 'execution';

  constructor(id: string) {
    this.id = id;
    this.next = [];
  }
}

class SkeletonGroup {
  id: string;
  definition: Array<SkeletonNode|SkeletonGroup>;
  type = 'group';

  constructor(id: string) {
    this.id = id;
    this.definition = [];
  }
}

function generateGraph(
    numNodes: number, childrenPerNode: number): SkeletonNode {
  let allNodes: Array<SkeletonNode|SkeletonGroup> = [];
  for (let i = 0; i < numNodes; i++) {
    allNodes.push(
        i % 5 !== 0 ? new SkeletonNode(i.toString()) :
                      new SkeletonGroup(i.toString()));
  }

  const root = new SkeletonNode('root');
  const queue: Array<SkeletonNode|SkeletonGroup> = [root];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (let i = 0; i < childrenPerNode && allNodes.length > 0; i++) {
      const childNode = allNodes.shift()!;
      if (current.type === 'group') {
        (current as SkeletonGroup).definition.push(childNode);
      } else if (current.type === 'execution') {
        (current as SkeletonNode).next.push(childNode);
      }

      queue.push(childNode);
    }
  }

  return root;
}

const root = generateGraph(1000, 3);

export const giganticDemo: GraphSkeleton = {
  'skeleton': [root as DagNodeSkeleton]
}
