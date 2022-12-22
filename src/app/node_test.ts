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

import {GENERIC_ARTIFACT_ICON, IconConfig} from './data_types_internal';
import {DagNodeEl, DagNodeModule} from './node';
import {DagNode} from './node_spec';
import {TEST_IMPORTS, TEST_PROVIDERS} from './test_providers';
import {DagNodeElHarness} from './test_resources/node_harness';

const fakeNode = new DagNode('test', 'artifact', 'RUNNING', {
  description: 'This is a test Node',
  descriptionTooltip: 'This is a test Node - Tooltip',
  displayName: 'Test Node',
  stateTooltip: 'Kinda Running',
  subType: 'TextArtifact',
  icon: GENERIC_ARTIFACT_ICON,
});

describe('DirectedAcyclicGraph Node -', () => {
  describe('[UI]', () => {
    let page: DagWrapper;
    let nodeEl: DagNodeEl;

    beforeEach(() => {
      setupModule({
        declarations: [DagWrapper],
        imports: [
          ...TEST_IMPORTS,
          DagNodeModule,
        ],
        providers: [
          ...TEST_PROVIDERS,
        ],
      });
      page = bootstrap(DagWrapper);
      nodeEl = page.nodeEl;
      flush();
    });

    it('Renders correctly', async () => {
      flush();
      expect(nodeEl).toBeDefined();
      expect(nodeEl.node).toBeDefined();
      const nodeDom = await getHarness(DagNodeElHarness);

      expect(nodeDom).toBeDefined();
      expect(await nodeDom.getTitle()).toBe(fakeNode.getNodeDisplayName());
      expect(await nodeDom.getSubtitle()).toBe(fakeNode.description);
      expect(await (await nodeDom.nodeIcon()).getName())
          .toBe(fakeNode.icon!.name);
    });

    it('Selection and data binding for nodes works', async () => {
      flush();
      const nodeDom = await getHarness(DagNodeElHarness);
      const host = await nodeDom.host();
      expect(await host.hasClass('selected-node')).toBeFalse();

      page.isSelected = true;
      flush();
      expect(await host.hasClass('selected-node')).toBeTrue();
    });

    it('Mouse interactions toggle appropriate hover classes and emit',
       async () => {
         flush();
         const nodeDom = await getHarness(DagNodeElHarness);
         const host = await nodeDom.host();
         spyOn(nodeEl.hoveredChanged, 'emit');

         expect(await host.hasClass('hovered')).toBeFalse();
         await nodeDom.triggerMouseenter();
         expect(await host.hasClass('hovered')).toBeTrue();
         await nodeDom.triggerMouseleave();
         expect(await host.hasClass('hovered')).toBeFalse();
         expect(nodeEl.hoveredChanged.emit).toHaveBeenCalledTimes(2);
       });
  });

  describe('[Internals]', () => {
    let page: DagWrapper;
    let nodeEl: DagNodeEl;

    beforeEach(() => {
      setupModule({
        declarations: [DagWrapper],
        imports: [
          ...TEST_IMPORTS,
          DagNodeModule,
        ],
        providers: [
          ...TEST_PROVIDERS,
        ],
      });
      page = bootstrap(DagWrapper);
      nodeEl = page.nodeEl;
      flush();
    });

    it('`iconRescale` behaves as expected', () => {
      flush();
      const fakeConfig = fakeNode.icon as IconConfig;
      const s = (size: IconConfig['size']) => ({...fakeConfig, size});
      expect(nodeEl.iconRescale(s('large'), 'large')).toBe('');
      expect(nodeEl.iconRescale(s('medium'), 'medium')).toBe('');
      expect(nodeEl.iconRescale(s('small'), 'small')).toBe('');
      expect(/scale\(\d+\.\d+\)/.test(nodeEl.iconRescale(s('small'), 'large')))
          .toBeTrue();
    });
    it('`hoverDims` behaves as expected when collapsed', () => {
      flush();
      const {iconSpaceWidth, condensedIconWidth, textareaWidth} = nodeEl.dims;
      let node = nodeEl.node = new DagNode('b', 'artifact');
      nodeEl.collapsed = true;
      flush();
      expect(nodeEl.hoverDims(node, 'leftIcon')).toBe(condensedIconWidth);
      expect(nodeEl.hoverDims(node, 'height')).toBe(condensedIconWidth);
      expect(nodeEl.hoverDims(node, 'text')).toBe(0);

      node = nodeEl.node = new DagNode('a', 'execution', 'CANCELLED');
      flush();
      expect(nodeEl.hoverDims(node, 'leftIcon')).toBe(iconSpaceWidth);
      expect(nodeEl.hoverDims(node, 'height')).toBe(nodeEl.dims.height);
      expect(nodeEl.hoverDims(node, 'text')).toBe(textareaWidth);
    });
    it('`hoverDims` behaves as expected when expanded', () => {
      flush();
      const {iconSpaceWidth, height, textareaWidth} = nodeEl.dims;
      let node = nodeEl.node = new DagNode('b', 'artifact');
      nodeEl.collapsed = false;

      flush();
      expect(nodeEl.hoverDims(node, 'leftIcon')).toBe(iconSpaceWidth);
      expect(nodeEl.hoverDims(node, 'height')).toBe(height);
      expect(nodeEl.hoverDims(node, 'text')).toBe(textareaWidth);

      node = nodeEl.node = new DagNode('a', 'execution', 'CANCELLED');
      flush();
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
class DagWrapper {
  @ViewChild('node', {static: false}) nodeEl!: DagNodeEl;
  isSelected = false;
  fakeNode: DagNode = fakeNode;
}
