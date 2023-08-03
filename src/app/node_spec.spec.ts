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

import {DagNode, DagNodeMeta, DagNodeSkeleton, NodeType} from './node_spec';

describe('DirectedAcyclicGraph NodeSpec', () => {
  it('Constructs a node correctly', () => {
    const type = 'execution';
    const id = 'abc';
    const displayName = 'Test Node';
    const {nodes, edges} = DagNode.createFromSkeleton(
        [{id, type}],
        {[id]: {displayName} as DagNodeMeta},
    );
    const rawNode = new DagNode(id, type, undefined, {displayName});
    expect(nodes[0]).toEqual(rawNode);
    expect(edges).toEqual([]);
  });

  it('Does not consume the source input', () => {
    const e = {type: 'execution' as NodeType};
    const skeleton: DagNodeSkeleton[] = [{id: 'AP', ...e}, {id: 'Kwasi', ...e}];
    DagNode.createFromSkeleton(skeleton);
    expect(skeleton.length).toBe(2);
  });

  it('Constructs DAG-like nodes correctly', () => {
    const skeleton = [
      {id: 'a', type: 'execution', next: [{id: 'b', type: 'artifact'}]},
      {id: 'c', type: 'execution', next: [{id: 'b', type: 'artifact'}]},
    ] as DagNodeSkeleton[];
    const {nodes, edges, nodeMap} = DagNode.createFromSkeleton(skeleton);

    // Node B should only be listed once as it should be linked to both a and c
    expect(nodes.filter(n => n.id === 'b').length).toBe(1);
    expect(edges.length).toBe(2);

    expect([...nodeMap!.nodes['a'].edges]).toEqual([{from: 'a', to: 'b'}]);
    expect([...nodeMap!.nodes['c'].edges]).toEqual([{from: 'c', to: 'b'}]);
  });

  it('Creates a NodeMap via both methods correctly', () => {
    const skeleton = [
      {id: 'a', type: 'execution', next: [{id: 'b', type: 'artifact'}]},
      {id: 'c', type: 'execution', next: [{id: 'b', type: 'artifact'}]},
      // TODO: Add group related case here as well
    ] as DagNodeSkeleton[];
    const {nodes, edges, nodeMap} = DagNode.createFromSkeleton(skeleton);
    const nodeMapB = DagNode.createNodeMap(nodes, edges);
    expect(nodeMap).toEqual(nodeMapB);
    expect(nodeMap).toEqual({
      nodes: {
        a: {
          node: nodes.find(n => n.id === 'a')!,
          edges: edges.filter(({from}) => from === 'a')
        },
        b: {
          node: nodes.find(n => n.id === 'b')!,
          edges: [],
        },
        c: {
          node: nodes.find(n => n.id === 'c')!,
          edges: edges.filter(({from}) => from === 'c')
        },
      },
      groups: {},
    });
  });
});
