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

import {CdkDragMove, DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {Component, ElementRef, EventEmitter, Input, NgModule, OnChanges, Output, TemplateRef, ViewChild} from '@angular/core';

import {convertStateToRuntime, defaultFeatures, MinimapPosition, SVG_ELEMENT_SIZE} from '../data_types_internal';
import {CustomNode, DagGroup, DagNode, Point, SelectedNode} from '../node_spec';

/** Minimap component for Workflow Graph. */
@Component({
  selector: 'minimap',
  styleUrls: [
    'minimap.scss',
  ],
  templateUrl: './minimap.ng.html',
  host: {
    'class': 'minimap-wrapper',
    '[class.panning]': 'graphPanning',
    '[class.preview-on-pan]': 'features.seeThroughMinimapOnPan',
    '[attr.minimap-position]': 'position',
  },
})
export class Minimap implements OnChanges {
  // Minimap properties
  isDragging = false;
  scale = 1;
  width = 0;
  height = 0;
  contentScale = 1;
  contentWidth = 0;
  contentHeight = 0;
  viewboxWidth = 0;
  viewboxHeight = 0;
  viewboxX = 0;
  viewboxY = 0;

  @Input() position: MinimapPosition = 'top';
  @Input() features = defaultFeatures;
  @Input() groups: DagGroup[] = [];
  @Input() nodes: DagNode[] = [];
  @Input() graphPanning = false;
  @Input() sizeConfig = SVG_ELEMENT_SIZE();
  @Input() winWidth = 0;
  @Input() winHeight = 0;
  @Input() customMinimapNodeTemplates: Record<string, TemplateRef<any>> = {};
  @Input() selectedNode: SelectedNode|null = null;
  @Input() graphWidth = 0;
  @Input() graphHeight = 0;
  @Input() zoom = 1;
  @Input() x = 0;
  @Input() y = 0;

  @Output() readonly windowPan = new EventEmitter<Point>();

  @ViewChild('viewbox') private readonly viewbox!: ElementRef;

  /**
   * All the properties (like graph view position, graph and screen sizes are
   * passed to minimap as property inputs). When they change, we need to
   * recalculate the values below.
   */
  ngOnChanges() {
    // If minimap viewbox is currently dragged, we don't need to update the
    // properties
    if (this.isDragging) return;

    // Calculating the minimap area scale and size from a given width
    this.width = this.sizeConfig.dims.minimapWidth;
    this.scale = this.width / this.graphWidth;
    this.height = this.scale * this.graphHeight;

    // Calculating the viewbox size by reducing the initial, visible window
    // dimensions to the minimap's scale and reducing it further with the zoom.
    // If the zoom is below 1, we don't need to enlarge the view area: that will
    // be indicated by reducing the content (see next section)
    this.viewboxWidth = this.scale * this.winWidth / Math.max(this.zoom, 1);
    this.viewboxHeight = this.scale * this.winHeight / Math.max(this.zoom, 1);

    // If the zoom is below one, we indicate that by reducing the size of the
    // graph image.
    this.contentScale = Math.min(this.zoom, 1);
    this.contentWidth = this.width * this.contentScale;
    this.contentHeight = this.height * this.contentScale;

    // Converting the initial viewbox position to the scale of minimap. If the
    // zoom is above 1, the minimap (and the viewbox's position) is not scaled
    // anymore in parallel with the graph, so we have to decrease the x,y
    // coordinates (by dividing with the zoom) to get the right positions.
    this.viewboxX = this.scale * -this.x / Math.max(this.zoom, 1);
    this.viewboxY = this.scale * -this.y / Math.max(this.zoom, 1);
  }

  convertStateToRuntime = convertStateToRuntime;

  classNameState(node: DagNode|DagGroup): string {
    return node.state.toLowerCase();
  }

  getNodeType(node: DagNode|DagGroup) {
    return node instanceof DagNode ? node.type : 'group';
  }

  getCustomMinimapNodeTemplateForNode(node: DagNode): TemplateRef<any>|null {
    if (node instanceof CustomNode) {
      const templateRefName = node.minimapTemplateRef;
      if (!templateRefName) return null;
      return this.customMinimapNodeTemplates[templateRefName];
    }
    return null;
  }

  hasCustomMinimapNodeTemplateForNode(node: DagNode): boolean {
    if (node instanceof CustomNode) {
      return !!node.minimapTemplateRef;
    }
    return false;
  }

  private panByMinimapPos(position: Point) {
    this.windowPan.emit({
      x: Math.round(position.x / this.scale * Math.max(this.zoom, 1)),
      y: Math.round(position.y / this.scale * Math.max(this.zoom, 1)),
    });
  }

  dragPan(move: CdkDragMove) {
    const position = move.source.getFreeDragPosition();
    this.panByMinimapPos(position);
  }

  keyboardPan(event: KeyboardEvent) {
    event.preventDefault();
    const scrollAmt = 10;

    switch (event.key) {
      case 'ArrowLeft':
        this.viewboxX -= scrollAmt;
        break;
      case 'ArrowRight':
        this.viewboxX += scrollAmt;
        break;
      case 'ArrowUp':
        this.viewboxY -= scrollAmt;
        break;
      case 'ArrowDown':
        this.viewboxY += scrollAmt;
        break;
      default:
        return;
    }

    this.panByMinimapPos({x: this.viewboxX, y: this.viewboxY});
  }

  /**
   * Pan Minimap Viewbox middle point to the location of the event.
   * Returning without action if the click event target was the viewbox itself.
   */
  clickPan(ev: MouseEvent) {
    if (ev.target === this.viewbox?.nativeElement) return;
    const offsetX = (this.width - this.contentWidth) / 2;
    const offsetY = (this.height - this.contentHeight) / 2;
    this.panByMinimapPos({
      x: ev.offsetX - offsetX - this.viewboxWidth / 2,
      y: ev.offsetY - offsetY - this.viewboxHeight / 2,
    });
  }
}

@NgModule({
  declarations: [
    Minimap,
  ],
  exports: [
    Minimap,
  ],
  imports: [
    CommonModule,
    DragDropModule,
  ],
})
export class MinimapModule {
}
