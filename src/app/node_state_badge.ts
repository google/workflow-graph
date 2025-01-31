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
import { Component, Input, NgModule, inject } from '@angular/core';

import {ColorThemeLoader} from './color_theme_loader';
import {DEFAULT_THEME, IconConfig, isNoState, type NodeState} from './data_types_internal';
import {TranslationsService} from './i18n';
import {bgForState, fetchIcon, iconForState, labelForState} from './icon_util';
import {WorkflowGraphIconModule} from './icon_wrapper';

/** Renders a badge with an icon and description of a node state. */
@Component({
  standalone: false,
  selector: 'ai-dag-node-state-badge',
  styleUrls: ['node_state_badge.scss'],
  templateUrl: 'node_state_badge.ng.html',
})
export class DagNodeStateBadge {
  private readonly translationsService = inject(TranslationsService);

  theme = DEFAULT_THEME;

  @Input() nodeState!: NodeState;

  fetchIcon = (icon: IconConfig, key: keyof IconConfig) => fetchIcon(icon, key);

  bgForState = bgForState;

  iconForState = iconForState;

  labelForState = labelForState(this.translationsService);

  isNoState = isNoState;
}

export {type NodeState};

@NgModule({
  imports: [
    CommonModule,
    ColorThemeLoader,
    WorkflowGraphIconModule,
  ],
  declarations: [
    DagNodeStateBadge,
  ],
  exports: [
    DagNodeStateBadge,
  ],
})
export class DagNodeStateBadgeModule {
}
