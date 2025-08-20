export interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: string;
}

export interface Edge {
  source: string; 
  target: string; 
  label?: string;
  style?: string;
}
