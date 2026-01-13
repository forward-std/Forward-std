
import { BentoItem } from "../types";

// Check if a specific cell is occupied
export const isCellOccupied = (x: number, y: number, items: BentoItem[], excludeId?: string) => {
  return items.some(item => {
    if (item.id === excludeId) return false;
    return (
      x >= item.x && 
      x < item.x + item.colSpan && 
      y >= item.y && 
      y < item.y + item.rowSpan
    );
  });
};

// Check if an item collides with any other item
export const hasCollision = (item: BentoItem, allItems: BentoItem[]) => {
  for (let x = item.x; x < item.x + item.colSpan; x++) {
    for (let y = item.y; y < item.y + item.rowSpan; y++) {
      if (isCellOccupied(x, y, allItems, item.id)) return true;
    }
  }
  return false;
};

// Find the first available position for an item of size w x h
export const findFreeSpace = (w: number, h: number, items: BentoItem[], maxCols: number, maxRows: number) => {
    for (let y = 0; y < maxRows; y++) {
        for (let x = 0; x < maxCols; x++) {
            if (x + w > maxCols || y + h > maxRows) continue;
            
            let fits = true;
            // Check area
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    if (isCellOccupied(x + i, y + j, items)) {
                        fits = false;
                        break;
                    }
                }
                if (!fits) break;
            }
            
            if (fits) return { x, y };
        }
    }
    return null; 
};

// Auto-layout list (simple packer)
export const packItems = (items: Partial<BentoItem>[], maxCols: number): BentoItem[] => {
    return items as BentoItem[]; 
};

// Determine best text color (black or white) based on background brightness
export const getContrastColor = (hex: string): string => {
    if (!hex || !hex.startsWith('#')) return '#ffffff'; // Fallback
    
    let c = hex.substring(1);
    // Handle short hex like #fff
    if (c.length === 3) {
        c = c.split('').map(char => char + char).join('');
    }
    if (c.length !== 6) return '#ffffff'; // Invalid hex
    
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    
    // YIQ formula
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Threshold usually 128, but 150 often feels safer for pure black text preference
    return (yiq >= 150) ? '#000000' : '#ffffff';
};