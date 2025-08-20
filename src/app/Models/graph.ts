export interface NodeConfig {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: string;
}

export interface EdgeConfig {
  source: string; 
  target: string; 
  label?: string;
  style?: string;
}
