import React, { useRef, useEffect, useState } from 'react';
import { GridConfig, BentoItem, BentoType } from '../types';

interface GridCanvasProps {
  config: GridConfig;
  onItemUpdate: (id: string, updates: Partial<BentoItem>) => void;
  onSubItemUpdate: (parentId: string, subItemId: string, updates: Partial<BentoItem>) => void;
  selectedItemIds: string[];
  selectedSubItemIds: string[];
  activeParentId: string | null;
  onSelect: (id: string, multiSelect: boolean) => void;
  onSelectSubItem: (parentId: string, subItemId: string | null, multiSelect: boolean) => void;
  onAddAt: (x: number, y: number) => void;
  onAddSubItemAt: (parentId: string, x: number, y: number) => void;
  zoom: number;
}

// Helper to calculate responsive classes based on item dimensions
const getTextClasses = (colSpan: number, rowSpan: number, type: BentoType, isSubItem: boolean = false) => {
  const minDim = Math.min(colSpan, rowSpan);
  const area = colSpan * rowSpan;
  
  if (isSubItem) {
      if (type === BentoType.STAT) {
          return {
              title: 'text-2xl font-bold leading-none',
              content: 'text-[8px] uppercase tracking-wider opacity-60'
          };
      }
      return {
          title: 'text-xs font-bold leading-tight',
          content: 'text-[8px] leading-snug opacity-70'
      };
  }

  // STATS (Numbers usually)
  if (type === BentoType.STAT) {
      if (minDim === 1) return { 
          title: 'text-4xl font-bold tracking-tighter leading-none', 
          content: 'text-[10px] font-bold uppercase tracking-widest opacity-60' 
      };
      if (area <= 4) return { 
          title: 'text-6xl font-bold tracking-tighter leading-none', 
          content: 'text-xs font-bold uppercase tracking-widest opacity-60' 
      };
      return { 
          title: 'text-8xl font-bold tracking-tighter leading-none', 
          content: 'text-sm font-bold uppercase tracking-widest opacity-60' 
      };
  }

  // STANDARD TEXT / IMAGES
  if (area === 1) {
      return { 
          title: 'text-sm font-bold leading-tight tracking-tight', 
          content: 'text-[10px] leading-snug opacity-70 line-clamp-3' 
      };
  }
  
  if (area === 2 || (minDim === 1 && area <= 3)) {
      return { 
          title: 'text-lg font-bold leading-tight tracking-tight', 
          content: 'text-xs leading-snug opacity-70 line-clamp-4' 
      };
  }

  if (area <= 6) {
      return { 
          title: 'text-3xl font-bold leading-none tracking-tight mb-2', 
          content: 'text-sm leading-relaxed opacity-80' 
      };
  }

  return { 
      title: 'text-5xl font-bold leading-none tracking-tight mb-4', 
      content: 'text-lg leading-relaxed opacity-80 max-w-[80%]' 
  };
};

export const GridCanvas: React.FC<GridCanvasProps> = ({ 
    config, onItemUpdate, onSubItemUpdate, selectedItemIds, selectedSubItemIds, activeParentId,
    onSelect, onSelectSubItem, onAddAt, onAddSubItemAt 
}) => {
  const { columns, rows, gap, padding, borderRadius, items, width, height } = config;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  // Resizing state
  const [resizing, setResizing] = useState<{id: string, parentId: string | null, startX: number, startY: number, startColSpan: number, startRowSpan: number} | null>(null);

  // Auto-fit logic
  useEffect(() => {
    const calculateScale = () => {
        if (!containerRef.current) return;
        const parent = containerRef.current.parentElement;
        if (!parent) return;
        const margin = 80;
        const scaleX = (parent.clientWidth - margin) / width;
        const scaleY = (parent.clientHeight - margin) / height;
        setScale(Math.min(scaleX, scaleY, 1));
    };
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [width, height]);

  // Handle Background Click (Add Item)
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const clickX = e.nativeEvent.offsetX;
    const clickY = e.nativeEvent.offsetY;

    const gridX = clickX - padding;
    const gridY = clickY - padding;

    if (gridX < 0 || gridY < 0) return;

    const totalGapW = (columns - 1) * gap;
    const availableW = width - (padding * 2) - totalGapW;
    const cellW = availableW / columns;

    const totalGapH = (rows - 1) * gap;
    const availableH = height - (padding * 2) - totalGapH;
    const cellH = availableH / rows;

    const colIndex = Math.floor(gridX / (cellW + gap));
    const rowIndex = Math.floor(gridY / (cellH + gap));

    if (colIndex >= 0 && colIndex < columns && rowIndex >= 0 && rowIndex < rows) {
        onAddAt(colIndex, rowIndex);
    }
  };

  // RESIZING LOGIC
  const handleMouseDown = (e: React.MouseEvent, item: BentoItem, parentId: string | null = null) => {
    e.stopPropagation();
    if (item.locked) return;
    setResizing({
        id: item.id,
        parentId,
        startX: e.clientX,
        startY: e.clientY,
        startColSpan: item.colSpan,
        startRowSpan: item.rowSpan
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!resizing) return;
        
        let currentConfigCols = columns;
        let currentConfigRows = rows;
        let currentConfigGap = gap;
        let currentContainerW = width - (padding * 2);
        let currentContainerH = height - (padding * 2);
        let currentItems = items;

        if (resizing.parentId) {
            const parent = items.find(i => i.id === resizing.parentId);
            if (!parent) return;
            
            currentConfigCols = parent.subColumns || 2;
            currentConfigRows = parent.subRows || 2;
            currentConfigGap = gap / 2;
            
            const mainTotalGapW = (columns - 1) * gap;
            const mainCellW = (width - (padding * 2) - mainTotalGapW) / columns;
            const mainTotalGapH = (rows - 1) * gap;
            const mainCellH = (height - (padding * 2) - mainTotalGapH) / rows;
            
            const parentW = (parent.colSpan * mainCellW) + ((parent.colSpan - 1) * gap);
            const parentH = (parent.rowSpan * mainCellH) + ((parent.rowSpan - 1) * gap);
            
            currentContainerW = parentW;
            currentContainerH = parentH;
            currentItems = parent.subItems || [];
        }

        const totalGapW = (currentConfigCols - 1) * currentConfigGap;
        const cellWidth = (currentContainerW - totalGapW) / currentConfigCols;
        
        const totalGapH = (currentConfigRows - 1) * currentConfigGap;
        const cellHeight = (currentContainerH - totalGapH) / currentConfigRows;
        
        const scaledCellWidth = cellWidth * scale;
        const scaledCellHeight = cellHeight * scale;

        const deltaX = e.clientX - resizing.startX;
        const deltaY = e.clientY - resizing.startY;

        const colsChanged = Math.round(deltaX / (scaledCellWidth + (currentConfigGap*scale)));
        const rowsChanged = Math.round(deltaY / (scaledCellHeight + (currentConfigGap*scale)));

        const newColSpan = Math.max(1, Math.min(resizing.startColSpan + colsChanged, currentConfigCols));
        const newRowSpan = Math.max(1, Math.min(resizing.startRowSpan + rowsChanged, currentConfigRows));

        // COLLISION CHECK
        const currentItem = currentItems.find(i => i.id === resizing.id);
        if (!currentItem) return;

        const startX = currentItem.x;
        const startY = currentItem.y;

        let hasCollision = false;

        for (let x = startX; x < startX + newColSpan; x++) {
            for (let y = startY; y < startY + newRowSpan; y++) {
                if (x >= currentConfigCols || y >= currentConfigRows) {
                    hasCollision = true;
                    break;
                }

                const occupiedBy = currentItems.find(i => 
                    i.id !== resizing.id && 
                    x >= i.x && x < i.x + i.colSpan && 
                    y >= i.y && y < i.y + i.rowSpan
                );

                if (occupiedBy) {
                    hasCollision = true;
                    break;
                }
            }
            if (hasCollision) break;
        }

        if (!hasCollision) {
            if (resizing.parentId) {
                onSubItemUpdate(resizing.parentId, resizing.id, { colSpan: newColSpan, rowSpan: newRowSpan });
            } else {
                onItemUpdate(resizing.id, { colSpan: newColSpan, rowSpan: newRowSpan });
            }
        }
    };
    const handleMouseUp = () => setResizing(null);
    if (resizing) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, scale, width, height, columns, rows, gap, padding, onItemUpdate, onSubItemUpdate, items]);

  const gridCells = Array(rows * columns).fill(0);

  // Sub-component for rendering inner items
  const renderItemContent = (item: BentoItem, isParentSelected: boolean) => {
      const hasSubItems = item.subItems && item.subItems.length > 0;
      
      // If it has subItems, render nested grid
      if (hasSubItems) {
          const sRows = item.subRows || 2;
          const sCols = item.subColumns || 2;
          const subGap = gap / 2;
          
          return (
              <div 
                  className="w-full h-full relative cursor-crosshair"
                  style={{ padding: item.innerPadding ? `${item.innerPadding}px` : undefined }} // APPLY PADDING
                  onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const clickY = e.clientY - rect.top;
                      
                      const cellW = (rect.width - ((sCols - 1) * subGap * scale)) / sCols;
                      const cellH = (rect.height - ((sRows - 1) * subGap * scale)) / sRows;
                      
                      const subCol = Math.floor(clickX / (cellW + (subGap * scale)));
                      const subRow = Math.floor(clickY / (cellH + (subGap * scale)));

                      if(subCol >= 0 && subCol < sCols && subRow >= 0 && subRow < sRows) {
                          onAddSubItemAt(item.id, subCol, subRow);
                      }
                  }}
              >
                   {/* Sub Grid Visual Guide (Subtle) */}
                   <div 
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${sCols}, 1fr)`,
                            gridTemplateRows: `repeat(${sRows}, 1fr)`,
                            gap: `${subGap}px`
                        }}
                    >
                        {Array(sRows * sCols).fill(0).map((_, i) => (
                             <div key={i} className="border border-white rounded-[2px]" />
                        ))}
                    </div>

                  {/* Render Sub Items */}
                  <div 
                    className="absolute inset-0"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${sCols}, 1fr)`,
                        gridTemplateRows: `repeat(${sRows}, 1fr)`,
                        gap: `${subGap}px`,
                        pointerEvents: 'none' 
                    }}
                  >
                        {item.subItems!.map((sub) => {
                            const isSubSelected = selectedSubItemIds.includes(sub.id);
                            const subTextClasses = getTextClasses(sub.colSpan, sub.rowSpan, sub.type, true);
                            const isSubResizing = resizing?.id === sub.id;

                            // Check if circle (only if square)
                            const isSubSquare = sub.colSpan === sub.rowSpan;
                            const isSubCircle = sub.variant === 'circle' && isSubSquare;
                            const subRadius = isSubCircle ? '9999px' : `${borderRadius/2}px`;
                            const alignClasses = isSubCircle ? 'items-center text-center justify-center' : 'justify-between';

                            return (
                                <div 
                                    key={sub.id}
                                    style={{
                                        gridColumnStart: sub.x + 1,
                                        gridColumnEnd: `span ${sub.colSpan}`,
                                        gridRowStart: sub.y + 1,
                                        gridRowEnd: `span ${sub.rowSpan}`,
                                        padding: sub.innerPadding // APPLY PADDING to cell container
                                    }}
                                    className={`pointer-events-auto relative`}
                                >
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectSubItem(item.id, sub.id, e.shiftKey);
                                        }}
                                        className={`flex flex-col p-3 overflow-hidden ${alignClasses} transition-all cursor-pointer w-full h-full
                                            ${isSubSelected ? 'ring-2 ring-[#d5ec2c] z-10' : 'hover:brightness-110'}
                                            ${isSubResizing ? 'transition-none opacity-80' : ''}
                                        `}
                                        style={{
                                            background: sub.backgroundColor, // Supports gradients
                                            color: sub.textColor,
                                            borderRadius: subRadius
                                        }}
                                    >
                                        {sub.type === 'stat' ? (
                                            <>
                                                <div className={`${subTextClasses.title} ${isSubCircle ? '' : 'mb-auto'}`}>{sub.title}</div>
                                                <div className={subTextClasses.content}>{sub.content}</div>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className={`${subTextClasses.title}`}>{sub.title}</h3>
                                                <p className={`${subTextClasses.content}`}>{sub.content}</p>
                                            </>
                                        )}
                                    </div>

                                     {/* Sub Item Resize Handle */}
                                    {isSubSelected && !isSubResizing && (
                                        <div 
                                            className="absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-50 group hover:bg-white/20 rounded-tl-lg pointer-events-auto"
                                            onMouseDown={(e) => handleMouseDown(e, sub, item.id)}
                                        >
                                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                  </div>
              </div>
          );
      }

      // Normal Rendering
      const textClasses = getTextClasses(item.colSpan, item.rowSpan, item.type, false);
      const isCircle = item.variant === 'circle' && item.colSpan === item.rowSpan;
      const containerClasses = isCircle 
                ? "justify-center items-center text-center" 
                : "justify-between text-left";

      return (
        <div className={`p-6 h-full flex flex-col relative z-0 pointer-events-none ${containerClasses}`}>
            {item.type === 'stat' ? (
                <>
                <div className={`${textClasses.title} break-words ${!isCircle ? 'mb-auto' : 'mb-2'}`}>{item.title}</div>
                <div className={textClasses.content}>{item.content}</div>
                </>
            ) : (
                <>
                <h3 className={`${textClasses.title} break-words`}>{item.title}</h3>
                <p className={`${textClasses.content} whitespace-pre-wrap`}>
                    {item.content}
                </p>
                </>
            )}
        </div>
      );
  };

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative bg-[#656a82]">
      <div 
        ref={containerRef}
        onClick={handleBackgroundClick}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          padding: `${padding}px`,
          boxShadow: '0 20px 50px -12px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
        className="bg-[#171717] transition-transform duration-300 ease-out shrink-0 cursor-crosshair"
      >
        {/* Grid Guidelines */}
        <div 
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: `${gap}px`,
                position: 'absolute',
                top: padding, left: padding, right: padding, bottom: padding,
                zIndex: 0,
                pointerEvents: 'none'
            }}
        >
            {gridCells.map((_, i) => (
                <div key={i} className="border border-white/10 rounded-[4px] opacity-30 hover:bg-white/5 transition-colors" />
            ))}
        </div>

        {/* Items Layer (Explicit Positioning) */}
        <div 
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: `${gap}px`,
                width: '100%',
                height: '100%',
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'none'
            }}
        >
            {items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const isResizing = resizing?.id === item.id;
            
            // Determine if circle
            const isCircle = item.variant === 'circle' && item.colSpan === item.rowSpan;
            const itemBorderRadius = isCircle ? '9999px' : `${borderRadius}px`;
            
            // If item has subItems, remove padding for the container to let subItems fill it visually
            // but keep the borderRadius
            const hasSubItems = item.subItems && item.subItems.length > 0;
            
            // PADDING LOGIC:
            // We apply the padding to the CONTAINER DIV of the grid cell
            // Then we render the background on the INNER DIV
            
            return (
                <div
                    key={item.id}
                    className={`group relative flex flex-col pointer-events-auto
                    ${isResizing ? 'transition-none opacity-80' : 'transition-all duration-300'}
                    `}
                    style={{
                        gridColumnStart: item.x + 1,
                        gridColumnEnd: `span ${item.colSpan}`,
                        gridRowStart: item.y + 1,
                        gridRowEnd: `span ${item.rowSpan}`,
                        padding: item.innerPadding, // APPLY INSET PADDING
                        zIndex: isSelected ? 20 : 1
                    }}
                >
                    {/* VISUAL CARD CONTAINER */}
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                             if (isSelected && selectedSubItemIds.length > 0) {
                                 onSelectSubItem(item.id, null, false);
                            } else {
                                 onSelect(item.id, e.shiftKey);
                            }
                        }}
                        className={`w-full h-full overflow-hidden flex flex-col relative
                         ${isSelected ? 'ring-2 ring-[#d5ec2c] shadow-2xl' : 'hover:shadow-lg hover:z-10 cursor-pointer'}
                        `}
                        style={{
                            background: item.backgroundColor, // Applied here to respect padding
                            borderRadius: itemBorderRadius,
                            color: item.textColor,
                        }}
                    >
                        {/* Lock Indicator */}
                        {item.locked && (
                             <div className="absolute top-2 right-2 text-white/20 z-10">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                             </div>
                        )}

                        {renderItemContent(item, isSelected)}
                    </div>

                    {/* Resize Handle (Outside the padding container so it's always at grid corners? No, should be attached to visual card?) 
                        Actually, resize handle should be on the GRID CELL limits, not the shrunk card. 
                        Let's put it on the outer div.
                    */}
                    {isSelected && !item.locked && selectedSubItemIds.length === 0 && (
                        <div 
                            className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center cursor-nwse-resize z-50 group hover:bg-white/10 rounded-tl-xl pointer-events-auto"
                            onMouseDown={(e) => handleMouseDown(e, item)}
                        >
                            <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                        </div>
                    )}
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};