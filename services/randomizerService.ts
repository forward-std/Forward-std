import { v4 as uuidv4 } from 'uuid';
import { BentoItem, BentoType } from '../types';
import { getContrastColor } from './layoutUtils';

const DEFAULT_COLORS = [
  '#191b32', '#ba8bff', '#d5ec2c', '#f7f6fc', '#2e3250', '#0f1126'
];

export const generateRandomGrid = (rows: number, cols: number, palette: string[] = []): BentoItem[] => {
  const items: BentoItem[] = [];
  const gridMap: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
  
  // Use provided palette or fallback to defaults
  const colors = palette.length > 0 ? palette : DEFAULT_COLORS;

  // Helper to check if space is free
  const isFree = (r: number, c: number, h: number, w: number) => {
    if (r + h > rows || c + w > cols) return false;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (gridMap[r + i][c + j]) return false;
      }
    }
    return true;
  };

  // Helper to mark space as taken
  const markTaken = (r: number, c: number, h: number, w: number) => {
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        gridMap[r + i][c + j] = true;
      }
    }
  };

  // Iterate through every cell
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (gridMap[r][c]) continue;

      const rand = Math.random();
      let w = 1, h = 1;

      // Try large blocks first
      if (rand > 0.9 && isFree(r, c, 4, 4)) { w = 4; h = 4; }
      else if (rand > 0.8 && isFree(r, c, 3, 3)) { w = 3; h = 3; }
      else if (rand > 0.6 && isFree(r, c, 2, 4)) { w = 4; h = 2; }
      else if (rand > 0.4 && isFree(r, c, 2, 2)) { w = 2; h = 2; }
      else if (rand > 0.3 && isFree(r, c, 1, 2)) { w = 2; h = 1; }
      else if (rand > 0.2 && isFree(r, c, 2, 1)) { w = 1; h = 2; }
      
      if (!isFree(r, c, h, w)) {
          w = 1; h = 1;
      }

      markTaken(r, c, h, w);

      const typeRand = Math.random();
      let type = BentoType.TEXT;
      let title = "Text Card";
      let content = "Descripción corta.";
      // Pick random color from palette
      let bg = colors[Math.floor(Math.random() * colors.length)];

      if (typeRand > 0.8) {
          type = BentoType.IMAGE;
          title = "Image";
          content = "Visual";
          // For images, sometimes we want neutral backgrounds even if palette is colorful
          if (Math.random() > 0.5) bg = "#2e3250";
      } else if (typeRand > 0.6) {
          type = BentoType.STAT;
          title = "Data";
          content = Math.floor(Math.random() * 100) + "k";
      }

      items.push({
        id: uuidv4(),
        x: c, // Explicit X
        y: r, // Explicit Y
        colSpan: w,
        rowSpan: h,
        title,
        content,
        type,
        backgroundColor: bg,
        textColor: getContrastColor(bg),
        locked: false
      });
    }
  }

  return items;
};