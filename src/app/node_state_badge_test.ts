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

import {getHarness} from '@angular/cdk/testing/catalyst';
import {Component, Input} from '@angular/core';
import {beforeEach, bootstrap, describe, expect, flush, it, setupModule} from 'google3/javascript/angular2/testing/catalyst';
import {DagNodeStateBadgeHarness} from 'google3/third_party/javascript/workflow_graph/src/app/test_resources/node_state_badge_harness';

import {NodeState} from './data_types_internal';
import {DagNodeStateBadgeModule} from './node_state_badge';
import {TEST_IMPORTS, TEST_PROVIDERS} from './test_providers';


describe('DagNodeStateBadge', () => {
  describe('Valid state', () => {
    let hostPage: DagNodeStateBadgeHost;

    beforeEach(async () => {
      setupModule({
        declarations: [DagNodeStateBadgeHost],
        imports: [
          ...TEST_IMPORTS,
          DagNodeStateBadgeModule,
        ],
        providers: [
          ...TEST_PROVIDERS,
        ],
      });
      hostPage = bootstrap(DagNodeStateBadgeHost, {nodeState: 'PENDING'});
      flush();
    });

    it('Renders an icon and the given label text', async () => {
      const badge = await getHarness(DagNodeStateBadgeHarness);

      expect(await badge.getIcon()).toBeDefined();
      expect(await badge.getText()).toEqual('Pending');
    });
  });

  describe('NO_STATE', () => {
    let hostPage: DagNodeStateBadgeHost;

    beforeEach(async () => {
      setupModule({
        declarations: [DagNodeStateBadgeHost],
        imports: [
          ...TEST_IMPORTS,
          DagNodeStateBadgeModule,
        ],
        providers: [
          ...TEST_PROVIDERS,
        ],
      });
      hostPage =
          bootstrap(DagNodeStateBadgeHost, {nodeState: 'NO_STATE_STATIC'});
      flush();
    });

    it('Renders nothing for NO_STATE_STATIC', async () => {
      const badge = await getHarness(DagNodeStateBadgeHarness);

      hostPage.nodeState = 'NO_STATE_STATIC';
      flush();
      expect(await badge.hasIcon()).toBeFalse();
      expect(await badge.getText()).toEqual('');
    });

    it('Renders nothing for NO_STATE_RUNTIME', async () => {
      const badge = await getHarness(DagNodeStateBadgeHarness);

      hostPage.nodeState = 'NO_STATE_RUNTIME';
      flush();
      expect(await badge.hasIcon()).toBeFalse();
      expect(await badge.getText()).toEqual('');
    });
  });
});

@Component({
  template:
      '<ai-dag-node-state-badge #badge [nodeState]="nodeState"></ai-dag-node-state-badge>'
})
class DagNodeStateBadgeHost {
  @Input() nodeState!: NodeState;
}
