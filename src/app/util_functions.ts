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

export function debounce<T>(
    callback: Function, delayMilliseconds: number, context: T) {
  let timeoutId: null|ReturnType<typeof setTimeout>;

  return (...args: unknown[]) => {
    const later = () => {
      timeoutId = null;
      callback.apply(context, args);
    };
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(later, delayMilliseconds);
  };
}

/** Simple object equality comparator to replace _.isEqual usage */
export function isEqual<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}