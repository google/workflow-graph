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

import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, NgModule, OnDestroy, OnInit, Output} from '@angular/core';
import {MatSelectChange, MatSelectModule} from '@angular/material/select';
import {Subscription} from 'rxjs';

import {DagStateService} from './dag-state.service';
import {DEFAULT_THEME, STATE_PRIORITY} from './data_types_internal';
import {translateMessage} from './i18n';
import {fetchIcon, iconForState, iconRescale, iconSizeToPx} from './icon_util';
import {WorkflowGraphIconModule} from './icon_wrapper';
import {DagIconsModule} from './icons_module';
import {DagGroup, DagNode, NodeIcon} from './node_spec';

const cssVars = {
  padding: 9,
  border: 3,
};

/**
 * @desc Label for groups that are important for the user to see (Failures,
 * Warnings, etc)
 */
const MSG_AI_DIRECTED_ACYCLIC_GRAPH_FAILED_ITERS =
    translateMessage('Failed iterations');

/**
 * @desc Label for groups that ran as expected and are less important for the
 * user to see (Successes, Running, Pending, Not deployed yet, etc)
 */
const MSG_AI_DIRECTED_ACYCLIC_GRAPH_OTHER_ITERS =
    translateMessage('Other iterations');


/**
 * Renders the workflow DAG.
 *
 * Can be initialized with all the inputs and outputs that are exposed or with a
 * limited subset that then leverages `stateService` (./dag-state-service) which
 * shares state across all elements it's attached to.
 */
@Component({
  selector: 'ai-dag-iteration-selector',
  styleUrls: ['group_iteration_select.scss'],
  templateUrl: 'group_iteration_select.ng.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.selected]': 'parentNodeSelected',
    '[class.untab]': 'unTabbable',
    '(focusin)': '$event.stopPropagation()',
  },
})
export class GroupIterationSelector implements OnInit, OnDestroy {
  readonly trueWidth =
      iconSizeToPx('large') + cssVars.padding * 2 + cssVars.border * 2;

  readonly labels = {
    failedIters: MSG_AI_DIRECTED_ACYCLIC_GRAPH_FAILED_ITERS,
    otherIters: MSG_AI_DIRECTED_ACYCLIC_GRAPH_OTHER_ITERS,
  };

  private observers: Subscription[] = [];
  private iterMap: Record<string, DagNode|DagGroup> = {};
  selectedIteration?: DagNode|DagGroup;
  $iterations: Array<DagNode|DagGroup> = [];
  goodIters: Array<DagNode|DagGroup> = [];
  badIters: Array<DagNode|DagGroup> = [];
  $iteration = '';
  expanded = false;
  focusedOption = '';
  softIteration = '';

  // Dropdown Related Props
  @Input() theme = DEFAULT_THEME;
  @Input() sourceGroup: string = 'Group';
  @Input() unTabbable = false;
  @Input() parentNodeSelected = false;
  @Input('iterations')
  set iterations(iters: Array<DagNode|DagGroup>) {
    this.$iterations = iters;
    this.iterMap = Object.fromEntries(iters.map(i => [i.id, i]));
    const goodIters: typeof iters = [];
    const badIters: typeof iters = [];
    for (const iter of iters) {
      if (STATE_PRIORITY[iter.state] <= STATE_PRIORITY['RUNNING']) {
        goodIters.push(iter);
        continue;
      }
      badIters.push(iter);
    }
    this.goodIters = goodIters.sort(
        (a, b) => STATE_PRIORITY[b.state] - STATE_PRIORITY[a.state]);
    this.badIters = badIters.sort(
        (a, b) => STATE_PRIORITY[b.state] - STATE_PRIORITY[a.state]);
    this.calculateIteration();
  }
  get iterations() {
    return this.$iterations;
  }
  @Input('iteration')
  set iteration(id: string) {
    const oldIter = this.$iteration;
    this.$iteration = id;
    this.calculateIteration();
    if (id !== oldIter) this.iterationChanged.emit(id);
  }
  get iteration() {
    return this.$iteration;
  }
  @Output() iterationChanged = new EventEmitter<string>();
  @Output() onIterSelect = new EventEmitter<DagNode|DagGroup|undefined>();
  @Input() stateService?: DagStateService;

  constructor(private readonly cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.observers = this.stateService?.listenAll({
      theme: v => {
        this.theme = {...v};
        this.detectChanges();
      },
    }) ||
        [];
  }

  ngOnDestroy() {
    this.stateService?.destroyAll(this.observers);
  }

  detectChanges() {
    this.cdr.detectChanges();
  }

  getStateIcon(node: DagGroup|DagNode) {
    const icon = iconForState(node.state, this.theme);
    return icon;
  }

  calculateIteration() {
    const newIter =
        this.iterMap[this.iteration] || this.badIters[0] || this.goodIters[0];
    if (this.selectedIteration === newIter) return;
    this.selectedIteration = newIter;
    this.softIteration = this.selectedIteration?.id ?? '';
    this.onIterSelect.emit(this.selectedIteration);
  }

  updateValue(val: MatSelectChange) {
    this.iteration = val.value;
  }

  getA11yLabelFor(elem: 'button'|'prompt') {
    const prompt = `Select an iteration for ${this.sourceGroup}`;
    if (elem === 'prompt') return prompt;
    return `${prompt}: ${this.iteration}`;
  }

  fetchIcon = (icon: NodeIcon, key: keyof NodeIcon) => fetchIcon(icon, key);
  iconRescale = iconRescale;
  iconForState = iconForState;
  iconSizeToPx = iconSizeToPx;
}

@NgModule({
  imports: [
    CommonModule,
    WorkflowGraphIconModule,
    DagIconsModule,
    MatSelectModule,
  ],
  declarations: [
    GroupIterationSelector,
  ],
  exports: [
    GroupIterationSelector,
  ],
})
export class GroupIterationSelectorModule {
}
