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
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {DOCUMENT} from '@angular/common';
import {Component, ViewChild} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, waitForAsync} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';

import {ColorThemeLoader} from './color_theme_loader';
import {DagStateService} from './dag-state.service';
import {defaultFeatures, FeatureToggleOptions} from './data_types_internal';
import {initTestBed, keyWithCtrlOrCommand} from './test_resources/test_utils';


describe('ColorThemeLoader', () => {
  let toggleSpy: jasmine.Spy;
  let loaderInstance: ColorThemeLoader;
  const fakeFeatures =
      new BehaviorSubject<FeatureToggleOptions>(defaultFeatures);

  beforeEach(waitForAsync(async () => {
    fakeFeatures.next(defaultFeatures);

    const fakeDagStateService =
        jasmine.createSpyObj<DagStateService>('DagStateService', ['features$']);
    fakeDagStateService.features$ = fakeFeatures;

    await initTestBed({
      declarations: [TestComponent],
      imports: [ColorThemeLoader],
      providers: [
        {
          provide: DagStateService,
          useValue: fakeDagStateService,
        },
      ],
    });
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    loaderInstance = fixture.componentInstance.loader;
    toggleSpy = spyOn(
        fixture.debugElement.injector.get(DOCUMENT).body.classList, 'toggle');
  }));

  it('should set light mode by default', async () => {
    expect(
        window.document.body.classList.contains('workflow-graph-theme-light'))
        .toBeTrue();
    expect(window.document.body.classList.contains('workflow-graph-theme-dark'))
        .toBeFalse();
  })

  describe('when dark mode is set in features', () => {
    beforeEach(waitForAsync(async () => {
      fakeFeatures.next({
        ...defaultFeatures,
        theme: 'dark',
      });
    }));

    it('should set dark mode', async () => {
      expect(toggleSpy).toHaveBeenCalledWith(
          'workflow-graph-theme-light', false);
      expect(toggleSpy).toHaveBeenCalledWith('workflow-graph-theme-dark', true);
    })
  })

  describe('when the theme is set to device', () => {
    beforeEach(waitForAsync(async () => {
      fakeFeatures.next({
        ...defaultFeatures,
        theme: 'device',
      });
    }));

    describe('when the user prefers dark mode', () => {
      beforeEach(waitForAsync(async () => {
        toggleSpy.calls.reset();
        loaderInstance.prefersColorSchemeDarkMediaQuery.dispatchEvent(
            new MediaQueryListEvent('change', {
              matches: true,
              media: '(prefers-color-scheme: dark)',
            }));
      }));

      it('should set dark mode', () => {
        expect(toggleSpy).toHaveBeenCalledWith(
            'workflow-graph-theme-light', false);
        expect(toggleSpy).toHaveBeenCalledWith(
            'workflow-graph-theme-dark', true);
      });
    });
  });
});

@Component({
  standalone: false,
  template:
      '<workflow-graph-color-theme-loader #loader></workflow-graph-color-theme-loader>',
  jit: true,
})
class TestComponent {
  @ViewChild('loader', {static: false}) loader!: ColorThemeLoader;
}