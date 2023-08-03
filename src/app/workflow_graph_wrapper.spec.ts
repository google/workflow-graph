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
import {Component} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';

import {TEST_IMPORTS, TEST_PROVIDERS} from './test_providers';
import {DirectedAcyclicGraphHarness} from './test_resources/directed_acyclic_graph_harness';
import {fakeGraph} from './test_resources/fake_data';
import {keyWithCtrlOrCommand} from './test_resources/test_utils';
import {WorkflowGraphWrapperModule} from './workflow_graph_wrapper';

TestBed.resetTestEnvironment();
TestBed.initTestEnvironment(
    BrowserDynamicTestingModule, platformBrowserDynamicTesting(),
    {teardown: {destroyAfterEach: true}});

describe('Workflow graph wrapper', () => {
  beforeEach(waitForAsync(async () => {
    await TestBed
        .configureTestingModule({
          declarations: [DagWrapper],
          imports: [
            ...TEST_IMPORTS,
            WorkflowGraphWrapperModule,
          ],
          providers: [...TEST_PROVIDERS],
        })
        .compileComponents();
  }));

  describe('Shortcut tests', () => {
    let fixture: ComponentFixture<DagWrapper>;
    let dag: DirectedAcyclicGraphHarness;
    let scaffold: HTMLElement;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(DagWrapper);
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
});

@Component({
  template: `
      <workflow-graph
        [dagSpec]="dagSpec"
        [features]="features"
      />`,
  styles: [`
    workflow-graph {
      width: 700px;
      height: 300px;
      display: flex;
    }`],
})
class DagWrapper {
  dagSpec = {skeleton: fakeGraph.skeleton, meta: fakeGraph.state};
  features = {enableShortcuts: true};
}
