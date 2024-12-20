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
import {Component, TemplateRef, ViewChild} from '@angular/core';
import {ComponentFixture, fakeAsync, flush, TestBed, waitForAsync} from '@angular/core/testing';

import {ScreenshotTest} from '../screenshot_test';

import {ColorThemeLoader} from './color_theme_loader';
import {DagStateService} from './dag-state.service';
import {STATE_SERVICE_PROVIDER} from './dag-state.service.provider';
import {defaultFeatures} from './data_types_internal';
import {DagNode} from './node_spec';
import {A11yHelpCenterHarness} from './test_resources/a11y_help_center_harness';
import {initTestBed} from './test_resources/test_utils';
import {DagToolbarHarness} from './test_resources/toolbar_harness';
import {DagToolbar, DagToolbarModule} from './toolbar';

const FAKE_DATA = [
  new DagNode('A', 'execution', 'SUCCEEDED'),
  new DagNode('B', 'artifact', 'SUCCEEDED'),
  new DagNode('C', 'execution', 'RUNNING'),
  new DagNode('D', 'artifact'),
  new DagNode('E', 'execution'),
];

describe('DagToolbar', () => {
  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [DagToolbarModule, ColorThemeLoader],
      providers: [STATE_SERVICE_PROVIDER],
    });
  }));

  describe('Component', () => {
    let fixture: ComponentFixture<TestComponent>;
    let toolbarHarness: DagToolbarHarness;
    let toolbar: DagToolbar;
    let loader: HarnessLoader;
    let rootLoader: HarnessLoader;
    let stateService: DagStateService;
    let screenShot: ScreenshotTest;

    beforeEach(waitForAsync(async () => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      toolbar = fixture.componentInstance.dagToolbar;
      loader = TestbedHarnessEnvironment.loader(fixture);
      rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
      toolbarHarness = await loader.getHarness(DagToolbarHarness);
      stateService = fixture.debugElement.injector.get(DagStateService);

      screenShot = new ScreenshotTest(module.id);
    }));

    afterEach(fakeAsync(() => {
      fixture.destroy();
    }));

    describe('Default', () => {
      it('Toolbar and harness are defined', async () => {
        expect(toolbar).toBeDefined();
        expect(toolbarHarness).toBeDefined();
      });

      it('Renders correctly (screenshot)', async () => {
        await screenShot.expectMatch('renders_correctly');
      });
    });

    it('Calculated node states correctly', () => {
      expect(toolbar.graphState).toBe('Runtime');
      expect(toolbar.completedSteps).toBe(1);
    });

    it('Toggle reflects state correctly', async () => {
      spyOn(toolbar.expandedChange, 'emit');

      const toggler = await toolbarHarness.getExpandToggle();
      await toggler.toggle();
      expect(toolbar.expanded).toBe(false);
      expect(await toggler.isChecked()).toBe(false);
      expect(toolbar.expandedChange.emit).toHaveBeenCalled();
    });

    it('Zoom Value shows correctly and broadcasts changes', async () => {
      const zoomIn = await toolbarHarness.getZoomInButton();
      const zoomOut = await toolbarHarness.getZoomOutButton();
      let zoomText = await toolbarHarness.getZoomText();
      expect(stateService.zoom.value).toBe(1);
      expect(zoomText.trim()).toBe('100%');
      await zoomOut.click();

      zoomText = await toolbarHarness.getZoomText();
      expect(zoomText.trim()).toBe('90%');
      // expect(Math.round(toolbar.zoom) * 100).toBe(90); // This doesn't work
      await zoomIn.click();
      zoomText = await toolbarHarness.getZoomText();
      expect(zoomText.trim()).toBe('100%');
      expect(Math.round(toolbar.zoom) * 100).toBe(100);
    });

    it('Expand Artifacts toggle disabled when no artifacts are present',
       fakeAsync(async () => {
         expect(toolbar.disableToggle).toBe(false);
         toolbar.nodes = [
           new DagNode('a', 'execution', 'RUNNING'),
         ];
         flush();
         expect(toolbar.disableToggle).toBe(true);
       }));

    it('should render right aligned content', async () => {
      const element = await toolbarHarness.getElement('#rightButton');

      expect(await element.text()).toBe('Click me');
    });

    it('A11y Help Center dialog is opened by pressing button', async () => {
      const button = await toolbarHarness.getA11yHelpCenterButton();
      await button.click();
      const dialogHarness = await rootLoader.getHarness(A11yHelpCenterHarness);
      expect(dialogHarness).toBeDefined();
    });

    it('Zoom reset button calls State Service EventEmitter', async () => {
      spyOn(stateService.zoomReset, 'next');
      const button = await toolbarHarness.getZoomResetButton();
      await button.click();
      expect(stateService.zoomReset.next).toHaveBeenCalled();
    });
  });
});

@Component({
  standalone: false,
  template: `
    <div class="container">
      <ai-dag-toolbar #dagToolbar
        [nodes]="nodes" [expanded]="true"
        [rightAlignedCustomToolbarToggleTemplates]="rightAlignedTemplates"
        [features]="features"
      ></ai-dag-toolbar>
    </div>
    <ng-template #rightAlignedTemplate>
      <button id="rightButton"> Click me</button>
    </ng-template>`,
  providers: [
    //  STATE_SERVICE_PROVIDER,
  ],
  styles: [`
    .container {
      height: 400px;
      width: 400px;
    }`],
  // TODO: Make this AOT compatible. See b/352713444
  jit: true,

})
class TestComponent {
  @ViewChild('dagToolbar', {static: false}) dagToolbar!: DagToolbar;
  nodes: DagNode[] = FAKE_DATA;
  @ViewChild('rightAlignedTemplate', {static: false})
  rightAlignedTemplate?: TemplateRef<{}>;

  rightAlignedTemplates: Array<TemplateRef<{}>> = [];

  ngAfterViewInit() {
    this.rightAlignedTemplates.push(this.rightAlignedTemplate!);
  }

  features = {...defaultFeatures, enableShortcuts: true};
}
