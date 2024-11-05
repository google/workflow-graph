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

import {OverlayContainer} from '@angular/cdk/overlay';
import {Injectable} from '@angular/core';

/**
 * Custom overlay container to add the overlay inside the scaffold.
 * This allows importing Material styles without affecting the host page.
 */
@Injectable()
export class CustomOverlayContainer extends OverlayContainer {
  override _createContainer(): void {
    const containerClass = 'cdk-overlay-container';
    const root = document.querySelector('ai-dag-scaffold');
    let container = document.createElement('div');
    container.classList.add(containerClass);

    root!.appendChild(container);
    this._containerElement = container;
  }
}