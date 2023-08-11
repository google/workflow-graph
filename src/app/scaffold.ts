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

import {AfterContentInit, ChangeDetectionStrategy, Component, ContentChild, ElementRef, EventEmitter, HostBinding, Input, NgModule, OnDestroy, Output, ViewEncapsulation} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ShortcutService} from './a11y/shortcut.service';
import {baseColors, BLUE_THEME, createDAGFeatures, DagTheme, DEFAULT_THEME, defaultFeatures, FeatureToggleOptions, generateTheme} from './data_types_internal';
import {DirectedAcyclicGraph} from './directed_acyclic_graph';
import {DagLogger, DagLoggerModule} from './logger/dag_logger';
import {DagToolbar} from './toolbar';
import {UserConfig, UserConfigService} from './user_config.service';

/**
 * Expose internal Shared Objects
 */
export {
  baseColors,
  BLUE_THEME,
  createDAGFeatures,
  DagTheme,
  DEFAULT_THEME,
  defaultFeatures,
  FeatureToggleOptions,
  generateTheme,
};

/**
 * Allows for a grouped view of toolbar and dag
 */
@Component({
  selector: 'ai-dag-scaffold',
  styleUrls: [
    'scaffold.scss',
    './material_theme.scss',
  ],
  templateUrl: 'scaffold.ng.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DagLogger,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class DagScaffold implements AfterContentInit, OnDestroy {
  private features?: FeatureToggleOptions;
  private theme?: DagTheme;
  private hasInited = false;
  private readonly destroy = new Subject<void>();

  @HostBinding('attr.tabindex') tabindex = 0;
  @ContentChild(DagToolbar) toolbarRef?: DagToolbar;
  @ContentChild(DirectedAcyclicGraph) dagRef?: DirectedAcyclicGraph;
  @Input('features')
  set onSetFeatures(f: FeatureToggleOptions) {
    this.features = f;
    this.propagateFeatures();
  }
  @Input('theme')
  set onSetTheme(t: DagTheme) {
    this.theme = t;
    this.propagateFeatures();
  }
  @Input() userConfig?: UserConfig;
  @Output() readonly userConfigChange = new EventEmitter<UserConfig>();

  constructor(
      private readonly userConfigService: UserConfigService,
      private readonly shortcutService: ShortcutService,
      private readonly el: ElementRef) {}

  ngOnInit() {
    this.userConfigService.init(this.userConfig);
    this.userConfigService.config.pipe(takeUntil(this.destroy))
        .subscribe((userConfig: UserConfig) => {
          this.userConfigChange.emit(userConfig);
        });
    if (this.features?.enableShortcuts) {
      this.shortcutService.enableShortcuts(this.el);
    }
  }

  ngAfterContentInit() {
    this.hasInited = true;
    this.propagateFeatures();
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  /**
   * Propagate DAG Features to elements, manually (either on init or after
   * change)
   */
  propagateFeatures() {
    if (!(this.features || this.theme) || !this.hasInited) return;
    const components = [this.toolbarRef, this.dagRef];
    for (const component of components) {
      if (!component) continue;
      component.features = this.features || component.features;
      component.theme = this.theme || component.theme;
    }
  }
}

@NgModule({
  declarations: [
    DagScaffold,
  ],
  imports: [
    DagLoggerModule,
  ],
  exports: [
    DagScaffold,
  ],
})
export class DagScaffoldModule {
}
