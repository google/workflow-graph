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

import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';

import {URL_SANITIZER} from './data_types_internal';
import {UrlSanitizerInternal} from './url_sanitizer';

export const TEST_PROVIDERS = [
  {provide: URL_SANITIZER, useClass: UrlSanitizerInternal},
  provideNoopAnimations(),
];

export const TEST_IMPORTS = [
  MatIconTestingModule,
];