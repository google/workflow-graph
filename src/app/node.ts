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

import {DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, NgModule, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {Subscription} from 'rxjs';

import {DagStateService} from './dag-state.service';
import {convertStateToRuntime, DEFAULT_THEME, FeatureToggleOptions, isNoState, isTextIcon, NODE_HEIGHT, NODE_WIDTH, NodeIcon, NodeState, SVG_ELEMENT_SIZE} from './data_types_internal';
import {GroupIterationSelector} from './group_iteration_select';
import {bgForState, fetchIcon, iconForState, iconRescale} from './icon_util';
import {WorkflowGraphIconModule} from './icon_wrapper';
import {DagIconsModule} from './icons_module';
import {NodeRefBadge} from './node_ref_badge';
import {DagEdge, DagNode} from './node_spec';
import {debounce} from './util_functions';

/**
 * Renders the workflow DAG.
 *
 * Can be initialized with all the inputs and outputs that are exposed or with a
 * limited subset that then leverages `stateService` (./dag-state-service) which
 * shares state across all elements it's attached to.
 */
@Component({
  selector: 'ai-dag-node',
  styleUrls: ['node.scss'],
  templateUrl: 'node.ng.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.selected-node]': 'isSelected',
    '[class.hovered]': 'isHovered',
    '[class.persist-expansion]': 'persistExpanse',
    '[class.collapses]': 'collapsed',
    '[attr.aria-label]': 'getA11yLabel(node)',
    '[attr.aria-checked]': '"" + isSelected',
    '[attr.type]': 'node.type',
    '[attr.state]': 'classNameState(node.state)',
    '[attr.runtime]': 'convertStateToRuntime(node.state).toLowerCase()',
    '[attr.modifiers]': 'getNodeModifiers(node)',
    '(focus)': 'isHovered = true',
    '(blur)': 'isHovered = false',
    '(mouseenter)': 'isHovered = true',
    '(mouseleave)': 'isHovered = false',
  },
})
export class DagNodeEl implements OnInit, OnDestroy {
  readonly sizeConfig = SVG_ELEMENT_SIZE(NODE_WIDTH, NODE_HEIGHT);

  $isHovered = false;
  persistExpanse = false;

  set isHovered(s: boolean) {
    this.$isHovered = s;
    this.hoveredChanged.emit(s);
  }
  get isHovered() {
    return this.$isHovered;
  }

  // Node Related Props
  @Input() node?: DagNode;

  @Input() edges: DagEdge[] = [];

  @Input('selected') isSelected = false;

  @Input() dims = this.sizeConfig.dims;

  @Input() theme = DEFAULT_THEME;

  @Input()
  set features(f: FeatureToggleOptions) {
    this.persistExpanse = f.selectedArtifactsAreExpanded;
    this.detectChanges();
  }

  @Input() collapsed = true;

  @Input() stateService?: DagStateService;

  @Output() hoveredChanged = new EventEmitter<boolean>();
  observers: Subscription[] = [];

  constructor(private readonly cdr: ChangeDetectorRef) {
    this.detectChanges = debounce(this.detectChanges, 50, this);
  }

  @ViewChildren(NodeRefBadge) refBadges?: QueryList<NodeRefBadge>;
  @ViewChild(GroupIterationSelector) iterSelector?: GroupIterationSelector;

  ngOnInit() {
    this.observers = this.stateService?.listenAll({
      collapsed: v => {
        this.collapsed = v;
        this.detectChanges();
      },
      features: v => {
        this.features = {...v};
      },
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

  /**
   * Calculate dimensions of node based on node's hover and selection state
   */
  hoverDims(node: DagNode, prop: 'text'|'height'|'leftIcon') {
    // The keys need to be literal in each object, since this is required to
    // work with RIF property renaming that was added, there is b/169360065 with
    // more context on this.
    const defaultVal = {
      'text': this.dims.textareaWidth,
      'height': this.dims.height,
      'leftIcon': this.dims.iconSpaceWidth,
    }[prop];
    const persistSelectedExpand = this.persistExpanse;
    const alt = {
      'text': 0,
      'height': this.dims.condensedIconWidth,
      'leftIcon': this.dims.condensedIconWidth,
    };
    if (node.type === 'execution' || !this.collapsed) return defaultVal;
    return this.isHovered || (persistSelectedExpand && this.isSelected) ?
        defaultVal :
        alt[prop];
  }

  /** Get different properties from the node callout */
  getCallout(node: DagNode, prop: 'text'|'color'|'bg') {
    const defaultVal = {
      color: 'gray',
      bg: '#dad4d4',
    };
    const {callout} = node;
    if (typeof callout === 'string') {
      switch (prop) {
        case 'text':
          return callout;
        case 'color':
          return defaultVal.color;
        case 'bg':
          return defaultVal.bg;
        default:
          throw new Error(
              `Get Callout prop checks are not exhaustive, prop: ${prop}`);
      }
    }
    switch (prop) {
      case 'text':
        return callout.text;
      case 'color':
        return callout.color;
      case 'bg':
        return callout.bg;
      default:
        throw new Error(
            `Get Callout prop checks are not exhaustive, prop: ${prop}`);
    }
  }

  getNodeModifiers(node: DagNode) {
    return [...node.modifiers].join(' ');
  }

  getA11yLabel(node: DagNode) {
    // TODO: A11y announcements translation b/300590261
    const subTypeLabel = node.subType ? ` (Subtype: ${node.subType})` : '';
    let edgeInfo;
    if (this.edges.length === 0) {
      edgeInfo = 'No edge.';
    } else if (this.edges.length === 1) {
      edgeInfo = '1 edge.';
    } else {
      edgeInfo = `${this.edges.length} edges.`;
    }
    edgeInfo += this.edges.filter(e => !!e.label).map(e => e.label).join(', ');

    return `${node.type}${subTypeLabel} - ${node.getNodeDisplayName()} - ${
        edgeInfo}`;
  }

  getStateIconWidth(node: DagNode) {
    return this.dims.getIconStateSpace(node.state, node.conditionalQuery);
  }

  getNodeStateColor(node: DagNode) {
    const {state, icon} = node;
    return isNoState(state) ?
        icon!.color :
        this.fetchIcon(this.iconForState(state), 'color');
  }

  classNameState(): string {
    return this.node?.state?.toLowerCase() || '';
  }

  fetchIcon = (icon: NodeIcon|undefined, key: keyof NodeIcon|'bg') =>
      icon ? fetchIcon(icon, key) : '';

  isNoState = isNoState;
  bgForState = (state: NodeState) => bgForState(state, this.theme);
  iconForState = (state: NodeState) => iconForState(state, this.theme);
  isTextIcon = isTextIcon;
  convertStateToRuntime = convertStateToRuntime;
  iconRescale = iconRescale;
}

@NgModule({
  imports: [
    CommonModule,
    WorkflowGraphIconModule,
    DagIconsModule,
    DragDropModule,
  ],
  declarations: [
    DagNodeEl,
  ],
  exports: [
    DagNodeEl,
  ],
})
export class DagNodeModule {
}
