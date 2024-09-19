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

import {Directive, Input, NgModule, TemplateRef, ViewContainerRef} from '@angular/core';

class NgVarContext<T> {
  constructor(private readonly ngVarInstance: NgVar<T>) {}

  get ngVar(): T {
    return this.ngVarInstance.ngVar;
  }
}

/**
 * IMPORTANT: for new Angular code, use the built-in `@let` syntax instead.
 * See https://angular.dev/api/core/@let.
 *
 * A simple directive that allows declaring variables in templates, similar to
 * ngIf.
 */
@Directive({standalone: false,
            selector: '[ngVar]'})
export class NgVar<T> {
  @Input() ngVar!: T;

  constructor(
      viewContainer: ViewContainerRef,
      templateRef: TemplateRef<NgVarContext<T>>) {
    viewContainer.createEmbeddedView(templateRef, new NgVarContext<T>(this));
  }
}

/**
 * IMPORTANT: for new Angular code, use the built-in `@let` syntax instead.
 * See https://angular.dev/api/core/@let.
 */
@NgModule({
  declarations: [NgVar],
  exports: [NgVar],
})
export class NgVarModule {
}