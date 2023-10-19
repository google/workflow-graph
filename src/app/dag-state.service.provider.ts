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

import {Injector, Optional, SkipSelf} from '@angular/core';

import {DagStateService} from './dag-state.service';

/**
 * Provider for DagStateService. Loading a new instance of the service
 * only if there is not already one provided by the ancestors.
 */
export const STATE_SERVICE_PROVIDER = {
  provide: DagStateService,
  useFactory: (parentInjector: Injector, stateService?: DagStateService) => {
    if (!stateService) {
      const injector = Injector.create(
          {providers: [{provide: DagStateService}], parent: parentInjector});
      stateService = injector.get(DagStateService);
    }

    return stateService;
  },
  deps: [Injector, [new Optional(), new SkipSelf(), DagStateService]],
};
