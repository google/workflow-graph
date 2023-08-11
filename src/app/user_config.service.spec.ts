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


import {ShortcutService} from './a11y/shortcut.service';
import {UserConfigService} from './user_config.service';

const INITIAL_USER_CONFIG_EXAMPLE = {
  a11y: {
    shortcuts: {},
    disableAnimations: false,
  }
};

describe('UserConfigService', () => {
  let service: UserConfigService;

  beforeEach(() => {
    service = new UserConfigService(new ShortcutService());
    service.init(INITIAL_USER_CONFIG_EXAMPLE);
  });

  it('Config value is set on initialization', () => {
    expect(service.config.value).toEqual(INITIAL_USER_CONFIG_EXAMPLE);
  });

  it('Update method modifies the config value', () => {
    const newValue = {...INITIAL_USER_CONFIG_EXAMPLE};
    newValue.a11y.disableAnimations = true;
    service.update(newValue);
    expect(service.config.value).toEqual(newValue);
  });
});