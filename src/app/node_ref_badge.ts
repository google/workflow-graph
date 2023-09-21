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
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgModule, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';

import {DagStateService} from './dag-state.service';
import {convertStateToRuntime, isTextIcon} from './data_types_internal';
import {fetchIcon, iconRescale, iconSizeToPx} from './icon_util';
import {WorkflowGraphIconModule} from './icon_wrapper';
import {DagNode, NodeIcon} from './node_spec';

const cssVars = {
  padding: 9,
  border: 3,
};

/**
 * Renders the workflow DAG.
 *
 * Can be initialized with all the inputs and outputs that are exposed or with a
 * limited subset that then leverages `stateService` (./dag-state-service) which
 * shares state across all elements it's attached to.
 */
@Component({
  selector: 'ai-dag-node-ref-badge',
  styleUrls: ['node_ref_badge.scss'],
  templateUrl: 'node_ref_badge.ng.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'node.getNodeDisplayName()',
    '[attr.aria-label]': 'getA11yLabel(node)',
    '[attr.aria-checked]': '"" + selected',
    '[attr.type]': 'node.type',
    '[attr.state]': 'node.state.toLowerCase()',
    '[attr.runtime]': 'convertStateToRuntime(node.state).toLowerCase()',
    '[class.collapsed]': 'isCollapsed()',
    '[class.selected]': 'selected',
    '[style.width.px]': 'calcWidth()',
    '[style.height.px]': 'calcWidth()',
  },
})
export class NodeRefBadge implements OnInit, OnDestroy {
  readonly trueWidth =
      iconSizeToPx('large') + cssVars.padding * 2 + cssVars.border * 2;

  private observers: Subscription[] = [];

  // Badge Related Props
  @Input() node?: DagNode;
  @Input() collapsed = true;
  @Input() selected = true;

  constructor(
      private readonly cdr: ChangeDetectorRef,
      private readonly stateService: DagStateService,
  ) {}

  ngOnInit() {
    this.observers = this.stateService?.listenAll({
      theme: v => {
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

  getA11yLabel(node: DagNode) {
    const subTypeLabel = node.subType ? ` (Subtype: ${node.subType})` : '';
    return `Reference badge for ${node.type}${subTypeLabel} - ${
        node.getNodeDisplayName()}`;
  }

  calcWidth() {
    return this.getRawScaleFactor() * this.trueWidth;
  }
  isCollapsed() {
    return this.collapsed && !this.selected;
  }
  forceInverted(icon: NodeIcon): NodeIcon {
    return {...icon, iconColors: 'inverted'};
  }
  getRawScaleFactor() {
    const factor = this.isCollapsed() ? 7 : 15;
    return factor / iconSizeToPx('large');
  }
  scaleFactor() {
    return `translate(-50%, -50%) scale(${this.getRawScaleFactor()})`;
  }

  isTextIcon = isTextIcon;
  fetchIcon = (icon: NodeIcon, key: keyof NodeIcon|'bg') => fetchIcon(icon, key);
  convertStateToRuntime = convertStateToRuntime;
  iconRescale = iconRescale;
  iconSizeToPx = iconSizeToPx;
}

@NgModule({
  imports: [
    CommonModule,
    WorkflowGraphIconModule,
  ],
  declarations: [
    NodeRefBadge,
  ],
  exports: [
    NodeRefBadge,
  ],
})
export class NodeRefBadgeModule {
}
