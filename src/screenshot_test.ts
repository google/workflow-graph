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

const SCREEN_WIDTH = 1440;

/** Screenshot testing */
export class ScreenshotTest {
  constructor(moduleId: string) {}

  async expectMatch(name: string, element = 'body') {
    /**
     * This is an empty matcher because the screenshots are generated internally
     * and no open-source alternative is set up yet.
     * TODO: b/303376415
     */
    return;
  }
}