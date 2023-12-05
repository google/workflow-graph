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

import {GENERIC_ARTIFACT_ICON, IconConfig} from './data_types_internal';
import {DagNodeEl, DagNodeModule} from './node';
import {DagNode} from './node_spec';
import {DagNodeElHarness} from './test_resources/node_harness';
import {initTestBed} from './test_resources/test_utils';

const fakeNode = new DagNode('test', 'artifact', 'RUNNING', {
  description: 'This is a test Node',
  descriptionTooltip: 'This is a test Node - Tooltip',
  displayName: 'Test Node',
  stateTooltip: 'Kinda Running',
  subType: 'TextArtifact',
  icon: GENERIC_ARTIFACT_ICON,
});

describe('DAG Node', () => {
  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [DagNodeModule],
    });
  }));


  describe('UI', () => {
    let fixture: ComponentFixture<TestComponent>;
    let harness: DagNodeElHarness;
    let nodeEl: DagNodeEl;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      nodeEl = fixture.componentInstance.nodeEl;
      const loader = TestbedHarnessEnvironment.loader(fixture);
      harness = await loader.getHarness(DagNodeElHarness);
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('Renders correctly', fakeAsync(async () => {
         expect(nodeEl).toBeDefined();
         expect(nodeEl.node).toBeDefined();
         expect(harness).toBeDefined();
         expect(await harness.getTitle()).toBe(fakeNode.getNodeDisplayName());
         expect(await harness.getSubtitle()).toBe(fakeNode.description);
         expect(await (await harness.nodeIcon()).getName())
             .toBe(fakeNode.icon!.name!);
       }));

    it('Selection and data binding for nodes works', fakeAsync(async () => {
         const host = await harness.host();
         expect(await host.hasClass('selected-node')).toBeFalse();

         fixture.componentInstance.isSelected = true;
         expect(await host.hasClass('selected-node')).toBeTrue();
       }));

    it('Mouse interactions toggle appropriate hover classes and emit',
       fakeAsync(async () => {
         const host = await harness.host();
         spyOn(nodeEl.hoveredChanged, 'emit');

         expect(await host.hasClass('hovered')).toBeFalse();
         await harness.triggerMouseenter();
         expect(await host.hasClass('hovered')).toBeTrue();
         await harness.triggerMouseleave();
         expect(await host.hasClass('hovered')).toBeFalse();
         expect(nodeEl.hoveredChanged.emit).toHaveBeenCalledTimes(2);
       }));
  });

  describe('Internals', () => {
    let fixture: ComponentFixture<TestComponent>;
    let nodeEl: DagNodeEl;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      nodeEl = fixture.componentInstance.nodeEl;
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    it('`iconRescale` behaves as expected', () => {
      const fakeConfig = fakeNode.icon as IconConfig;
      const s = (size: IconConfig['size']) => ({...fakeConfig, size});
      expect(nodeEl.iconRescale(s('large'), 'large')).toBe('');
      expect(nodeEl.iconRescale(s('medium'), 'medium')).toBe('');
      expect(nodeEl.iconRescale(s('small'), 'small')).toBe('');
      expect(/scale\(\d+\.\d+\)/.test(nodeEl.iconRescale(s('small'), 'large')))
          .toBeTrue();
    });

    it('`iconRescale` behaves as expected', () => {
      const fakeConfig = fakeNode.icon as IconConfig;
      const s = (size: IconConfig['size']) => ({...fakeConfig, size});
      expect(nodeEl.iconRescale(s('large'), 'large')).toBe('');
      expect(nodeEl.iconRescale(s('medium'), 'medium')).toBe('');
      expect(nodeEl.iconRescale(s('small'), 'small')).toBe('');
      expect(/scale\(\d+\.\d+\)/.test(nodeEl.iconRescale(s('small'), 'large')))
          .toBeTrue();
    });

    it('`hoverDims` behaves as expected when collapsed', () => {
      const {iconSpaceWidth, condensedIconWidth, textareaWidth} = nodeEl.dims;
      let node = nodeEl.node = new DagNode('b', 'artifact');
      nodeEl.collapsed = true;
      expect(nodeEl.hoverDims(node, 'leftIcon')).toBe(condensedIconWidth);
      expect(nodeEl.hoverDims(node, 'height')).toBe(condensedIconWidth);
      expect(nodeEl.hoverDims(node, 'text')).toBe(0);
      node = nodeEl.node = new DagNode('a', 'execution', 'CANCELLED');
      expect(nodeEl.hoverDims(node, 'leftIcon')).toBe(iconSpaceWidth);
      expect(nodeEl.hoverDims(node, 'height')).toBe(nodeEl.dims.height);
      expect(nodeEl.hoverDims(node, 'text')).toBe(textareaWidth);
    });

    it('`hoverDims` behaves as expected when expanded', () => {
      const {iconSpaceWidth, height, textareaWidth} = nodeEl.dims;
      let node = nodeEl.node = new DagNode('b', 'artifact');
      nodeEl.collapsed = false;
      expect(nodeEl.hoverDims(node, 'leftIcon')).toBe(iconSpaceWidth);
      expect(nodeEl.hoverDims(node, 'height')).toBe(height);
      expect(nodeEl.hoverDims(node, 'text')).toBe(textareaWidth);
      node = nodeEl.node = new DagNode('a', 'execution', 'CANCELLED');
      expect(nodeEl.hoverDims(node, 'leftIcon')).toBe(iconSpaceWidth);
      expect(nodeEl.hoverDims(node, 'height')).toBe(height);
      expect(nodeEl.hoverDims(node, 'text')).toBe(textareaWidth);
    });
  });
});

@Component({
  template: `
    <div class="container">
      <ai-dag-node #node
        [node]="fakeNode"
        [selected]="isSelected"
      ></ai-dag-node>
    </div>`,
  styles: [`
    .container {
      height: 400px;
      width: 400px;
    }`],
})
class TestComponent {
  @ViewChild('node', {static: false}) nodeEl!: DagNodeEl;
  isSelected = false;
  fakeNode: DagNode = fakeNode;
}
