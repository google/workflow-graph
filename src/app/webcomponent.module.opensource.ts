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

import {DoBootstrap, Injector, NgModule} from '@angular/core';
import {createCustomElement} from '@angular/elements';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppComponent} from './app.component';
import {UrlSanitizerOpenSource} from './url_sanitizer.opensource';
import {URL_SANITIZER} from './url_sanitizer_types';
import {WorkflowGraphWrapper, WorkflowGraphWrapperModule} from './workflow_graph_wrapper';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    WorkflowGraphWrapperModule,
  ],
  providers: [{provide: URL_SANITIZER, useClass: UrlSanitizerOpenSource}],
})
export class AppModule implements DoBootstrap {
  constructor(private readonly injector: Injector) {}
  ngDoBootstrap() {
    const dagConstructor =
        createCustomElement(WorkflowGraphWrapper, {injector: this.injector});
    customElements.define('google-workflow-graph', dagConstructor);
  }
}