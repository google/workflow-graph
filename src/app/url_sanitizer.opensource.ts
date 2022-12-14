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
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

import {UrlSanitizer} from './data_types_internal';
// Used in the open-source version only
// tslint:enable:deprecation

@Injectable({
  providedIn: 'root',
})
export class UrlSanitizerOpenSource implements UrlSanitizer {
  constructor(private readonly sanitizer: DomSanitizer) {}
  sanitizeUrl(iconset: string, size: string, version: number): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://ssl.gstatic.com/pantheon/images/${iconset}/icons-${size}_v${
            version}.svg`);
  }
}