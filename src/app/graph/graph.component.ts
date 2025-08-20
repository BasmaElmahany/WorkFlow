import { Component, ElementRef, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NodeConfig, EdgeConfig } from '../Models/graph';

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

    this.initPalette();

    // ✅ Listen for any change (move, resize, connect)
    const listener = () => this.exportGraph();
    this.graph.getModel().addListener(mxEvent.CHANGE, listener);
    this.graph.getSelectionModel().addListener(mxEvent.CHANGE, listener);
  }

  initPalette() {
    const graph = this.graph;

    const addVertex = (el: HTMLElement, label: string, style: string, w: number, h: number) => {
      const vertex = new mxCell(label, new mxGeometry(0, 0, w, h), style);
      vertex.setVertex(true);

      mxUtils.makeDraggable(el, graph, (graph: any, evt: any, cell: any) => {
        const pt = graph.getPointForEvent(evt);
        return graph.insertVertex(graph.getDefaultParent(), null, label, pt.x, pt.y, w, h, style);
      });
    };

    // ✅ Start Node
    addVertex(
      document.getElementById('startNode')!,
      'Start',
      'shape=rectangle;fillColor=#4CAF50;fontColor=#FFFFFF;rounded=1;',
      100,
      40
    );

    // ✅ End Node
    addVertex(
      document.getElementById('endNode')!,
      'End',
      'shape=rectangle;fillColor=#F44336;fontColor=#FFFFFF;rounded=1;',
      100,
      40
    );

    // ✅ Arrow Edge
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

  // ✅ Export current graph state to JSON
  exportGraph() {
    const model = this.graph.getModel();
    const parent = model.getChildAt(model.getRoot(), 0);

    const nodes: NodeConfig[] = [];
    const edges: EdgeConfig[] = [];

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
