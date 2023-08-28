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

import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Component, ViewChild} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';

import {DirectedAcyclicGraph, DirectedAcyclicGraphModule} from './directed_acyclic_graph';
import {DagNode as Node, GraphSpec} from './node_spec';
import {TEST_IMPORTS, TEST_PROVIDERS} from './test_providers';
import {DirectedAcyclicGraphHarness} from './test_resources/directed_acyclic_graph_harness';
import {fakeGraph} from './test_resources/fake_data';

const FAKE_DATA: GraphSpec =
    Node.createFromSkeleton(fakeGraph.skeleton, fakeGraph.state);

TestBed.resetTestEnvironment();
TestBed.initTestEnvironment(
    BrowserDynamicTestingModule, platformBrowserDynamicTesting(),
    {teardown: {destroyAfterEach: true}});

describe('Directed Acyclic Graph Renderer', () => {
  beforeEach(waitForAsync(async () => {
    await TestBed
        .configureTestingModule({
          declarations: [DagWrapper],
          imports: [
            ...TEST_IMPORTS,
            DirectedAcyclicGraphModule,
          ],
          providers: [...TEST_PROVIDERS],
        })
        .compileComponents();
  }));

  describe('UI', () => {
    let fixture: ComponentFixture<DagWrapper>;
    let harness: DirectedAcyclicGraphHarness;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(DagWrapper);
      fixture.detectChanges();

      const loader = TestbedHarnessEnvironment.loader(fixture);
      harness = await loader.getHarness(DirectedAcyclicGraphHarness);
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('Renders correctly', async () => {
      expect(fixture.componentInstance.dagRender).toBeDefined();
      expect(fixture.componentInstance.dagRender.nodes).toBeDefined();
      expect(fixture.componentInstance.dagRender.edges).toBeDefined();
      expect(harness).toBeDefined();
    });

    it('Nodes and groups are ordered by their coordinates in the DOM (for tab key navigation)',
       fakeAsync(async () => {
         const nodes = await harness.getRootNodesAndGroups();
         const renderedCoordinates = await Promise.all(nodes.map(
             async node => ({
               x: Number((await node.getCssValue('left')).replace('px', '')),
               y: Number((await node.getCssValue('top')).replace('px', '')),
             })));
         const sorted = [...renderedCoordinates].sort(
             (a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);

         expect(renderedCoordinates).toEqual(sorted);
       }));
  });
});

@Component({
  template: `
    <div class="container">
      <ai-dag-renderer #dagRender
          [nodes]="graph.nodes"
          [edges]="graph.edges"
          [groups]="graph.groups">
      </ai-dag-renderer>
    </div>`,
  styles: [`
    .container {
      height: 1200px;
      width: 1200px;
    }`],
})
class DagWrapper {
  @ViewChild('dagRender', {static: false}) dagRender!: DirectedAcyclicGraph;
  graph: GraphSpec = FAKE_DATA;
}
