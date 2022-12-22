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

import {DagNode} from './node_spec';
import {TEST_IMPORTS, TEST_PROVIDERS} from './test_providers';
import {DagToolbarHarness} from './test_resources/toolbar_harness';
import {DagToolbar, DagToolbarModule} from './toolbar';

const FAKE_DATA = [
  new DagNode('A', 'execution', 'SUCCEEDED'),
  new DagNode('B', 'artifact', 'SUCCEEDED'),
  new DagNode('C', 'execution', 'RUNNING'),
  new DagNode('D', 'artifact'),
  new DagNode('E', 'execution'),
];

const flushToolbar = (t: DagToolbar) => {
  jasmine.clock().tick(101);
  flush();
  t.detectChanges();
};

describe('DagToolbar Component', () => {
  let hostPage: DagWrapper;

  beforeEach(() => {
    setupModule({
      declarations: [DagWrapper],
      imports: [
        ...TEST_IMPORTS,
        DagToolbarModule,
      ],
      providers: [
        ...TEST_PROVIDERS,
      ],
    });
    jasmine.clock().uninstall();
    jasmine.clock().install();
    jasmine.clock().mockDate();
    hostPage = bootstrap(DagWrapper);
    flushToolbar(hostPage.dagToolbar);
  });

  it('Renders correctly', async () => {
    expect(hostPage.dagToolbar).toBeDefined();
    const harness = await getHarness(DagToolbarHarness);
    expect(harness).toBeDefined();
  });

  it('Calculated node states correctly', () => {
    expect(hostPage.dagToolbar.graphState).toBe('Runtime');
    expect(hostPage.dagToolbar.completedSteps).toBe(1);
  });

  it('Toggle reflects state correctly', async () => {
    const toolbar = hostPage.dagToolbar;
    spyOn(toolbar.expandedChange, 'emit');
    const harness = await getHarness(DagToolbarHarness);

    const toggler = await harness.getExpandToggle();
    await toggler.toggle();
    flush();
    expect(toolbar.expanded).toBe(false);
    expect(await toggler.isChecked()).toBe(false);
    expect(toolbar.expandedChange.emit).toHaveBeenCalled();
  });

  it('Zoom Value shows correctly and broadcasts changes', async () => {
    const toolbar = hostPage.dagToolbar;
    spyOn(toolbar.zoomChange, 'emit');
    const toolbarHarness = await getHarness(DagToolbarHarness);

    const zoomIn = await toolbarHarness.getZoomInButton();
    const zoomOut = await toolbarHarness.getZoomOutButton();
    let zoomText = await toolbarHarness.getZoomText()!;
    expect(toolbar.zoom).toBe(1);
    expect(zoomText.trim()).toBe('100%');
    await zoomOut.click();
    flush();

    zoomText = await toolbarHarness.getZoomText()!;
    expect(zoomText.trim()).toBe('90%');
    // expect(Math.round(toolbar.zoom) * 100).toBe(90); // This doesn't work
    await zoomIn.click();
    flush();
    zoomText = await toolbarHarness.getZoomText()!;
    expect(zoomText.trim()).toBe('100%');
    expect(Math.round(toolbar.zoom) * 100).toBe(100);
    expect(toolbar.zoomChange.emit).toHaveBeenCalled();
  });

  it('Expand Artifacts toggle disabled when no artifacts are present', () => {
    const toolbar = hostPage.dagToolbar;
    expect(toolbar.disableToggle).toBe(false);
    toolbar.nodes = [
      new DagNode('a', 'execution', 'RUNNING'),
    ];
    flushToolbar(toolbar);
    expect(toolbar.disableToggle).toBe(true);
  });
});

@Component({
  template: `
    <div class="container">
      <ai-dag-toolbar #dagToolbar
        [nodes]="nodes" [expanded]="true"
        [zoom]="1"
      ></ai-dag-toolbar>
    </div>`,
  styles: [`
    .container {
      height: 400px;
      width: 400px;
    }`],
})
class DagWrapper {
  @ViewChild('dagToolbar', {static: false}) dagToolbar!: DagToolbar;
  nodes: DagNode[] = FAKE_DATA;
}
