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

import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

import {ShortcutService} from './a11y/shortcut.service';
import {SavedShortcutConfig, ShortcutList} from './a11y/shortcuts';

/**
 * User Configuration object which is being saved by the provided userConfig
 * subject/subscriber method.
 */
export interface UserConfig {
  a11y?: {
    shortcuts?: ShortcutList<SavedShortcutConfig>,
    disableAnimations?: boolean,
  };
}

/**
 * User Config singleton service provided on root level.
 */
@Injectable({providedIn: 'root'})
export class UserConfigService {
  readonly config = new BehaviorSubject<UserConfig>({});

  constructor(private readonly shortcutService: ShortcutService) {}

  init(userConfig?: UserConfig) {
    if (!userConfig) return;
    this.update(userConfig);
  }

  update(values: Partial<UserConfig>) {
    this.config?.next({...this.config.value, ...values});

    this.shortcutService.updateShortcuts(
        this.config.value.a11y?.shortcuts || {});
  }
}
