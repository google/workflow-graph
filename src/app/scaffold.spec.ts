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

import {NgIf} from '@angular/common';
import {Component} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';

import {ScreenshotTest} from '../screenshot_test';

import {DirectedAcyclicGraphModule} from './directed_acyclic_graph';
import {DagEdge, DagNode} from './node_spec';
import {DagScaffoldModule} from './scaffold';
import {AiDagShelf} from './shelf';
import {initTestBed} from './test_resources/test_utils';
import {DagToolbarModule} from './toolbar';

const FAKE_NODES: DagNode[] = [
  new DagNode('step1', 'execution', 'SUCCEEDED'),
  new DagNode('artifact1', 'artifact', 'SUCCEEDED'),
  new DagNode('step2', 'execution', 'RUNNING'),
  new DagNode('step3', 'execution', 'PENDING'),
  new DagNode('artifact2', 'artifact', 'NO_STATE_RUNTIME'),
];
const FAKE_EDGES: DagEdge[] = [
  {from: 'step1', to: 'artifact1'},
  {from: 'artifact1', to: 'step2'},
  {from: 'artifact1', to: 'step3'},
  {from: 'step2', to: 'artifact2'},
];

@Component({
  standalone: false,
  template: `
    <ai-dag-scaffold [features]="features">
      <ai-dag-toolbar *ngIf="includeToolbar" [nodes]="nodes"></ai-dag-toolbar>
      <ai-dag-shelf *ngIf="includeShelf">
        <div class="shelf-content"> </div>
      </ai-dag-shelf>
      <ai-dag-renderer [nodes]="nodes" [edges]="edges"></ai-dag-renderer>
    </ai-dag-scaffold>
  `,
  styles: [`
    ai-dag-scaffold {
      display: block;
      height: 1000px;
    }
    .shelf-content {
      padding: 10px;
      background-color: #eee;
    }
  `],
  jit: true,
})
class TestComponent {
  features = {};
  includeToolbar = true;
  includeShelf = false;
  nodes = FAKE_NODES;
  edges = FAKE_EDGES;
}

describe('DagScaffold', () => {
  beforeEach(waitForAsync(async () => {
    await initTestBed({
      declarations: [TestComponent],
      imports: [
        DagScaffoldModule,
        DagToolbarModule,
        DirectedAcyclicGraphModule,
        AiDagShelf,
        NgIf,
      ],
    });
  }));

  describe('Component', () => {
    let fixture: ComponentFixture<TestComponent>;
    let screenShot: ScreenshotTest;

    beforeEach(() => {
      fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      screenShot = new ScreenshotTest(module.id);
    });

    afterEach(fakeAsync(() => {
      fixture.destroy();
      tick();
    }));

    it('renders without shelf by default', async () => {
      expect(fixture.nativeElement.querySelector('ai-dag-shelf')).toBeNull();
      await screenShot.expectMatch('renders_without_shelf_by_default');
    });

    describe('when shelf is included', () => {
      beforeEach(fakeAsync(() => {
        fixture.componentInstance.includeShelf = true;
        fixture.detectChanges();
        tick();
      }));

      it('renders the shelf and its projected content', async () => {
        const shelfElement =
            fixture.nativeElement.querySelector('ai-dag-shelf');
        const shelfContent = shelfElement.querySelector('.shelf-content');

        expect(shelfElement).toBeDefined();
        expect(shelfContent).toBeDefined();
        expect(shelfContent.textContent).toBe('');
        await screenShot.expectMatch('renders_shelf_correctly');
      });
    });
  });
});
