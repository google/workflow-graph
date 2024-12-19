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
import {DOCUMENT} from '@angular/common';
import {Component, DestroyRef, Inject, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {combineLatest, fromEvent, Observable} from 'rxjs';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';

import {DagStateService} from './dag-state.service';
import {STATE_SERVICE_PROVIDER} from './dag-state.service.provider';
import {Theme} from './data_types_internal';

@Component({
  selector: 'workflow-graph-color-theme-loader',
  template: '',
  styleUrls: ['./color_theme_loader.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  providers: [
    STATE_SERVICE_PROVIDER,
  ],
})
export class ColorThemeLoader {
  private readonly theme: Observable<Theme|undefined> =
      this.dagStateService.features$.pipe(
          map(features => features.theme), distinctUntilChanged());
  readonly prefersColorSchemeDarkMediaQuery: MediaQueryList = window.matchMedia(
      '(prefers-color-scheme: dark)',
  );
  private readonly deviceColorSchemeDarkChange: Observable<boolean> =
      fromEvent<MediaQueryListEvent>(
          this.prefersColorSchemeDarkMediaQuery,
          'change',
          )
          .pipe(
              map((event) => event.matches),
              startWith(this.prefersColorSchemeDarkMediaQuery.matches),
          );

  constructor(
      private readonly dagStateService: DagStateService,
      @Inject(DOCUMENT) private readonly document: Document,
      private readonly destroyRef: DestroyRef) {
    combineLatest([this.theme, this.deviceColorSchemeDarkChange])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(([theme, isDeviceColorDark]) => {
          const isDarkTheme =
              theme === 'dark' || (theme === 'device' && isDeviceColorDark);
          this.document.body.classList.toggle(
              'workflow-graph-theme-dark', isDarkTheme);
          this.document.body.classList.toggle(
              'workflow-graph-theme-light', !isDarkTheme);
        });
  }
}