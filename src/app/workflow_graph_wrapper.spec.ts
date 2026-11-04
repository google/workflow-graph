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
import {Component, ChangeDetectionStrategy} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';

import {defaultFeatures} from './data_types_internal';
import {DirectedAcyclicGraphHarness} from './test_resources/directed_acyclic_graph_harness';
import {fakeGraph} from './test_resources/fake_data';
import {MinimapHarness} from './test_resources/minimap_harness';
import {initTestBed, keyWithCtrlOrCommand} from './test_resources/test_utils';
import {WorkflowGraphWrapper, WorkflowGraphWrapperModule} from './workflow_graph_wrapper';

describe('Workflow graph wrapper', () => {
  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [WorkflowGraphWrapperModule],
    });
  }));

  describe('Shortcut tests', () => {
    let fixture: ComponentFixture<TestComponent>;
    let dag: DirectedAcyclicGraphHarness;
    let scaffold: HTMLElement;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const loader = TestbedHarnessEnvironment.loader(fixture);
      dag = await loader.getHarness(DirectedAcyclicGraphHarness);
      scaffold = fixture.nativeElement.querySelector('ai-dag-scaffold');
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('Canvas navigation with shortcuts', async () => {
      const rawDag = await dag.getRawDag();

      scaffold.dispatchEvent(
          new KeyboardEvent('keydown', keyWithCtrlOrCommand('ArrowRight')));
      scaffold.dispatchEvent(
          new KeyboardEvent('keydown', keyWithCtrlOrCommand('ArrowDown')));

      const style = await rawDag.getAttribute('style');
      expect(style).toBe('transform: translate(-100px, -100px) scale(1);');
    });
  });

  describe('Minimap position', () => {
    let fixture: ComponentFixture<TestComponent>;
    let minimap: MinimapHarness;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      const loader = TestbedHarnessEnvironment.loader(fixture);
      minimap = await loader.getHarness(MinimapHarness);
    }));

    it('Bottom', async () => {
      fixture.componentInstance.minimapPosition = 'bottom';

      const minimapHost = await minimap.host();
      expect(await minimapHost.getCssValue('order')).toBe('1');
    });

    it('Top', async () => {
      fixture.componentInstance.minimapPosition = 'top';

      const minimapHost = await minimap.host();
      expect(await minimapHost.getCssValue('order')).toBe('0');
    });
  });

  describe('withComponentInputBinding compatibility', () => {
    const inputNames = [
      'enableToolbar',
      'enableMinimap',
      'features',
      'expandedMode',
      'loading',
      'optimizeForOrm',
      'dagSpec',
      'selectedNode',
      'followNode',
      'hoveredEdge',
      'layout',
      'logger',
      'minimapPosition',
      'zoom',
      'userConfig',
    ];

    it('preserves defaults when setInput(name, undefined) is called on initialization',
       () => {
         const detached = new WorkflowGraphWrapper();
         expect(() => {
           detached.selectedNode = {id: 'BQ', path: []};
         }).not.toThrow();

         const fixture = TestBed.createComponent(WorkflowGraphWrapper);
         const component = fixture.componentInstance;

         for (const name of inputNames) {
           fixture.componentRef.setInput(name, undefined);
         }
         fixture.detectChanges();

         expect(component.enableToolbar).toBe(true);
         expect(component.enableMinimap).toBe(true);
         expect(component.features).toEqual(defaultFeatures);
         expect(component.expandedMode).toBe(false);
         expect(component.loading).toBe(false);
         expect(component.optimizeForOrm).toBe(false);
         expect(component.graph.selectedNode).toBeNull();
         expect(component.followNode).toBeUndefined();
         expect(component.hoveredEdge).toBeUndefined();
         expect(component.layout).toBeUndefined();
         expect(component.logger).toBeUndefined();
         expect(component.minimapPosition).toBe('top');
         expect(component.zoom).toBe(1);
         expect(component.userConfig).toBeUndefined();
         expect(component.graphSpec).toEqual({
           nodes: [],
           edges: [],
           groups: [],
         });
         fixture.destroy();
       });

    it('resets defaulted inputs and clears optional inputs when set to a value and then undefined',
       () => {
         const fixture = TestBed.createComponent(WorkflowGraphWrapper);
         const component = fixture.componentInstance;
         fixture.detectChanges();

         const customEdge = {from: 'a', to: 'b'};
         const customLogger = {logEvent: () => {}};
         const customUserConfig = {a11y: {disableAnimations: true}};

         fixture.componentRef.setInput('enableToolbar', false);
         fixture.componentRef.setInput('enableMinimap', false);
         fixture.componentRef.setInput(
             'features', {...defaultFeatures, scrollToZoom: false});
         fixture.componentRef.setInput('expandedMode', true);
         fixture.componentRef.setInput('loading', true);
         fixture.componentRef.setInput('optimizeForOrm', true);
         fixture.componentRef.setInput(
             'dagSpec', {skeleton: fakeGraph.skeleton, meta: fakeGraph.state});
         fixture.detectChanges();
         const firstNodeRef = {
           id: component.graphSpec.nodes[0].id,
           path: [],
         };
         fixture.componentRef.setInput('selectedNode', firstNodeRef);
         fixture.componentRef.setInput('followNode', firstNodeRef);
         fixture.componentRef.setInput('hoveredEdge', customEdge);
         fixture.componentRef.setInput('layout', {rankSeparation: 100});
         fixture.componentRef.setInput('logger', customLogger);
         fixture.componentRef.setInput('minimapPosition', 'bottom');
         fixture.componentRef.setInput('zoom', 1.5);
         fixture.componentRef.setInput('userConfig', customUserConfig);
         fixture.detectChanges();

         expect(component.enableToolbar).toBe(false);
         expect(component.enableMinimap).toBe(false);
         expect(component.features.scrollToZoom).toBe(false);
         expect(component.expandedMode).toBe(true);
         expect(component.loading).toBe(true);
         expect(component.optimizeForOrm).toBe(true);
         expect(component.graphSpec.nodes.length).toBeGreaterThan(0);
         expect(component.graph.selectedNode?.node.id).toBe(firstNodeRef.id);
         expect(component.followNode).toEqual(firstNodeRef);
         expect(component.hoveredEdge).toEqual(customEdge);
         expect(component.layout).toEqual({rankSeparation: 100});
         expect(component.logger).toBe(customLogger);
         expect(component.minimapPosition).toBe('bottom');
         expect(component.zoom).toBe(1.5);
         expect(component.userConfig).toEqual(customUserConfig);

         for (const name of inputNames) {
           fixture.componentRef.setInput(name, undefined);
         }
         fixture.detectChanges();

         expect(component.enableToolbar).toBe(true);
         expect(component.enableMinimap).toBe(true);
         expect(component.features).toEqual(defaultFeatures);
         expect(component.expandedMode).toBe(false);
         expect(component.loading).toBe(false);
         expect(component.optimizeForOrm).toBe(false);
         expect(component.graphSpec.nodes.length).toBeGreaterThan(0);
         expect(component.graph.selectedNode).toBeNull();
         expect(component.followNode).toBeUndefined();
         expect(component.hoveredEdge).toBeUndefined();
         expect(component.layout).toBeUndefined();
         expect(component.logger).toBeUndefined();
         expect(component.minimapPosition).toBe('top');
         expect(component.zoom).toBe(1);
         expect(component.userConfig).toBeUndefined();
         fixture.destroy();
       });
  });
});

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,standalone: false,
  template: `
      <workflow-graph
        [dagSpec]="dagSpec"
        [features]="features"
        [minimapPosition]="minimapPosition"
      />`,
  styles: [`
    workflow-graph {
      width: 700px;
      height: 300px;
      display: flex;
    }`],
  jit: true,
})
class TestComponent {
  dagSpec = {skeleton: fakeGraph.skeleton, meta: fakeGraph.state};
  features = {enableShortcuts: true};
  minimapPosition = 'top';
}
