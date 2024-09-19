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
import {ChangeDetectionStrategy, Component, HostBinding, Input, NgModule, OnChanges, SimpleChanges, ViewEncapsulation} from '@angular/core';

import {DagIconsService} from './icons_service';
import {MaterialSharedModule} from './material_shared_module';

const SIZE_ICON_LARGE = 32;
const SIZE_ICON_MEDIUM = 24;
const SIZE_ICON_SMALL = 16;

const COMMON_ICON_SET = 'common';

interface MatIconSpec {
  kind: 'mat-icon';
  iconset: string;
  size: IconSize;
  icon: string;
}
interface MatSpinnerSpec {
  kind: 'mat-spinner';
  sizePx: number;
}

/** Describes the types of icons that this component can render. */
type IconSpec = MatIconSpec|MatSpinnerSpec;

/** Available sizes for standard icon sets. */
export type IconSize = 'small'|'medium'|'large';

function sizeToPixels(size: IconSize): number {
  switch (size) {
    case 'large':
      return SIZE_ICON_LARGE;
    case 'medium':
      return SIZE_ICON_MEDIUM;
    case 'small':
      return SIZE_ICON_SMALL;
    default:
      return SIZE_ICON_SMALL;
  }
}

/**
 * The <workflow-graph-icon> component.
 */
@Component({
  standalone: false,
  selector: 'workflow-graph-icon',
  templateUrl: './icon_wrapper.ng.html',
  styleUrls: ['./icon_wrapper.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class WorkflowGraphIcon implements OnChanges {
  /** The name of the icon set (defaults to the common icon sets). */
  @Input() iconset = COMMON_ICON_SET;

  /** The ID of the icon. */
  @Input() icon = '';

  /** The size (in T-shirt sizes) of the icon. */
  @Input() size: IconSize|string = 'small';

  /** An internal specification for what icon this component will render. */
  iconSpec?: IconSpec;

  constructor(private readonly iconsService: DagIconsService) {
    this.iconsService.registerIcons();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.icon === 'working') {
      this.iconSpec = {
        kind: 'mat-spinner',
        sizePx: sizeToPixels(this.size as IconSize)
      };
    } else if (this.icon) {
      this.iconSpec = {
        kind: 'mat-icon',
        iconset: this.iconset,
        icon: this.icon,
        size: this.size as IconSize,
      };
    } else {
      // Display nothing when no icon value has been set yet, or when an `async`
      // pipe is used on the icon input, which leaves `this.icon === null`
      // during loading (possible for templates not using strict type checking).
      // Otherwise mat-icon throws an error trying to load a wrong icon name.
      this.iconSpec = undefined;
    }
  }

  @HostBinding('class')
  get classes() {
    return [
      'workflow-graph-icon',
      `workflow-graph-icon-size-${this.size}`,
      this.icon ? `workflow-graph-icon-${this.icon}` : '',
    ].join(' ');
  }
}

@NgModule({
  imports: [
    CommonModule,
    MaterialSharedModule,
  ],
  declarations: [
    WorkflowGraphIcon,
  ],
  exports: [
    WorkflowGraphIcon,
  ],
})
export class WorkflowGraphIconModule {
}
