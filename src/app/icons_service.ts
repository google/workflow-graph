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

import {MatIconRegistry} from './material_shared_module';
import {UrlSanitizer} from './url_sanitizer';

/**
 * Variables from common constants, re-declared here for OSS.
 */
const AI_ICONSET = 'cloud_ai';
const AI_LARGE_ICONSET_VERSION = 5;
const AI_MEDIUM_ICONSET_VERSION = 72;
const AI_SMALL_ICONSET_VERSION = 69;

const SHELL_ICONSET = 'shell';
const SHELL_MEDIUM_ICONSET_VERSION = 8;
const SHELL_SMALL_ICONSET_VERSION = 232;

const COMMON_ICONSET = 'common';
const COMMON_ICONSET_VERSION = 124;

const ANTHOS_ICONSET = 'anthos';
const ANTHOS_ICONSET_VERSION = 6;

/** Valid sizes for iconsets */
export type IconSizes = 'small'|'medium'|'large';

/**
 * Table mapping for iconset to its default size
 *
 * _**Note**: More than one size could be loaded for the same iconset with
 * different icons_
 */
export interface IconSizeMap {
  [iconset: string]: IconSizes;
}

/**
 * Iconset defaults to use, if not in this map, logic defaults to `small`
 */
export const sizeMap: IconSizeMap = {
  [SHELL_ICONSET]: 'medium',
  [AI_ICONSET]: 'medium',
  [COMMON_ICONSET]: 'medium',
  [ANTHOS_ICONSET]: 'small',
};

/**
 * Entries for IconSet
 *
 * Looks like [`iconset`, `iconSize, `version`]
 */
type IconsetList = [string, IconSizes, number];

/** Service used to register DAG icons with Material registry */
@Injectable({providedIn: 'root'})
export class DagIconsService {
  private isInitialized = false;

  constructor(
      private readonly iconRegistry: MatIconRegistry,
      private readonly sanitizer: UrlSanitizer) {
    this.registerIcons();
  }

  registerIcons() {
    if (this.isInitialized) return;

    const icons: IconsetList[] = [
      [AI_ICONSET, 'large', AI_LARGE_ICONSET_VERSION],
      [AI_ICONSET, 'medium', AI_MEDIUM_ICONSET_VERSION],
      [AI_ICONSET, 'small', AI_SMALL_ICONSET_VERSION],
      [SHELL_ICONSET, 'small', SHELL_SMALL_ICONSET_VERSION],
      [SHELL_ICONSET, 'medium', SHELL_MEDIUM_ICONSET_VERSION],
      [COMMON_ICONSET, 'medium', COMMON_ICONSET_VERSION],
      [COMMON_ICONSET, 'small', COMMON_ICONSET_VERSION],
      [ANTHOS_ICONSET, 'small', ANTHOS_ICONSET_VERSION],
    ];

    icons.forEach(([iconset, size, version]) => {
      const url = this.sanitizer.sanitizeUrl(iconset, size, version);
      this.iconRegistry.addSvgIconSetInNamespace(`${iconset}-${size}`, url);
    });

    this.isInitialized = true;
  }
}
