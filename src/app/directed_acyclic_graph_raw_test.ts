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

import 'jasmine';

import {getHarness} from '@angular/cdk/testing/catalyst';
import {Component, ViewChild} from '@angular/core';
import {beforeEach, bootstrap, describe, expect, flush, it, setupModule} from 'google3/javascript/angular2/testing/catalyst';
import {fakeGraph} from 'google3/third_party/javascript/workflow_graph/src/app/test_resources/fake_data';

import {DagRaw, DagRawModule} from './directed_acyclic_graph_raw';
import {DagEdge, DagNode as Node, DagNode, GraphSpec} from './node_spec';
import {TEST_IMPORTS, TEST_PROVIDERS} from './test_providers';
import {DagRawHarness} from './test_resources/directed_acyclic_graph_raw_harness';

const FAKE_DATA: GraphSpec =
    Node.createFromSkeleton(fakeGraph.skeleton, fakeGraph.state);

describe('DirectedAcyclicGraph Raw Canvas -', () => {
  describe('[UI]', () => {
    let hostPage: DagWrapper;

    beforeEach(() => {
      setupModule({
        declarations: [DagWrapper],
        imports: [
          ...TEST_IMPORTS,
          DagRawModule,
        ],
        providers: [
          ...TEST_PROVIDERS,
        ],
      });
      const fixture = bootstrap(DagWrapper);
      hostPage = fixture;
      flush();
    });

    it('Renders correctly', async () => {
      flush();
      expect(hostPage.dagRaw).toBeDefined();
      expect(hostPage.dagRaw.nodes).toBeDefined();
      expect(hostPage.dagRaw.edges).toBeDefined();
      expect(hostPage.dagRaw.groups).toBeDefined();
      expect(await getHarness(DagRawHarness)).toBeDefined();
    });

    it('Selection and data binding for nodes works', async () => {
      flush();
      const el = await getHarness(DagRawHarness);
      await el.clickArtifactNode('TransformedTable');

      expect(hostPage.dagRaw.selectedNode?.node.getNodeDisplayName())
          .toBe('TransformedTable');
    });

    it('Preserves selection data on reassignment', async () => {
      flush();
      const el = await getHarness(DagRawHarness);
      await el.clickArtifactNode('TransformedTable');

      const {dagRaw} = hostPage;
      const newNode = new DagNode('test', 'artifact');
      const newEdge: DagEdge = {from: 'TransformedTable', to: newNode.id};
      dagRaw.nodes = [...FAKE_DATA.nodes, newNode];
      dagRaw.edges = [...FAKE_DATA.edges, newEdge];
      flush();

      expect(dagRaw.selectedNode?.node.getNodeDisplayName())
          .toBe('TransformedTable');
    });

    it('Unselect node when a node is clicked again on the graph', async () => {
      flush();
      const el = await getHarness(DagRawHarness);
      await el.clickArtifactNode('TransformedTable');
      expect(hostPage.dagRaw.selectedNode).not.toBeNull();
      await el.clickArtifactNode('TransformedTable');

      expect(hostPage.dagRaw.selectedNode).toBeNull();
    });

    it('Custom Node renders correctly', async () => {
      flush();
      const el = await getHarness(DagRawHarness);
      await el.clickCustomNode('CustomNode1');
      expect(hostPage.dagRaw.selectedNode).toBeNull();
    });
  });

  describe('[Internals]', () => {
    let renderer: DagRaw;

    beforeEach(() => {
      setupModule({
        declarations: [DagWrapper],
        imports: [
          ...TEST_IMPORTS,
          DagRawModule,
        ],
        providers: [
          ...TEST_PROVIDERS,
        ],
      });
      const fixture = bootstrap(DagWrapper);
      renderer = fixture.dagRaw;
      flush();
    });

    it('`ensureNode` behaves as expected', () => {
      flush();
      renderer.nodes = [
        new DagNode('a', 'execution', 'CANCELLED'),
        new DagNode('b', 'artifact'),
      ];
      renderer.edges = [{from: 'a', to: 'b'}];
      flush();

      expect(renderer.ensureNode('a')).toBeDefined();
      expect(renderer.ensureNode('a').id).toBe('a');
      expect(renderer.ensureNode('a').type).toBe('execution');
      expect(renderer.ensureNode('a').state).toBe('CANCELLED');
      expect(renderer.ensureNode('b').id).toBe('b');
    });
    it('`animatedEdge` behaves as expected', () => {
      flush();
      renderer.nodes = [
        new DagNode('root', 'execution', 'SUCCEEDED'),
        new DagNode('a1', 'execution', 'CANCELLED'),
        new DagNode('a2', 'execution', 'RUNNING'),
        new DagNode('b1', 'artifact'),
        new DagNode('b2', 'artifact', 'NO_STATE_RUNTIME'),
        new DagNode('c', 'execution', 'NO_STATE_STATIC'),
      ];
      const edges = renderer.edges = [
        {from: 'root', to: 'a1'},
        {from: 'root', to: 'a2'},
        {from: 'a1', to: 'b1'},
        // Edge to this should not animate as it's static
        {from: 'a2', to: 'b1'},
        {from: 'a2', to: 'b2'},
        {from: 'b1', to: 'c'},
        {from: 'b2', to: 'c'},
      ];
      flush();

      expect(renderer.animatedEdge(edges[0])).toBe(false);
      expect(renderer.animatedEdge(edges[1])).toBe(true);
      expect(renderer.animatedEdge(edges[2])).toBe(false);
      expect(renderer.animatedEdge(edges[3])).toBe(false);
      expect(renderer.animatedEdge(edges[4])).toBe(true);
      expect(renderer.animatedEdge(edges[5])).toBe(false);
      expect(renderer.animatedEdge(edges[6])).toBe(false);
    });
    it('`selectNodeById` behaves as expected', () => {
      flush();
      renderer.nodes = [
        new DagNode('a', 'execution', 'CANCELLED'),
      ];
      renderer.edges = [];
      spyOn(renderer.selectedNodeChange, 'emit');
      flush();

      expect(renderer.selectNodeById()).toBeFalse();
      expect(renderer.selectNodeById('b')).toBeFalse();
      expect(renderer.selectNodeById('a')).toBeTrue();
      expect(renderer.selectedNode?.node).toBe(renderer.nodes[0]);
      // There should be no toggle when using this method
      expect(renderer.selectNodeById('a')).toBeTrue();
      expect(renderer.selectedNodeChange.emit).toHaveBeenCalled();
    });
    it('`pendingOrStatic` behaves as expected', () => {
      flush();
      renderer.nodes = [
        new DagNode('a', 'execution', 'CANCELLED'),
        new DagNode('b', 'execution', 'NO_STATE_RUNTIME'),
        new DagNode('c', 'execution', 'NO_STATE_STATIC'),
        new DagNode('d', 'execution', 'PENDING'),
      ];
      renderer.edges = [];
      flush();

      expect(renderer.pendingOrStatic('a'))
          .toBe(renderer.pendingOrStatic(renderer.nodes[0]));
      expect(renderer.pendingOrStatic('a')).toBe(false);
      expect(renderer.pendingOrStatic('b')).toBe(false);
      expect(renderer.pendingOrStatic('c')).toBe(true);
      expect(renderer.pendingOrStatic('d')).toBe(true);
    });
    it('`toggleClass` behaves as expected', () => {
      flush();

      expect(renderer.toggleClass(true, 'a')).toBe('a');
      expect(renderer.toggleClass(false, 'a')).toBe('');
    });
  });
});

@Component({
  template: `
    <div class="container">
      <ai-dag-raw #dagRaw
          [nodes]="graph.nodes"
          [edges]="graph.edges"
          [groups]="graph.groups">
      </ai-dag-raw>
    </div>`,
  styles: [`
    .container {
      height: 400px;
      width: 400px;
    }`],
})
class DagWrapper {
  @ViewChild('dagRaw', {static: false}) dagRaw!: DagRaw;
  graph: GraphSpec = FAKE_DATA;
}
