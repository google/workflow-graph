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

import {CustomNode, DagGroup, DagNode, DagNodeMeta, DagNodeSkeleton, isCustomNode, NodeType} from './node_spec';

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

  describe('isCustomNode', () => {
    it('returns true for a CustomNode instance', () => {
      // Arrange
      const node = new DagNode('test', 'execution');
      const customNode = new CustomNode(node, 'testTemplate', 100, 50);

      // Act
      const result = isCustomNode(customNode);

      // Assert
      expect(result).toBeTrue();
    });

    it('returns true for a duck-typed CustomNode', () => {
      // Arrange
      const duckNode = {
        id: 'test',
        type: 'execution',
        templateRef: 'testTemplate',
        clone: () => duckNode,
      } as unknown as CustomNode;

      // Act
      const result = isCustomNode(duckNode);

      // Assert
      expect(result).toBeTrue();
    });

    it('returns false for a standard DagNode', () => {
      // Arrange
      const node = new DagNode('test', 'execution');

      // Act
      const result = isCustomNode(node);

      // Assert
      expect(result).toBeFalse();
    });

    it('returns false for a DagGroup', () => {
      // Arrange
      const group = new DagGroup('group1');

      // Act
      const result = isCustomNode(group);

      // Assert
      expect(result).toBeFalse();
    });

    it('returns false for undefined', () => {
      // Act
      const result = isCustomNode(undefined);

      // Assert
      expect(result).toBeFalse();
    });

    it('returns false for null', () => {
      // Act
      const result = isCustomNode(null);

      // Assert
      expect(result).toBeFalse();
    });
  });

  describe('DagGroup Custom Control Node', () => {
    it('generateControlNode returns the custom control node if provided',
       () => {
         // Arrange
         const baseNode = new DagNode('ctrl', 'execution');
         const customControlNode =
             new CustomNode(baseNode, 'ctrlTemplate', 200, 100);
         const group = new DagGroup(
             'group1', [], [], [], 'NO_STATE_STATIC',
             {hasControlNode: true, customControlNode});

         // Act
         const generatedNode = group.generateControlNode();

         // Assert
         expect(generatedNode).toBe(customControlNode);
         expect(group.width).toBe(200);
         expect(group.height).toBe(100);
       });

    it('generateControlNode creates a standard node if no custom node provided',
       () => {
         // Arrange
         const group = new DagGroup('group1', [], [], [], 'NO_STATE_STATIC', {
           hasControlNode: true,
         });

         // Act
         const generatedNode = group.generateControlNode();

         // Assert
         expect(generatedNode).toBeInstanceOf(DagNode);
         expect(generatedNode).not.toBeInstanceOf(CustomNode);
         expect(generatedNode!.id).toBe('group1');
       });
  });
});
