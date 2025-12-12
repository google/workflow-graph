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

import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Component, ViewChild} from '@angular/core';
import {ComponentFixture, fakeAsync, flush, TestBed, waitForAsync} from '@angular/core/testing';
import {MatSelectHarness} from '@angular/material/select/testing';

import {DagStateService} from './dag-state.service';
import {createDAGFeatures} from './data_types_internal';
import {DagRaw, DagRawModule} from './directed_acyclic_graph_raw';
import {CustomNode, DagEdge, DagGroup, DagNode as Node, DagNode, GraphSpec} from './node_spec';
import {DagRawHarness} from './test_resources/directed_acyclic_graph_raw_harness';
import {createDagSkeletonWithCustomGroups, fakeGraph} from './test_resources/fake_data';
import {initTestBed} from './test_resources/test_utils';

const FAKE_DATA: GraphSpec =
    Node.createFromSkeleton(fakeGraph.skeleton, fakeGraph.state);

describe('Directed Acyclic Graph Raw', () => {
  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [DagRawModule],
      providers: [{
        provide: DagStateService,
        useValue: jasmine.createSpyObj(
            'DagStateService',
            [
              'listenAll',
              'destroyAll',
              'setIterationChange',
              'setSelectedNode',
              'setExpandPath',
              'setGroupExpandToggled',
            ]),
      }]
    });
  }));

  describe('UI', () => {
    let fixture: ComponentFixture<TestComponent>;
    let harness: DagRawHarness;
    let loader: HarnessLoader;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.componentInstance.dagRaw.updateGraphLayout();
      fixture.componentInstance.dagRaw.detectChanges();

      loader = TestbedHarnessEnvironment.loader(fixture);
      harness = await loader.getHarness(DagRawHarness);
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('Renders correctly', fakeAsync(async () => {
         expect(fixture.componentInstance.dagRaw).toBeDefined();
         expect(fixture.componentInstance.dagRaw.nodes).toBeDefined();
         expect(fixture.componentInstance.dagRaw.edges).toBeDefined();
         expect(fixture.componentInstance.dagRaw.groups).toBeDefined();
         expect(harness).toBeDefined();
       }));

    it('Selection and data binding for nodes works', waitForAsync(async () => {
         await harness.clickArtifactNode('TransformedTable');
         expect(fixture.componentInstance.dagRaw.selectedNode?.node
                    .getNodeDisplayName())
             .toBe('TransformedTable');
       }));

    it('Does not emit iteration change events on init',
       waitForAsync(async () => {
         expect(TestBed.inject(DagStateService).setIterationChange)
             .not.toHaveBeenCalled();
       }));

    it('Sets "selectedLoopId" when iteration is changed',
       waitForAsync(async () => {
         await harness.clickExecutionNode('TensorFlow Training');
         expect(
             (fixture.componentInstance.dagRaw.selectedNode?.node as DagGroup)
                 .selectedLoopId)
             .toBe('it-2');

         const select = await loader.getHarness(MatSelectHarness);
         await select.open();
         await select.clickOptions({text: 'Iteration 5'});

         expect(
             (fixture.componentInstance.dagRaw.selectedNode?.node as DagGroup)
                 .selectedLoopId)
             .toBe('it-5');
         expect(TestBed.inject(DagStateService).setIterationChange)
             .toHaveBeenCalled();
       }));

    it('Preserves selection data on reassignment', waitForAsync(async () => {
         await harness.clickArtifactNode('TransformedTable');
         const {dagRaw} = fixture.componentInstance;
         const newNode = new DagNode('test', 'artifact');
         const newEdge: DagEdge = {from: 'TransformedTable', to: newNode.id};
         dagRaw.nodes = [...FAKE_DATA.nodes, newNode];
         dagRaw.edges = [...FAKE_DATA.edges, newEdge];

         expect(dagRaw.selectedNode?.node.getNodeDisplayName())
             .toBe('TransformedTable');
       }));

    it('Unselect node when a node is clicked again on the graph',
       waitForAsync(async () => {
         await harness.clickArtifactNode('TransformedTable');
         expect(fixture.componentInstance.dagRaw.selectedNode).not.toBeNull();
         await harness.clickArtifactNode('TransformedTable');
         expect(fixture.componentInstance.dagRaw.selectedNode).toBeNull();
       }));

    it('Custom Node renders correctly', waitForAsync(async () => {
         await harness.clickCustomNode('CustomNode1');
         expect(fixture.componentInstance.dagRaw.selectedNode).toBeNull();
       }));

    it('Distracting animations are stoppable', waitForAsync(async () => {
         fixture.componentInstance.dagRaw.userConfigService.update(
             {a11y: {disableAnimations: true}});
         const animatedEdges = await harness.getEdges('.animated.running');
         expect(animatedEdges.length).toBe(0);
       }));

    it('Expanding group sets expanded attribute', fakeAsync(async () => {
         await harness.clickExpandToggle(0);
         expect(fixture.componentInstance.dagRaw.groups[1].expanded).toBe(true);
       }));

    it('Correctly sends click events for edge labels',
       waitForAsync(async () => {
         const spy = jasmine.createSpy('edgeLabelClick');
         fixture.componentInstance.dagRaw.edgeLabelClick.subscribe(spy);
         const edgeLabel = await harness.getEdgeLabel('storage (red-edge)');

         await edgeLabel.click();

         expect(spy).toHaveBeenCalledWith(
             jasmine.objectContaining({from: 'BigTable', to: 'AutoML Tables'}));
       }));

    // SKIP-PUBLIC
    xit('Groups with expanded attribute are expanded on load',
       waitForAsync(async () => {
         fixture.componentInstance.dagRaw.groups[1].expanded = true;
         fixture.detectChanges();
         expect(fixture.componentInstance.dagRaw.expandedGroups.has(
                    fixture.componentInstance.dagRaw.groups[1].id))
             .toBe(true);
         expect(fixture.componentInstance.dagRaw.groups[1].expanded).toBe(true);
       }));

    it('hides control node shadow when hideControlNodeShadow is true',
       fakeAsync(async () => {
         const FAKE_DATA_WITH_SHADOW: GraphSpec = Node.createFromSkeleton(
             [{
               id: 'group1',
               type: 'group',
               definition: [{id: 'node1', type: 'execution'}],
             }],
             {
               'group1': {
                 hasControlNode: true,
                 hideControlNodeShadow: true,
               },
             });

         fixture.componentInstance.graph = FAKE_DATA_WITH_SHADOW;
         fixture.detectChanges();
         await fixture.whenStable();
         fixture.componentInstance.dagRaw.updateGraphLayout();
         fixture.componentInstance.dagRaw.detectChanges();

         const shadowEl = await harness.getControlNodeShadow('group1');
         expect(await shadowEl.hasClass('control-node-shadow-hidden'))
             .toBe(true);
       }));

    describe('natural scrolling', () => {
      beforeEach(() => {
        fixture.componentInstance.features.scrollToZoom = false;
        fixture.componentInstance.features.naturalScrolling = true;
      });

      function fakeWheelEvent({deltaX = 0, deltaY = 0} = {}) {
        const event = new WheelEvent('wheel', {deltaX, deltaY});
        spyOn(event, 'stopPropagation').and.callThrough();
        return event;
      }

      function simulateDispatch(el: Element, event: WheelEvent) {
        // Couldn't get wheel events to propagate, so instead rely on
        // dispatchEvent to set event.target, and then directly pass it to
        // onNodeWheel.
        el.dispatchEvent(event);
        fixture.componentInstance.dagRaw.onNodeWheel(event);
      }

      describe('scrollable nodes', () => {
        function setup(selector: string) {
          const els = Array.from(fixture.nativeElement.querySelectorAll(
                          `${selector} *`)) as HTMLElement[];
          const el = els.find((e) => {
            // Try to force the element to be effectively scrollable
            e.style.overflow = 'scroll';
            e.style.minHeight = '0px';
            e.style.height = `${e.scrollHeight / 2}px`;
            e.style.minWidth = '0px';
            e.style.width = `${e.scrollWidth / 2}px`;
            return e.scrollHeight > e.clientHeight && e.clientHeight > 0 &&
                e.scrollWidth > e.clientWidth && e.clientWidth > 0;
          });
          if (!el) {
            throw new Error('Could not find an effectively scrollable element');
          }
          const deltaX = fakeWheelEvent({deltaX: 1});
          const deltaY = fakeWheelEvent({deltaY: 1});

          expect(el.clientHeight).toBeGreaterThan(1);
          expect(el.clientWidth).toBeGreaterThan(1);
          expect(el.scrollHeight).toBeGreaterThan(el.clientHeight);
          expect(el.scrollWidth).toBeGreaterThan(el.clientWidth);

          return {el, deltaX, deltaY};
        }

        it('captures events on scrollable dag nodes', () => {
          const {el, deltaX, deltaY} = setup('ai-dag-node');

          simulateDispatch(el, deltaX);
          expect(deltaX.stopPropagation).toHaveBeenCalled();

          simulateDispatch(el, deltaY);
          expect(deltaY.stopPropagation).toHaveBeenCalled();
        });

        // SKIP-PUBLIC
        xit('captures events on scrollable custom nodes', () => {
          const {el, deltaX, deltaY} = setup('.custom-node');

          simulateDispatch(el, deltaX);
          expect(deltaX.stopPropagation).toHaveBeenCalled();

          simulateDispatch(el, deltaY);
          expect(deltaY.stopPropagation).toHaveBeenCalled();
        });

        it('captures events on scrollable groups', () => {
          const {el, deltaX, deltaY} = setup('.group');

          simulateDispatch(el, deltaX);
          expect(deltaX.stopPropagation).toHaveBeenCalled();

          simulateDispatch(el, deltaY);
          expect(deltaY.stopPropagation).toHaveBeenCalled();
        });

        it('captures events with negative deltas', () => {
          const {el} = setup('.group');

          el.scrollLeft = el.clientWidth;
          el.scrollTop = el.clientHeight;
          const delta = fakeWheelEvent({deltaX: -1, deltaY: -1});
          simulateDispatch(el, delta);
          expect(delta.stopPropagation).toHaveBeenCalled();
        });

        // SKIP-PUBLIC
        xit('does not capture an event that wouldn\'t srcroll', () => {
          const {el} = setup('ai-dag-node');

          const deltaP = fakeWheelEvent({deltaX: 1, deltaY: 1});
          el.scrollLeft = el.scrollWidth;
          el.scrollTop = el.scrollHeight;
          simulateDispatch(el, deltaP);
          expect(deltaP.stopPropagation).not.toHaveBeenCalled();

          const deltaM = fakeWheelEvent({deltaX: -1, deltaY: -1});
          el.scrollLeft = 0;
          el.scrollTop = 0;
          simulateDispatch(el, deltaM);
          expect(deltaM.stopPropagation).not.toHaveBeenCalled();
        });
      });

      describe('non-scrollable nodes', () => {
        function setup(selector: string) {
          const el = fixture.nativeElement.querySelector(selector);
          const deltaX = fakeWheelEvent({deltaX: 1});
          const deltaY = fakeWheelEvent({deltaY: 1});

          return {el, deltaX, deltaY};
        }

        it('does not capture events on non-scrollable dag nodes', () => {
          const {el, deltaX, deltaY} = setup('ai-dag-node');

          simulateDispatch(el, deltaX);
          expect(deltaX.stopPropagation).not.toHaveBeenCalled();

          simulateDispatch(el, deltaY);
          expect(deltaY.stopPropagation).not.toHaveBeenCalled();
        });

        it('does not capture events on non-scrollable custom nodes', () => {
          const {el, deltaX, deltaY} = setup('.custom-node');

          simulateDispatch(el, deltaX);
          expect(deltaX.stopPropagation).not.toHaveBeenCalled();

          simulateDispatch(el, deltaY);
          expect(deltaY.stopPropagation).not.toHaveBeenCalled();
        });

        it('does not capture events on non-scrollable groups', () => {
          const {el, deltaX, deltaY} = setup('.group');

          simulateDispatch(el, deltaX);
          expect(deltaX.stopPropagation).not.toHaveBeenCalled();

          simulateDispatch(el, deltaY);
          expect(deltaY.stopPropagation).not.toHaveBeenCalled();
        });
      });
    });

    describe('UI with custom control nodes', () => {
      let fixture: ComponentFixture<TestComponent>;
      let harness: DagRawHarness;
      let loader: HarnessLoader;

      beforeEach(waitForAsync(async () => {
        fixture = TestBed.createComponent(TestComponent);
        loader = TestbedHarnessEnvironment.loader(fixture);
      }));

      it('should render the custom control node when group is expanded',
         fakeAsync(async () => {
           // Setup graph with a custom control node visible on expand
           const FAKE_DATA = Node.createFromSkeleton(
               createDagSkeletonWithCustomGroups(true, false).skeleton,
               createDagSkeletonWithCustomGroups(true, false).state);
           fixture.componentInstance.graph = FAKE_DATA;
           fixture.detectChanges();
           await fixture.whenStable();
           fixture.componentInstance.dagRaw.updateGraphLayout();
           fixture.componentInstance.dagRaw.detectChanges();
           harness = await loader.getHarness(DagRawHarness);

           flush();
           fixture.detectChanges();

           const group = fixture.componentInstance.dagRaw.groups[0];
           const customControlNode = await harness.getNodeByType(
               'custom', 'Custom group control node');
           expect(customControlNode).toBeTruthy();
         }));

      it('should NOT render the custom control node when hideControlNodeOnExpand is true',
         fakeAsync(async () => {
           // Setup graph with a custom control node hidden on expand
           const FAKE_DATA = Node.createFromSkeleton(
               createDagSkeletonWithCustomGroups(false).skeleton,
               createDagSkeletonWithCustomGroups(false).state);
           fixture.componentInstance.graph = FAKE_DATA;
           fixture.detectChanges();
           await fixture.whenStable();
           fixture.componentInstance.dagRaw.updateGraphLayout();
           fixture.componentInstance.dagRaw.detectChanges();
           harness = await loader.getHarness(DagRawHarness);

           await harness.clickExpandToggle(0);
           flush();
           fixture.detectChanges();

           let customNode = null;
           try {
             customNode = await harness.getNodeByType(
                 'custom', 'Custom group control node');
           } catch (e) {
             // Expected to throw if not found
           }
           expect(customNode).toBeNull();
         }));
    });

  });

  describe('Internals', () => {
    let fixture: ComponentFixture<TestComponent>;
    let renderer: DagRaw;

    beforeEach(() => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      renderer = fixture.componentInstance.dagRaw;
    });

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('`ensureNode` behaves as expected', fakeAsync(async () => {
         fixture.componentInstance.graph.nodes = [
           new DagNode('a', 'execution', 'CANCELLED'),
           new DagNode('b', 'artifact'),
         ];
         fixture.componentInstance.graph.edges = [{from: 'a', to: 'b'}];
         fixture.detectChanges();
         flush();

         expect(renderer.ensureNode('a')).toBeDefined();
         expect(renderer.ensureNode('a').id).toBe('a');
         expect(renderer.ensureNode('a').type).toBe('execution');
         expect(renderer.ensureNode('a').state).toBe('CANCELLED');
         expect(renderer.ensureNode('b').id).toBe('b');
       }));

    it('`animatedEdge` behaves as expected', fakeAsync(async () => {
         fixture.componentInstance.graph.nodes = [
           new DagNode('root', 'execution', 'SUCCEEDED'),
           new DagNode('a1', 'execution', 'CANCELLED'),
           new DagNode('a2', 'execution', 'RUNNING'),
           new DagNode('b1', 'artifact'),
           new DagNode('b2', 'artifact', 'NO_STATE_RUNTIME'),
           new DagNode('c', 'execution', 'NO_STATE_STATIC'),
         ];
         const edges = fixture.componentInstance.graph.edges = [
           {from: 'root', to: 'a1'},
           {from: 'root', to: 'a2'},
           {from: 'a1', to: 'b1'},
           // Edge to this should not animate as it's static
           {from: 'a2', to: 'b1'},
           {from: 'a2', to: 'b2'},
           {from: 'b1', to: 'c'},
           {from: 'b2', to: 'c'},
         ];
         fixture.detectChanges();
         flush();

         expect(renderer.animatedEdge(edges[0])).toBe(false);
         expect(renderer.animatedEdge(edges[1])).toBe(true);
         expect(renderer.animatedEdge(edges[2])).toBe(false);
         expect(renderer.animatedEdge(edges[3])).toBe(false);
         expect(renderer.animatedEdge(edges[4])).toBe(true);
         expect(renderer.animatedEdge(edges[5])).toBe(false);
         expect(renderer.animatedEdge(edges[6])).toBe(false);
       }));

    it('`selectNodeById` behaves as expected', fakeAsync(async () => {
         fixture.componentInstance.graph.nodes = [
           new DagNode('a', 'execution', 'CANCELLED'),
         ];
         fixture.componentInstance.graph.edges = [];
         spyOn(renderer.selectedNodeChange, 'emit');
         fixture.detectChanges();
         flush();

         expect(renderer.selectNodeById()).toBeFalse();
         expect(renderer.selectNodeById('b')).toBeFalse();
         expect(renderer.selectNodeById('a')).toBeTrue();
         expect(renderer.selectedNode?.node).toBe(renderer.nodes[0]);
         // There should be no toggle when using this method
         expect(renderer.selectNodeById('a')).toBeTrue();
         expect(renderer.selectedNodeChange.emit).toHaveBeenCalled();
       }));

    it('`pendingOrStatic` behaves as expected', fakeAsync(async () => {
         fixture.componentInstance.graph.nodes = [
           new DagNode('a', 'execution', 'CANCELLED'),
           new DagNode('b', 'execution', 'NO_STATE_RUNTIME'),
           new DagNode('c', 'execution', 'NO_STATE_STATIC'),
           new DagNode('d', 'execution', 'PENDING'),
         ];
         fixture.componentInstance.graph.edges = [];
         fixture.detectChanges();
         flush();

         expect(renderer.pendingOrStatic('a'))
             .toBe(renderer.pendingOrStatic(renderer.nodes[0]));
         expect(renderer.pendingOrStatic('a')).toBe(false);
         expect(renderer.pendingOrStatic('b')).toBe(false);
         expect(renderer.pendingOrStatic('c')).toBe(true);
         expect(renderer.pendingOrStatic('d')).toBe(true);
       }));

    it('`toggleClass` behaves as expected', fakeAsync(async () => {
         expect(renderer.toggleClass(true, 'a')).toBe('a');
         expect(renderer.toggleClass(false, 'a')).toBe('');
       }));

    it('`updateGraphLayoutSync` updates a11ySortedNodes for empty DAG',
       fakeAsync(async () => {
         const lastNode = new DagNode('a', 'execution', 'CANCELLED');
         renderer.nodes = [lastNode];
         renderer.edges = [];
         renderer.groups = [];
         renderer.updateGraphLayoutSync();
         flush();

         expect(renderer.a11ySortedNodes).toEqual([lastNode]);

         renderer.nodes = [];
         renderer.updateGraphLayoutSync();
         flush();

         expect(renderer.a11ySortedNodes).toEqual([]);
       }));

    it('`getCustomControlNodeFor` returns custom control node if available',
       () => {
         const baseNode = new DagNode('ctrl', 'execution');
         const customControlNode =
             new CustomNode(baseNode, 'ctrlTemplate', 200, 100);
         const group = new DagGroup(
             'group1', [], [], [], 'NO_STATE_STATIC',
             {hasControlNode: true, customControlNode});

         const result = renderer.getCustomControlNodeFor(group);
         expect(result).toBe(customControlNode);
       });

    it('`getCustomNodeTemplateFor` returns template for CustomNode', () => {
      const baseNode = new DagNode('node', 'execution');
      const customNode = new CustomNode(baseNode, 'testTemplate', 100, 50);
      const mockTemplate = {} as any;
      renderer.customNodeTemplates = {'testTemplate': mockTemplate};

      const result = renderer.getCustomNodeTemplateFor(customNode);
      expect(result).toBe(mockTemplate);
    });

    it('`getCustomNodeTemplateFor` returns undefined for non-CustomNode',
       () => {
         const node = new DagNode('node', 'execution');
         renderer.customNodeTemplates = {'testTemplate': {} as any};

         const result = renderer.getCustomNodeTemplateFor(node);
         expect(result).toBeUndefined();
       });
  });
});

@Component({
  standalone: false,
  template: `
    <div class="container">
      <ai-dag-raw #dagRaw
          [nodes]="graph.nodes"
          [edges]="graph.edges"
          [groups]="graph.groups"
          [features]="features"
      />
    </div>`,
  styles: [`
    .container {
      height: 400px;
      width: 400px;
    }`],
  // TODO: Make this AOT compatible. See b/352713444
  jit: true,

})
class TestComponent {
  @ViewChild('dagRaw', {static: false}) dagRaw!: DagRaw;
  graph: GraphSpec = FAKE_DATA;
  features = createDAGFeatures({scrollToZoom: false, naturalScrolling: false});
}
