import { GridConfig, BentoItem } from "../types";

// Helper to extract a safe HEX color. 
// Enforces Solid Colors per user request. If a gradient is passed, returns black/fallback.
const getSafeFillColor = (colorString: string): string => {
    if (!colorString) return '#000000';
    if (colorString.includes('gradient')) {
        // Try to find the first hex code in the gradient string as a fallback solid
        const hexMatch = colorString.match(/#[0-9a-fA-F]{6}/);
        if (hexMatch) return hexMatch[0];
        return '#000000'; // Default to black if it's a gradient
    }
    return colorString;
};

// Helper: Split text into lines based on approx character count
const wrapText = (text: string, maxCharsPerLine: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + 1 + words[i].length <= maxCharsPerLine) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
};

export const generateSvgString = (config: GridConfig, width: number = 1200, includeHeader: boolean = false, useNativeText: boolean = false, geometryOnly: boolean = false, stripStyles: boolean = false): string => {
  const { columns, rows, gap, padding, borderRadius, items, height } = config;
  
  const totalGapWidth = (columns - 1) * gap;
  const availableWidth = config.width - (padding * 2) - totalGapWidth;
  const cellWidth = availableWidth / columns;

  const totalGapHeight = (rows - 1) * gap;
  const availableHeight = height - (padding * 2) - totalGapHeight;
  const cellHeight = availableHeight / rows;
  
  let svgContent = '';

  // --- RENDER SUB ITEMS ---
  const renderSubItemsSvg = (parentX: number, parentY: number, parentW: number, parentH: number, parentItem: BentoItem) => {
      let subSvg = '';
      const subItems = parentItem.subItems || [];
      const subCols = parentItem.subColumns || 2;
      const subRows = parentItem.subRows || 2;
      const subGap = gap / 2;
      
      const subAvailableW = parentW - ((subCols - 1) * subGap);
      const subAvailableH = parentH - ((subRows - 1) * subGap);
      
      const subCellW = subAvailableW / subCols;
      const subCellH = subAvailableH / subRows;

      subItems.forEach(sub => {
          const sx = parentX + (sub.x * (subCellW + subGap));
          const sy = parentY + (sub.y * (subCellH + subGap));
          const sw = (sub.colSpan * subCellW) + ((sub.colSpan - 1) * subGap);
          const sh = (sub.rowSpan * subCellH) + ((sub.rowSpan - 1) * subGap);
          
          const inset = sub.innerPadding || 0;
          const finalX = sx + inset;
          const finalY = sy + inset;
          const finalW = Math.max(0, sw - (inset * 2));
          const finalH = Math.max(0, sh - (inset * 2));

          const isSubSquare = sub.colSpan === sub.rowSpan;
          const isSubCircle = sub.variant === 'circle' && isSubSquare;
          const subRadius = isSubCircle ? 9999 : borderRadius/2;
          const fillColor = getSafeFillColor(sub.backgroundColor);

          subSvg += `<g transform="translate(${finalX}, ${finalY})">`;
          subSvg += `<rect width="${finalW}" height="${finalH}" rx="${subRadius}" ry="${subRadius}" fill="${fillColor}" />`;
          
          if (useNativeText) {
              const textX = isSubCircle ? finalW / 2 : 10;
              const titleY = isSubCircle ? (finalH / 2) - 10 : 15; // Start Title position
              const anchor = isSubCircle ? "middle" : "start";
              
              const titleLines = wrapText(sub.title, 10);
              const contentLines = wrapText(sub.content, 15).slice(0, 2); 

              // Render Title Group
              subSvg += `<text x="${textX}" y="${titleY}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="10px" fill="${sub.textColor}" text-anchor="${anchor}" dominant-baseline="text-before-edge">`;
              titleLines.forEach((line, i) => {
                  subSvg += `<tspan x="${textX}" dy="${i === 0 ? 0 : 11}">${line}</tspan>`;
              });
              subSvg += `</text>`;

              // Calculate Y for content based on title lines. strict separation.
              const contentStartY = titleY + (titleLines.length * 11) + 4;
              
              subSvg += `<text x="${textX}" y="${contentStartY}" font-family="Arial, Helvetica, sans-serif" font-size="8px" fill="${sub.textColor}" opacity="0.9" text-anchor="${anchor}" dominant-baseline="text-before-edge">`;
               contentLines.forEach((line, i) => {
                  subSvg += `<tspan x="${textX}" dy="${i === 0 ? 0 : 9}">${line}</tspan>`;
              });
              subSvg += `</text>`;
          }
          subSvg += `</g>`;
      });
      return subSvg;
  };

  // --- RENDER MAIN ITEMS ---
  items.forEach((item) => {
    const c = item.x;
    const r = item.y;

    const x = padding + (c * (cellWidth + gap));
    const y = padding + (r * (cellHeight + gap));
    const w = (item.colSpan * cellWidth) + ((item.colSpan - 1) * gap);
    const h = (item.rowSpan * cellHeight) + ((item.rowSpan - 1) * gap);
    
    const inset = item.innerPadding || 0;
    const finalX = x + inset;
    const finalY = y + inset;
    const finalW = Math.max(0, w - (inset * 2));
    const finalH = Math.max(0, h - (inset * 2));

    const isCircle = item.variant === 'circle' && item.colSpan === item.rowSpan;
    const itemRadius = isCircle ? 9999 : borderRadius;
    const fillColor = getSafeFillColor(item.backgroundColor);

    svgContent += `<g transform="translate(${finalX}, ${finalY})">`;
    svgContent += `<rect width="${finalW}" height="${finalH}" rx="${itemRadius}" ry="${itemRadius}" fill="${fillColor}" />`;

    let innerContent = '';

    if (item.subItems && item.subItems.length > 0) {
        innerContent = renderSubItemsSvg(0, 0, finalW, finalH, item);
    } else {
        if (useNativeText) {
             const textX = isCircle ? finalW / 2 : 24;
             const anchor = isCircle ? "middle" : "start";
             
             const isSmall = item.colSpan === 1 || item.rowSpan === 1;
             
             // FONT SIZES
             const titleSize = item.type === 'stat' ? (isSmall ? 32 : 64) : (isSmall ? 14 : 24);
             const contentSize = isSmall ? 10 : 14;
             const titleWeight = "bold";
             
             // Wrap Logic
             const maxChars = isSmall ? 12 : 25; 
             const titleLines = wrapText(item.title, maxChars);
             const contentLines = wrapText(item.content, maxChars * 1.5).slice(0, 4);

             // LAYOUT STRATEGY: ABSOLUTE Y POSITIONS
             // Title always starts at top (padding or calculated center offset)
             // Content always starts strictly AFTER title.
             
             let titleStartY = 32; // Default padding top
             
             if (item.type === 'stat' || isCircle) {
                 // For stats/circles, we center the block visually
                 const totalBlockHeight = (titleLines.length * titleSize) + 16 + (contentLines.length * contentSize * 1.2);
                 titleStartY = (finalH / 2) - (totalBlockHeight / 2) + (titleSize * 0.2); // Adjust for cap height
             }

             // Render Title
             const titleLineHeight = titleSize * 1.1;
             innerContent += `<text x="${textX}" y="${titleStartY}" font-family="Arial, Helvetica, sans-serif" font-weight="${titleWeight}" font-size="${titleSize}px" fill="${item.textColor}" text-anchor="${anchor}" dominant-baseline="text-before-edge">`;
             titleLines.forEach((line, i) => {
                 innerContent += `<tspan x="${textX}" dy="${i === 0 ? 0 : titleLineHeight}">${line}</tspan>`;
             });
             innerContent += `</text>`;

             // Render Content - STRICTLY BELOW TITLE
             // We add a gap of 16px (or less for small)
             const gapBetween = isSmall ? 8 : 16;
             const contentStartY = titleStartY + (titleLines.length * titleLineHeight) + gapBetween;
             const contentLineHeight = contentSize * 1.3;

             innerContent += `<text x="${textX}" y="${contentStartY}" font-family="Arial, Helvetica, sans-serif" font-size="${contentSize}px" fill="${item.textColor}" opacity="0.9" text-anchor="${anchor}" dominant-baseline="text-before-edge">`;
             contentLines.forEach((line, i) => {
                  innerContent += `<tspan x="${textX}" dy="${i === 0 ? 0 : contentLineHeight}">${line}</tspan>`;
             });
             innerContent += `</text>`;
        }
    }
    
    svgContent += innerContent + `</g>`;
  });

  const svgBody = `<svg width="${config.width}px" height="${config.height}px" viewBox="0 0 ${config.width} ${config.height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;

  if (includeHeader) {
      return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n${svgBody}`;
  }

  return svgBody;
};