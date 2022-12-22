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

import {DirectedAcyclicGraph, DirectedAcyclicGraphModule} from './directed_acyclic_graph';
import {DagNode as Node, GraphSpec} from './node_spec';
import {TEST_IMPORTS, TEST_PROVIDERS} from './test_providers';
import {DirectedAcyclicGraphHarness} from './test_resources/directed_acyclic_graph_harness';

const FAKE_DATA: GraphSpec =
    Node.createFromSkeleton(fakeGraph.skeleton, fakeGraph.state);


function sleep(t: number) {
  return new Promise<void>(res => {
    setTimeout(() => {
      res();
    }, t);
  });
}

describe('DirectedAcyclicGraph Renderer -', () => {
  describe('[Renderer UI]', () => {
    let hostPage: DagWrapper;

    beforeEach(() => {
      setupModule({
        declarations: [DagWrapper],
        imports: [
          ...TEST_IMPORTS,
          DirectedAcyclicGraphModule,
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
      expect(hostPage.dagRender).toBeDefined();
      expect(hostPage.dagRender.nodes).toBeDefined();
      expect(hostPage.dagRender.edges).toBeDefined();
      const harness = await getHarness(DirectedAcyclicGraphHarness);
      expect(harness).toBeDefined();
    });
  });

  describe('[Minimap]', () => {
    let hostPage: DagWrapper;

    beforeEach(() => {
      setupModule({
        declarations: [DagWrapper],
        imports: [
          ...TEST_IMPORTS,
          DirectedAcyclicGraphModule,
        ],
        providers: [
          ...TEST_PROVIDERS,
        ],
      });
      const fixture = bootstrap(DagWrapper);
      hostPage = fixture;
      flush();
    });

    it('Click on minimap pans graph', () => {
      // todo: Implement
      // Avoids "Spec has no expectations" warning for passing tests
      expect(2 + 2).toBeCloseTo(4);
    });

    // TODO(b/174130521): Fix test: go/catalyst-it-async-problem
    it.broken(
        'Minimap size should dimensionally be greater than or equal to graph',
        async () => {
          // Avoids "Spec has no expectations" warning for passing tests
          expect(2 + 2).toBeCloseTo(4);
          const dag = hostPage.dagRender;

          // The following is needed since this function is throttled using
          // lodash
          flush();
          await sleep(50);
          flush();
          await sleep(1);

          const {
            mmWidth,
            mmHeight,
            mmWinHeight,
            mmWinWidth,
            graphHeight,
            graphWidth,
          } = dag;
          const scale = mmWidth / graphWidth;
          expect(mmHeight).toBeGreaterThanOrEqual(scale * graphHeight);
          expect(mmWinWidth).toBeLessThanOrEqual(mmWidth);
          expect(mmWinHeight).toBeLessThanOrEqual(mmHeight);
        });
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
