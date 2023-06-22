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

import {ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

/**
 * Renders the search field for the Group Iteration Select input.
 */
@Component({
  selector: 'ai-dag-iteration-selector-filter',
  templateUrl: 'group_iteration_select_filter.ng.html',
  host: {
    'class': 'ai-dag-iteration-select-filter',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupIterationSelectorFilter implements OnInit, OnDestroy {
  private readonly destroy = new Subject<void>();

  searchInput = new FormControl('', {nonNullable: true});

  @Output() readonly onSearch = new EventEmitter<string>();

  ngOnInit() {
    this.searchInput.valueChanges
        .pipe(debounceTime(50), takeUntil(this.destroy))
        .subscribe(value => {
          this.onSearch.emit(value);
        });
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }
}
