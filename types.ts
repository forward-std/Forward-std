
export enum BentoType {
  TEXT = 'text',
  STAT = 'stat',
  IMAGE = 'image', 
}

export interface BentoItem {
  id: string;
  x: number; // Grid Column Start
  y: number; // Grid Row Start
  colSpan: number;
  rowSpan: number;
  title: string;
  content: string;
  type: BentoType;
  backgroundColor: string; 
  textColor: string;
  locked?: boolean;
  variant?: 'square' | 'circle'; 
  innerPadding?: number; // New: Space between grid cell edge and item content
  
  // Sub Grid Configuration
  subItems?: BentoItem[]; 
  subRows?: number;     // New: Rows for the internal grid
  subColumns?: number;  // New: Columns for the internal grid
}

export interface GridConfig {
  width: number;
  height: number;
  columns: number;
  rows: number;
  gap: number; 
  padding: number; 
  borderRadius: number; 
  items: BentoItem[];
  palette: string[]; 
}

export interface AiResponseItem {
  title: string;
  content: string;
  colSpan: number;
  rowSpan: number;
  type: string;
  colorTheme: string;
}