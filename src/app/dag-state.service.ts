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

import {Injectable, OnDestroy, TemplateRef} from '@angular/core';
import * as _ from 'lodash';
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

import {DEFAULT_LAYOUT_OPTIONS, DEFAULT_THEME, defaultFeatures} from './data_types_internal';
import {DagGroup, DagNode, GroupIterationRecord, NodeRef, SelectedNode} from './node_spec';

/** Function handler to listen for state changes on type `T` */
export type StateListener<T> = (value: T) => void;

/** Function handler to resolve a node reference to its actual node / group */
export type ReferenceResolver = (ref: NodeRef) => DagNode|DagGroup;

const passThru = (e: unknown) => {};
const isNoop = (fn: Function) => fn === passThru;

/**
 * A shared state manager for DAG renderer and all descendants
 *
 * Internally de-duplicates all event broadcasts
 *
 * Since services are global singletons, while we will borrow the pattern,
 * we will initialize this manually in the DAG Parent (`ai-dag-renderer`)
 */
@Injectable()
export class DagStateService implements OnDestroy {
  // TODO(b/180560084): Refactor this code using dictionaries
  // TODO(b/180560085): Add tests for this file
  // TODO(b/303633560): Serving more Workflow Graph (toolbar+graph) per page
  private collapsed = true;
  private selectedNode: SelectedNode|null = null;
  private theme = DEFAULT_THEME;
  private layout = DEFAULT_LAYOUT_OPTIONS;
  private features = defaultFeatures;
  private customNodeTemplates: Record<string, TemplateRef<any>> = {};
  private expandPath: string[] = [];
  private iterationChange!: GroupIterationRecord;

  readonly zoomReset = new Subject<void>();
  readonly zoom = new BehaviorSubject(1);

  private readonly collapsedChange$ =
      new Subject<DagStateService['collapsed']>();
  private readonly selectedNodeChange$ =
      new Subject<DagStateService['selectedNode']>();
  private readonly themeChange$ = new Subject<DagStateService['theme']>();
  private readonly layoutChange$ = new Subject<DagStateService['layout']>();
  private readonly featuresChange$ = new Subject<DagStateService['features']>();
  private readonly customNodeTemplatesChange$ =
      new Subject<DagStateService['customNodeTemplates']>();
  private readonly expandPathChange$ =
      new Subject<DagStateService['expandPath']>();
  private readonly iterationChangeChange$ =
      new Subject<DagStateService['iterationChange']>();

  collapsed$: Observable<DagStateService['collapsed']> = this.collapsedChange$;
  selectedNode$: Observable<DagStateService['selectedNode']> =
      this.selectedNodeChange$;
  theme$: Observable<DagStateService['theme']> = this.themeChange$;
  layout$: Observable<DagStateService['layout']> = this.layoutChange$;
  features$: Observable<DagStateService['features']> = this.featuresChange$;
  customNodeTemplates$: Observable<DagStateService['customNodeTemplates']> =
      this.customNodeTemplatesChange$;
  expandPath$: Observable<DagStateService['expandPath']> =
      this.expandPathChange$;
  iterationChange$: Observable<DagStateService['iterationChange']> =
      this.iterationChangeChange$;

  /**
   * Listen to all the various properties inside the DAG Shared state
   *
   * _**Note:** Make sure to run `destroyAll` on the returned list of
   * `observers` when your element lifecycle hits `ngOnDestroy` (source:
   * https://stackoverflow.com/a/42249082/2162893)_
   */
  listenAll({
    collapsed = passThru as Parameters<DagStateService['listenCollapsed']>[0],
    selectedNode = passThru as
        Parameters<DagStateService['listenSelectedNode']>[0],
    theme = passThru as Parameters<DagStateService['listenTheme']>[0],
    layout = passThru as Parameters<DagStateService['listenLayout']>[0],
    features = passThru as Parameters<DagStateService['listenFeatures']>[0],
    expandPath = passThru as Parameters<DagStateService['listenExpandPath']>[0],
    iterationChange = passThru as
        Parameters<DagStateService['listenIterationChange']>[0],
    customNodeTemplates = passThru as
        Parameters<DagStateService['listenCustomNodeTemplates']>[0],
  }) {
    const observers: Subscription[] = [];
    isNoop(collapsed) || observers.push(this.listenCollapsed(collapsed));
    isNoop(selectedNode) ||
        observers.push(this.listenSelectedNode(selectedNode));
    isNoop(theme) || observers.push(this.listenTheme(theme));
    isNoop(layout) || observers.push(this.listenLayout(layout));
    isNoop(features) || observers.push(this.listenFeatures(features));
    isNoop(expandPath) || observers.push(this.listenExpandPath(expandPath));
    isNoop(iterationChange) ||
        observers.push(this.listenIterationChange(iterationChange));
    isNoop(customNodeTemplates) ||
        observers.push(this.listenCustomNodeTemplates(customNodeTemplates));
    return observers;
  }

  /**
   * The observers created in `listenAll()` need to be cleaned when the client
   * element using this StateManager is destroyed (ie. `ngOnDestroy`).
   *
   * However this StateManager manages state for multiple elements, so the
   * `observers` list passed from `listenAll()` must be passed back here so we
   * can clear just the listeners that were initialized by this element.
   *
   * @param observers The list of observers created from `listenAll`
   * @param destroyStateService Should only be run by the element that created
   *     this object to clean the state service itself
   */
  destroyAll(observers: Subscription[], destroyStateService = false) {
    for (const obs of observers) {
      obs.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.collapsedChange$.unsubscribe();
    this.selectedNodeChange$.unsubscribe();
    this.themeChange$.unsubscribe();
    this.layoutChange$.unsubscribe();
    this.featuresChange$.unsubscribe();
    this.expandPathChange$.unsubscribe();
    this.customNodeTemplatesChange$.unsubscribe();
  }

  private listenCollapsed(fn: StateListener<DagStateService['collapsed']>) {
    const obs =
        this.collapsed$.pipe(distinctUntilChanged()).subscribe(v => void fn(v));
    this.setCollapsed(this.collapsed);
    return obs;
  }
  setCollapsed(v: DagStateService['collapsed']) {
    this.collapsed = v;
    this.collapsedChange$.next(v);
  }
  private listenSelectedNode(
      fn: StateListener<DagStateService['selectedNode']>) {
    const obs = this.selectedNode$.pipe(distinctUntilChanged())
                    .subscribe(v => void fn(v));
    this.setSelectedNode(this.selectedNode);
    return obs;
  }
  setSelectedNode(v: DagStateService['selectedNode']) {
    this.selectedNode = v;
    this.selectedNodeChange$.next(v);
  }
  private listenTheme(fn: StateListener<DagStateService['theme']>) {
    const obs = this.theme$.pipe(distinctUntilChanged(_.isEqual))
                    .subscribe(v => void fn(v));
    this.setTheme(this.theme);
    return obs;
  }
  setTheme(v: DagStateService['theme']) {
    this.theme = v;
    this.themeChange$.next(v);
  }
  private listenLayout(fn: StateListener<DagStateService['layout']>) {
    const obs = this.layout$.subscribe(v => void fn(v));
    this.setLayout(this.layout);
    return obs;
  }
  setLayout(v: DagStateService['layout']) {
    this.layout = v;
    this.layoutChange$.next(v);
  }
  private listenFeatures(fn: StateListener<DagStateService['features']>) {
    const obs = this.features$.subscribe(v => void fn(v));
    this.setFeatures(this.features);
    return obs;
  }
  setFeatures(v: DagStateService['features']) {
    this.features = v;
    this.featuresChange$.next(v);
  }
  private listenCustomNodeTemplates(
      fn: StateListener<DagStateService['customNodeTemplates']>) {
    const obs = this.customNodeTemplates$.subscribe(v => void fn(v));
    this.setCustomNodeTemplates(this.customNodeTemplates);
    return obs;
  }
  setCustomNodeTemplates(v: DagStateService['customNodeTemplates']) {
    this.customNodeTemplates = v;
    this.customNodeTemplatesChange$.next(v);
  }
  private listenExpandPath(fn: StateListener<DagStateService['expandPath']>) {
    const obs = this.expandPath$.subscribe(v => void fn(v));
    this.setExpandPath(this.expandPath);
    return obs;
  }
  setExpandPath(v: DagStateService['expandPath']) {
    this.expandPath = v;
    this.expandPathChange$.next(v);
  }
  private listenIterationChange(
      fn: StateListener<DagStateService['iterationChange']>) {
    const obs = this.iterationChange$.subscribe(v => void fn(v));
    this.setIterationChange(this.iterationChange);
    return obs;
  }
  setIterationChange(v: DagStateService['iterationChange']) {
    this.iterationChange = v;
    this.iterationChangeChange$.next(v);
  }
}
