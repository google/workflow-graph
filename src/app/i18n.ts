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

/**
 * @fileoverview Simple i18n module that fetches translations for a given
 * string.
 */
import {Inject, Injectable, InjectionToken, Optional} from '@angular/core';


/** The default translations in English */
export const NODE_STATE_TRANSLATIONS = {
  'nodeStateWorking': 'Working',
  'nodeStatePending': 'Pending',
  'nodeStateCancelled': 'Cancelled',
  'nodeStateRunning': 'Running',
  'nodeStateTimeout': 'Timeout',
  'nodeStateCached': 'Cached',
  'nodeStateNotTriggered': 'Not Triggered',
  'nodeStateCompleted': 'Completed',
  'nodeStateFailed': 'Failed',
};

export const DEFAULT_TRANSLATIONS = {
  ...NODE_STATE_TRANSLATIONS,
};


/**
 * A subset of translations individually exported so it can be set separately
 */
export type NodeStateTranslations = typeof NODE_STATE_TRANSLATIONS;

/** The type of translations that should be provided */
export type Translations = typeof DEFAULT_TRANSLATIONS;

/** An injection token for the translations of the workflow_graph */
export const WORKFLOW_GRAPH_TRANSLATIONS =
    new InjectionToken<Partial<Translations>>('WorkflowGraphTranslations');


@Injectable({providedIn: 'root'})
export class TranslationsService {
  private translations = DEFAULT_TRANSLATIONS;

  constructor(@Optional() @Inject(WORKFLOW_GRAPH_TRANSLATIONS) translations:
                  Partial<Translations>) {
    if (translations) {
      this.setTranslations(translations)
    }
  }

  setTranslations(translations: Partial<Translations>) {
    if (!translations) return;
    this.translations = {...this.translations, ...translations};
  }

  translateMessage(key: keyof Translations) {
    return this.translations[key];
  }
}
