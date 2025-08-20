import { Component } from '@angular/core';
import { GraphComponent } from './graph/graph.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GraphComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'mxgrapghUsage';
}
