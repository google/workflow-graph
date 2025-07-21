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

import {CdkDragMove} from '@angular/cdk/drag-drop';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Component, EventEmitter, Input, ViewChild} from '@angular/core';
import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';

import {ScreenshotTest} from '../screenshot_test';

import {ColorThemeLoader} from './color_theme_loader';
import {DagStateService} from './dag-state.service';
import {STATE_SERVICE_PROVIDER} from './dag-state.service.provider';
import {type LayoutOptions, RankDirection} from './data_types_internal';
import {DirectedAcyclicGraph, DirectedAcyclicGraphModule, generateTheme} from './directed_acyclic_graph';
import {DagEdge, DagNode as Node, type GraphSpec, type NodeRef} from './node_spec';
import {DirectedAcyclicGraphHarness} from './test_resources/directed_acyclic_graph_harness';
import {createDagSkeletonWithCustomGroups, createDagSkeletonWithGroups, createDagSkeletonWithNormalGroups, fakeGraph, fakeGraphWithColoredLabels, fakeGraphWithEdgeOffsets, fakeGraphWithLabelIcons, fakeGraphWithRotatedLabels} from './test_resources/fake_data';
import {initTestBed} from './test_resources/test_utils';

const FAKE_DATA: GraphSpec =
    Node.createFromSkeleton(fakeGraph.skeleton, fakeGraph.state);

describe('Directed Acyclic Graph Renderer', () => {
  let screenShot: ScreenshotTest;
  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [DirectedAcyclicGraphModule, ColorThemeLoader],
    });
    screenShot = new ScreenshotTest(module.id);
  }));

  describe('UI', () => {
    let fixture: ComponentFixture<TestComponent>;
    let dragElement: HTMLElement;
    let harness: DirectedAcyclicGraphHarness;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const loader = TestbedHarnessEnvironment.loader(fixture);
      harness = await loader.getHarness(DirectedAcyclicGraphHarness);
      dragElement = fixture.nativeElement.querySelector('.cdk-drag');
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

    it('Expands nested graph to follow node.', fakeAsync(() => {
         fixture = TestBed.createComponent(TestComponent);
         fixture.componentRef.setInput(
             'followNode', {id: 'Fake Exec 1', path: ['sub1', 'subn1']});
         fixture.detectChanges();

         tick(1000);

         // Shows that the camera moved from (0,0) without error
         expect(fixture.componentInstance.dagRender.graphX)
             .not.toBeCloseTo(0, 10);
         expect(fixture.componentInstance.dagRender.graphY)
             .not.toBeCloseTo(0, 10);

         // setting followNode continually adds more tasks to the queue (to
         // lock camera to the node). need to destroy the component then flush
         // out the tasks
         fixture.destroy();
         flush();
       }));

    it('throttles CdkDragMove events', fakeAsync(() => {
         spyOn(fixture.componentInstance.dagRender, 'graphPan');
         // Simulating drag events is super complex and outside the scope of
         // this test, so we just call the event handler methods directly.
         fixture.componentInstance.dagRender.graphPanThrottled(
             'move', {} as CdkDragMove);
         fixture.componentInstance.dagRender.graphPanThrottled(
             'move', {} as CdkDragMove);
         fixture.componentInstance.dagRender.graphPanThrottled(
             'move', {} as CdkDragMove);
         tick(25);
         fixture.detectChanges();
         expect(fixture.componentInstance.dagRender.graphPan)
             .toHaveBeenCalledTimes(1);

         fixture.componentInstance.dagRender.graphPanThrottled(
             'move', {} as CdkDragMove);
         fixture.componentInstance.dagRender.graphPanThrottled(
             'move', {} as CdkDragMove);
         fixture.componentInstance.dagRender.graphPanThrottled(
             'move', {} as CdkDragMove);
         tick(25);
         fixture.detectChanges();
         expect(fixture.componentInstance.dagRender.graphPan)
             .toHaveBeenCalledTimes(2);
       }));

    describe('with custom groups', () => {
      let fixture: ComponentFixture<TestComponent>;

      afterEach(fakeAsync(() => {
        fixture.destroy();
      }));

      async function setup(
          options: {hideControlNodeOnExpand?: boolean,
                    expanded?: boolean} = {}) {
        const {
          hideControlNodeOnExpand = false,
          expanded = false,
        } = options;
        fixture = TestBed.createComponent(TestComponent);
        const skeleton = createDagSkeletonWithCustomGroups(expanded)
        const graphSpec =
            Node.createFromSkeleton(skeleton.skeleton, skeleton.state);
        fixture.componentRef.setInput('graph', graphSpec);
        fixture.detectChanges();
        await fixture.whenStable();
      }

      it('renders correctly', async () => {
        await setup();
        await screenShot.expectMatch(`graph_custom_control_node`);
      });

      it('renders correctly with group expanded and control hidden',
         async () => {
           await setup({expanded: true});
           await screenShot.expectMatch(
               `graph_expanded_with_custom_control_node_hidden`);
         });
    });

    describe('with internal edges', () => {
      let fixture: ComponentFixture<TestComponent>;

      afterEach(fakeAsync(() => {
        fixture.destroy();
      }));

      async function setup(options: {
        hideControlNodeOnExpand?: boolean,
        expanded?: boolean,
        internalEdges?: DagEdge[]
      } = {}) {
        const {
          hideControlNodeOnExpand = false,
          expanded = false,
          internalEdges = [],
        } = options;
        fixture = TestBed.createComponent(TestComponent);
        const skeleton = createDagSkeletonWithNormalGroups(expanded);
        const graphSpec =
            Node.createFromSkeleton(skeleton.skeleton, skeleton.state);
        fixture.componentRef.setInput('internalEdges', internalEdges);
        fixture.componentRef.setInput(
            'rankDirection', RankDirection.LEFT_TO_RIGHT);
        fixture.componentRef.setInput('graph', graphSpec);
        fixture.detectChanges();
        await fixture.whenStable();
      }

      it('renders correctly with group expanded and internal edges visible',
         async () => {
           await setup({
             expanded: true,
             internalEdges: [{from: 'client', to: 'node1'}]
           });
           fixture.detectChanges();
           await fixture.whenStable();
           await screenShot.expectMatch(`graph_expanded_with_internal_edges`);
         });
    });
    describe('with group labels', () => {
      let fixture: ComponentFixture<TestComponent>;

      afterEach(fakeAsync(() => {
        fixture.destroy();
      }));

      function setup(options: {treatAsLoop?: boolean} = {}) {
        const {
          treatAsLoop = false,
        } = options;
        fixture = TestBed.createComponent(TestComponent);
        const skeleton = createDagSkeletonWithGroups(treatAsLoop);
        const graphSpec =
            Node.createFromSkeleton(skeleton.skeleton, skeleton.state);
        fixture.componentRef.setInput('graph', graphSpec);
        fixture.detectChanges();
      }

      it('renders group label when it is given', async () => {
        setup();
        await screenShot.expectMatch(`graph_group_with_label`);
      });

      it('renders group label instead of number of iterations correctly when treatAsLoop is true',
         async () => {
           setup({treatAsLoop: true});
           await screenShot.expectMatch(
               `graph_group_with_label_and_treat_as_loop`);
         });
    });

    describe('when loading', () => {
      let fixture: ComponentFixture<TestComponent>;
      beforeEach(() => {
        fixture = TestBed.createComponent(TestComponent);
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();
      });

      it('renders correctly', async () => {
        await screenShot.expectMatch(`graph_loading`);
      });
    });

    describe('with edge offsets', () => {
      let fixture: ComponentFixture<TestComponent>;

      beforeEach(() => {
        fixture = TestBed.createComponent(TestComponent);
        const graphSpec = Node.createFromSkeleton(
            fakeGraphWithEdgeOffsets.skeleton, fakeGraphWithEdgeOffsets.state);
        fixture.componentRef.setInput('graph', graphSpec);
        fixture.componentRef.setInput(
            'theme', generateTheme({edgeStyle: 'snapped'}));
        fixture.detectChanges();
      });

      it('renders correctly', async () => {
        await screenShot.expectMatch(`graph_with_edge_offsets`);
      });
    });

    describe('with custom label color', () => {
      let fixture: ComponentFixture<TestComponent>;

      beforeEach(() => {
        fixture = TestBed.createComponent(TestComponent);
        const graphSpec = Node.createFromSkeleton(
            fakeGraphWithColoredLabels.skeleton,
            fakeGraphWithColoredLabels.state);
        fixture.componentRef.setInput('graph', graphSpec);
        fixture.componentRef.setInput(
            'theme', generateTheme({edgeLabelColor: 'yellow'}));
        fixture.detectChanges();
      });

      it('renders correctly', async () => {
        await screenShot.expectMatch(`graph_with_colored_labels`);
      })
    })

    describe('rotated along tangent', () => {
      let fixture: ComponentFixture<TestComponent>;

      beforeEach(() => {
        fixture = TestBed.createComponent(TestComponent);
        const graphSpec = Node.createFromSkeleton(
            fakeGraphWithRotatedLabels.skeleton,
            fakeGraphWithRotatedLabels.state);
        fixture.componentRef.setInput('graph', graphSpec);
        fixture.componentRef.setInput(
            'theme', generateTheme({edgeStyle: 'snapped'}));
        fixture.detectChanges();
      });

      it('renders correctly', async () => {
        await screenShot.expectMatch(`graph_with_rotated_labels`);
      })
    })

    describe('with label icons', () => {
      let fixture: ComponentFixture<TestComponent>;

      beforeEach(() => {
        fixture = TestBed.createComponent(TestComponent);
        const graphSpec = Node.createFromSkeleton(
            fakeGraphWithLabelIcons.skeleton, fakeGraphWithLabelIcons.state);
        fixture.componentRef.setInput('graph', graphSpec);
        fixture.detectChanges();
      });

      it('renders correctly', async () => {
        await screenShot.expectMatch(`graph_with_label_icons`);
      })
    })
  });
});

@Component({
  standalone: false,
  template: `
    <div class="container">
      <ai-dag-renderer #dagRender
          [nodes]="graph.nodes"
          [edges]="graph.edges"
          [groups]="graph.groups"
          [followNode]="followNode"
          [loading]="loading"
          [customNodeTemplates]="{'outlineBasic': outlineBasic}"
          [theme]="theme"
          [internalEdges]="internalEdges"
          [layout]="layout"
      >
      </ai-dag-renderer>
    </div>

    <ng-template #outlineBasic let-node="node">
      <div
        [style.position]="'absolute'"
        [style.top]="'0'"
        [style.left]="'0'"
        [style.right]="'0'"
        [style.bottom]="'0'"
        [style.overflow]="'auto'"
        [style.padding.em]=".5"
        [style.background]="'rgb(255,255,255)'"
        [style.display]="'flex'"
        [style.flex-direction]="'column'"
        [style.border]="'1px solid rgb(26, 115, 232)'"
        [style.border-radius]="'6px'"
      >
        <div [style.display]="'flex'">
          <b>{{node.displayName}}</b>
        </div>
      </div>
    </ng-template>`,
  styles: [`
    .container {
      height: 1200px;
      width: 1200px;
    }`],
  providers: [
    // STATE_SERVICE_PROVIDER,
  ],
  // TODO: Make this AOT compatible. See b/352713444
  jit: true,

})
class TestComponent {
  @ViewChild('dagRender', {static: false}) dagRender!: DirectedAcyclicGraph;
  @Input() graph: GraphSpec = FAKE_DATA;
  @Input() internalEdges: DagEdge[] = [];
  @Input() rankDirection: RankDirection = RankDirection.TOP_TO_BOTTOM;
  @Input() followNode: NodeRef|null = null;
  @Input() loading = false;
  @Input() theme = generateTheme({});
  get layout(): LayoutOptions {
    return {
      rankDirection: this.rankDirection
    }
  }
}
