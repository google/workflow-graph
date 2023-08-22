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

// Returns user agent specific keyboard event to test Ctrl/Cmd + Key shortcuts
// in any environment
export function keyWithCtrlOrCommand(code: string): KeyboardEventInit {
  const isMac = navigator.userAgent.includes('Mac');
  return {code, ctrlKey: !isMac, metaKey: isMac};
}