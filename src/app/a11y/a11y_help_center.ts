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

import {CommonModule} from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {WorkflowGraphIconModule} from '../icon_wrapper';
import {MaterialSharedModule} from '../material_shared_module';
import {UserConfig, UserConfigService} from '../user_config.service';

import {ShortcutPipe} from './shortcut.pipe';
import {ShortcutService} from './shortcut.service';

/**
 * A11y Help Center Dialog
 */
@Component({
  selector: 'a11y-help-center',
  styleUrls: ['a11y_help_center.scss'],
  templateUrl: 'a11y_help_center.ng.html',
  standalone: true,
  imports: [
    CommonModule,
    MaterialSharedModule,
    ReactiveFormsModule,
    WorkflowGraphIconModule,
    ShortcutPipe,
  ],
})
export class AccessibilityHelpCenter implements OnInit, OnDestroy {
  private readonly userConfigService = inject(UserConfigService);
  private readonly shortcutService = inject(ShortcutService);
  private readonly fb = inject(FormBuilder);

  // TODO: Remapping shortcuts b/289193145
  displayedColumns: string[] = ['enabled', 'desc', 'shortcut' /*, 'edit'*/];
  dataSource = Object.values(this.shortcutService.shortcuts);
  form = this.fb.group({
    shortcuts: this.fb.group(
        this.dataSource.reduce(
            (a, {name, enabled, shortcut}) => {
              return {...a, [name]: this.fb.group({enabled, shortcut})};
            },
            {}) as {
          [key: string]: FormGroup<
              {enabled: FormControl<boolean>, shortcut: FormControl<string>}>
        }),
    disableAnimations: new FormControl<boolean>(
        !!this.userConfigService.config?.value?.a11y?.disableAnimations),
  });
  destroy = new Subject<void>();
  allEnabled = false;
  someEnabled = false;

  ngOnInit() {
    this.updateCheckboxStates();
    this.form.get('shortcuts')!.valueChanges.pipe(takeUntil(this.destroy))
        .subscribe(() => {
          this.updateCheckboxStates();
        });
  }
  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  save() {
    this.userConfigService.update({
      a11y: this.form.value,
    } as Partial<UserConfig>);
  }

  toggleAll(enabled: boolean) {
    Object.keys(this.form.get('shortcuts')!.value).forEach((key) => {
      this.form.patchValue({shortcuts: {[key]: {enabled}}});
    });
  }

  private updateCheckboxStates() {
    const values = Object.values(this.form.get('shortcuts')!.value);
    this.allEnabled = values.every(value => value?.enabled);
    this.someEnabled = !this.allEnabled && values.some(value => value?.enabled);
  }

  restoreDefault() {
    this.form.patchValue({
      shortcuts: this.shortcutService.defaultSaved,
      disableAnimations: false,
    });
  }
}
