import { Component, ElementRef, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Node, Edge } from '../Models/graph';

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [],
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css'
})
export class GraphComponent implements OnInit {
  @ViewChild('graphContainer', { static: true }) container!: ElementRef;
  @ViewChild('palette', { static: true }) palette!: ElementRef;

  private graph: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initGraph();
    }
  }

  initGraph() {
    if (typeof window === 'undefined' || !window['mxGraph']) {
      console.error('mxGraph not loaded or running on server!');
      return;
    }

    const container = this.container.nativeElement;
    mxEvent.disableContextMenu(container);

    this.graph = new mxGraph(container);
    new mxRubberband(this.graph);

    // ✅ Allow editing labels
    this.graph.setCellsEditable(true);

    // ✅ Restrict editing: only allow Progress nodes
    this.graph.isCellEditable = (cell: any) => {
      if (cell.vertex && cell.value === 'Progress') {
        return true;
      }
      // Allow editing renamed Progress nodes too
      if (cell.vertex && typeof cell.value === 'string' && cell.style.includes('fillColor=#2196F3')) {
        return true;
      }
      return false;
    };

    this.initPalette();

    const listener = () => this.exportGraph();
    this.graph.getModel().addListener(mxEvent.CHANGE, listener);
    this.graph.getSelectionModel().addListener(mxEvent.CHANGE, listener);
  }

  initPalette() {
    const graph = this.graph;

    const addVertex = (
      el: HTMLElement,
      label: string,
      style: string,
      w: number,
      h: number,
      type: 'start' | 'end' | 'progress' | 'generic'
    ) => {
      const vertex = new mxCell(label, new mxGeometry(0, 0, w, h), style);
      vertex.setVertex(true);

      mxUtils.makeDraggable(el, graph, (graph: any, evt: any, cell: any) => {
        if (type === 'start' && this.hasNode('Start')) {
          alert('Only one Start node is allowed!');
          return null;
        }
        if (type === 'end' && this.hasNode('End')) {
          alert('Only one End node is allowed!');
          return null;
        }

        const pt = graph.getPointForEvent(evt);
        return graph.insertVertex(graph.getDefaultParent(), null, label, pt.x, pt.y, w, h, style);
      });
    };

    // Start
    addVertex(
      document.getElementById('startNode')!,
      'Start',
      'shape=rectangle;fillColor=#4CAF50;fontColor=#FFFFFF;rounded=1;',
      100,
      40,
      'start'
    );

    // End
    addVertex(
      document.getElementById('endNode')!,
      'End',
      'shape=rectangle;fillColor=#F44336;fontColor=#FFFFFF;rounded=1;',
      100,
      40,
      'end'
    );

    // Progress (editable)
    addVertex(
      document.getElementById('progressNode')!,
      'Progress',
      'shape=ellipse;fillColor=#2196F3;fontColor=#FFFFFF;',
      100,
      40,
      'progress'
    );

    // Arrow edge
    const arrowEl = document.getElementById('arrowEdge')!;
    mxUtils.makeDraggable(
      arrowEl,
      graph,
      (graph: any, evt: any, cell: any) => {
        const pt = graph.getPointForEvent(evt);
        const parent = graph.getDefaultParent();

        const v1 = graph.insertVertex(parent, null, '', pt.x, pt.y, 40, 20, 'fillColor=none;strokeColor=none;');
        const v2 = graph.insertVertex(parent, null, '', pt.x + 100, pt.y, 40, 20, 'fillColor=none;strokeColor=none;');

        return graph.insertEdge(parent, null, '', v1, v2, 'endArrow=block;strokeColor=#333333;strokeWidth=2;');
      }
    );
  }

  hasNode(label: string): boolean {
    const model = this.graph.getModel();
    const parent = model.getChildAt(model.getRoot(), 0);
    const childCount = model.getChildCount(parent);

    for (let i = 0; i < childCount; i++) {
      const cell = model.getChildAt(parent, i);
      if (cell.vertex && cell.value === label) {
        return true;
      }
    }
    return false;
  }

  exportGraph() {
    const model = this.graph.getModel();
    const parent = model.getChildAt(model.getRoot(), 0);

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const childCount = model.getChildCount(parent);

    for (let i = 0; i < childCount; i++) {
      const cell = model.getChildAt(parent, i);

      if (cell.vertex) {
        const geo = cell.geometry;
        nodes.push({
          id: cell.id || `node-${i}`,
          label: cell.value || '',
          x: geo.x,
          y: geo.y,
          width: geo.width,
          height: geo.height,
          style: cell.style
        });
      } else if (cell.edge) {
        edges.push({
          source: cell.source?.id,
          target: cell.target?.id,
          label: cell.value || '',
          style: cell.style
        });
      }
    }

    console.clear();
    console.log('Workflow JSON:', JSON.stringify({ nodes, edges }, null, 2));
  }
}
