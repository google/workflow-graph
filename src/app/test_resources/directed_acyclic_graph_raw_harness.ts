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

import {ComponentHarness, TestElement} from '@angular/cdk/testing';

import {NodeType} from '../node_spec';

import {DagNodeElHarness} from './node_harness';


/** Test harness for the Directed Acyclic Graph component. */
export class DagRawHarness extends ComponentHarness {
  static hostSelector = 'ai-dag-raw';

  /**
   * Returns all node elements from the graph
   */
  getNodes(): Promise<TestElement[]> {
    return this.locatorForAll('.dag-component > ai-dag-node')();
  }

  /**
   * Returns all custom node elements from the graph
   */
  getCustomNodes(): Promise<TestElement[]> {
    return this.locatorForAll('.dag-component > .custom-node')();
  }

  getDagComponent(): Promise<TestElement> {
    return this.locatorFor('.dag-component')();
  }

  /** Simple click event on the DAG Element's SVG Wrapper */
  async clickCanvas(): Promise<void> {
    const dagComponent = await this.getDagComponent();
    await dagComponent.click();
  }

  async mousedown(): Promise<void> {
    const host = await this.host();
    await host.dispatchEvent('mousedown');
  }

  /** Fetch Attributes on Dag Renderer element */
  async getAttribute(attributeName: string): Promise<string|null> {
    const host = await this.host();
    return host.getAttribute(attributeName);
  }

  /**
   * Clicks an execution node on the graph by a given `displayName` or index
   * within the `node[sortedByExecution]` list provided
   */
  clickExecutionNode(indexOrId: number|string): Promise<void> {
    return this.clickNodeByType('execution', indexOrId);
  }

  /**
   * Clicks an artifact node on the graph by a given `displayName` or index
   * within the `node[sortedByArtifact]` list provided
   */
  clickArtifactNode(indexOrId: number|string): Promise<void> {
    return this.clickNodeByType('artifact', indexOrId);
  }

  /**
   * Clicks an artifact node on the graph by a given `displayName` or index
   * within the `node[sortedByArtifact]` list provided
   */
  clickCustomNode(indexOrId: number|string): Promise<void> {
    return this.clickNodeByType('custom', indexOrId);
  }

  /**
   * Clicks a group expansion area on the graph by a given index.
   * TODO(b/197574150): Support clicking by indexOrId
   */
  async clickExpandToggle(index: number): Promise<void> {
    const elements = await this.locatorForAll('.collapsed-expand-click-area')();
    return elements[index].click();
  }

  // TODO(b/197574150): Add interactions for groups (expand, collapse, hover?)

  private async clickNodeByType(
      type: NodeType|'custom', indexOrTitle: number|string): Promise<void> {
    if (type === 'custom') {
      return (await this.getNodeByType(type, indexOrTitle)).click();
    }
    const node = await this.getNodeByType(type, indexOrTitle);
    await node.click();
  }

  /**
   * Get node from dom by type, whether it's artifact / execution / custom
   *
   * Keep in mind, while custom nodes could be either Artifact / Execution, we
   * don't distinguish here
   */
  async getNodeByType(type: 'custom', indexOrTitle: number|string):
      Promise<TestElement>;
  async getNodeByType(type: NodeType, indexOrTitle: number|string):
      Promise<DagNodeElHarness>;
  async getNodeByType(type: NodeType|'custom', indexOrTitle: number|string) {
    let node: DagNodeElHarness|undefined;
    let errorMessage = '';
    const selector =
        type !== 'custom' ? `ai-dag-node[type='${type}']` : '.custom-node';
    const list = await this.locatorForAll('.dag-component ' + selector)();
    if (typeof indexOrTitle === 'number') {
      if (list[indexOrTitle]) {
        if (type === 'custom') return list[indexOrTitle];
        return (await this.locatorForAll(DagNodeElHarness)())[indexOrTitle];
      }
      errorMessage = `Could not find a node in the DAG by the selector {type: ${
          type} && index: ${indexOrTitle} (maxLength: ${list.length})}`;
    } else {
      if (type === 'custom') {
        const customNode = await this.locatorFor(
            `.dag-component .custom-node[node-title='${indexOrTitle}']`)();
        if (customNode) return customNode;
      } else {
        const allNodes = await this.locatorForAll(DagNodeElHarness)();
        for (const n of allNodes) {
          const title = await n.getTitle();
          if (title === indexOrTitle) {
            node = n;
            break;
          }
        }
      }
      errorMessage = `Could not find a node in the DAG by the selector {type: ${
          type} && title: ${indexOrTitle}}`;
    }
    if (!node) {
      throw new Error(errorMessage);
    }
    return node;
  }

  /**
   * Get all edges (lines between nodes) of the graph.
   */
  async getEdges(selector = '') {
    return this.locatorForAll('.edge-group' + selector)();
  }

  /**
   * Get an edge label by its text content.
   */
  async getEdgeLabel(labelText: string) {
    return this.locatorFor(`.edge-label[edge-label="${labelText}"]`)();
  }
}
