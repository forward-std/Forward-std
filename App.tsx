import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Controls } from './components/Controls';
import { GridCanvas } from './components/GridCanvas';
import { generateSvgString } from './components/SvgExporter';
import { generateBentoLayout } from './services/geminiService';
import { generateRandomGrid } from './services/randomizerService';
import { isCellOccupied, findFreeSpace, getContrastColor } from './services/layoutUtils';
import { GridConfig, BentoItem, BentoType } from './types';

// Default with brand colors
const INITIAL_CONFIG: GridConfig = {
  width: 1080,
  height: 1080,
  columns: 7, 
  rows: 7, 
  gap: 16,
  padding: 40,
  borderRadius: 24,
  palette: ['#d5ec2c', '#ba8bff', '#f7f6fc', '#191b32', '#2e3250'], 
  items: [
    {
      id: '1',
      x: 0, y: 0,
      colSpan: 4,
      rowSpan: 4,
      title: "Bento Grid",
      content: "La herramienta definitiva para diseñadores.",
      type: BentoType.TEXT,
      backgroundColor: "#191b32",
      textColor: "#f7f6fc"
    },
    {
      id: '2',
      x: 4, y: 0,
      colSpan: 3,
      rowSpan: 4,
      title: "Export",
      content: "SVG Ready",
      type: BentoType.IMAGE,
      backgroundColor: "#2e3250",
      textColor: "#f7f6fc"
    },
    {
      id: '3',
      x: 0, y: 4,
      colSpan: 2,
      rowSpan: 3,
      title: "Usuarios",
      content: "+12k",
      type: BentoType.STAT,
      backgroundColor: "#d5ec2c", 
      textColor: "#191b32"
    },
    {
      id: '4',
      x: 2, y: 4,
      colSpan: 2,
      rowSpan: 3,
      title: "Herramienta",
      content: "uso simple",
      type: BentoType.TEXT,
      backgroundColor: "#ba8bff",
      textColor: "#191b32"
    },
     {
      id: '5',
      x: 4, y: 4,
      colSpan: 3,
      rowSpan: 3,
      title: "Integración",
      content: "Layouts rápidos.",
      type: BentoType.TEXT,
      backgroundColor: "#f7f6fc",
      textColor: "#191b32"
    },
  ]
};

const App: React.FC = () => {
  const [config, setConfig] = useState<GridConfig>(INITIAL_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // Now supports multiple sub-item selection
  const [selectedSubItemIds, setSelectedSubItemIds] = useState<string[]>([]); 
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle Keyboard Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
        
        if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
            if (activeParentId && selectedSubItemIds.length > 0) {
                // Delete Selected Sub Items
                const parent = config.items.find(i => i.id === activeParentId);
                if (parent && parent.subItems) {
                    const newSubItems = parent.subItems.filter(s => !selectedSubItemIds.includes(s.id));
                    updateItem(activeParentId, { subItems: newSubItems });
                    setSelectedSubItemIds([]);
                    setToastMessage("Sub-elementos eliminados");
                }
            } else if (selectedItemIds.length > 0) {
                // Delete Main Items
                setConfig(prev => ({
                    ...prev,
                    items: prev.items.filter(i => !selectedItemIds.includes(i.id))
                }));
                setSelectedItemIds([]);
                setToastMessage("Elemento(s) eliminado(s)");
            }
            setTimeout(() => setToastMessage(null), 2000);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIds, selectedSubItemIds, activeParentId, config.items]);

  const handleAiGenerate = async (prompt: string, imageBase64?: string) => {
    setIsGenerating(true);
    setSelectedItemIds([]);
    setSelectedSubItemIds([]);
    setActiveParentId(null);
    try {
      const aiItems = await generateBentoLayout(prompt, config.columns, imageBase64);
      
      const newItems: BentoItem[] = [];
      const gridMap = Array(config.rows).fill(null).map(() => Array(config.columns).fill(false));

      aiItems.forEach(item => {
        let found = false;
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.columns; c++) {
                if (c + item.colSpan > config.columns || r + item.rowSpan > config.rows) continue;
                
                let free = true;
                for (let i = 0; i < item.rowSpan; i++) {
                    for (let j = 0; j < item.colSpan; j++) {
                        if (gridMap[r+i][c+j]) free = false;
                    }
                }
                
                if (free) {
                     for (let i = 0; i < item.rowSpan; i++) {
                        for (let j = 0; j < item.colSpan; j++) {
                            gridMap[r+i][c+j] = true;
                        }
                    }
                    newItems.push({
                        id: uuidv4(),
                        x: c,
                        y: r,
                        colSpan: item.colSpan,
                        rowSpan: item.rowSpan,
                        title: item.title,
                        content: item.content,
                        type: item.type as BentoType,
                        backgroundColor: item.colorTheme,
                        textColor: getContrastColor(item.colorTheme),
                        locked: false
                    });
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
      });

      setConfig(prev => ({
        ...prev,
        items: newItems
      }));
    } catch (error) {
      console.error(error);
      setToastMessage("Error al generar el grid. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomize = () => {
    const randomItems = generateRandomGrid(config.rows, config.columns, config.palette);
    setConfig(prev => ({
        ...prev,
        items: randomItems
    }));
    setSelectedItemIds([]);
    setSelectedSubItemIds([]);
    setActiveParentId(null);
  };

  const updateItem = (id: string, updates: Partial<BentoItem>) => {
    setConfig(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  // UPDATE SUB-ITEM (Supports batch update if needed, but usually one by one via controls)
  const updateSubItem = (parentId: string, subItemId: string, updates: Partial<BentoItem>) => {
      setConfig(prev => {
          const parent = prev.items.find(i => i.id === parentId);
          if (!parent || !parent.subItems) return prev;

          const updatedSubItems = parent.subItems.map(s => 
              s.id === subItemId ? { ...s, ...updates } : s
          );

          return {
              ...prev,
              items: prev.items.map(item => item.id === parentId ? { ...item, subItems: updatedSubItems } : item)
          };
      });
  };

  const handleCreateSubGrid = (id: string) => {
      const parent = config.items.find(i => i.id === id);
      if (!parent) return;

      const subRows = 2;
      const subColumns = 2;

      // Create initial items
      const subItems: BentoItem[] = [];
      const palette = config.palette.length ? config.palette : ['#333', '#444'];
      
      for(let r=0; r<subRows; r++) {
          for(let c=0; c<subColumns; c++) {
              const bg = palette[Math.floor(Math.random() * palette.length)];
              subItems.push({
                id: uuidv4(),
                x: c,
                y: r,
                colSpan: 1,
                rowSpan: 1,
                title: "Sub",
                content: "",
                type: BentoType.TEXT,
                backgroundColor: bg,
                textColor: getContrastColor(bg)
              });
          }
      }

      updateItem(id, { subItems, subRows, subColumns });
  };

  const handleRandomizeSubGrid = (parentId: string) => {
      const parent = config.items.find(i => i.id === parentId);
      if (!parent) return;

      const rows = parent.subRows || 2;
      const cols = parent.subColumns || 2;
      
      // Use existing palette or default
      const palette = config.palette.length ? config.palette : undefined;
      
      const newSubItems = generateRandomGrid(rows, cols, palette);
      updateItem(parentId, { subItems: newSubItems });
  };

  // ADD SUB ITEM AT SPECIFIC POSITION (Click on empty space)
  const handleAddSubItemAtPosition = (parentId: string, x: number, y: number) => {
      const parent = config.items.find(i => i.id === parentId);
      if (!parent || !parent.subItems) return;

      if (isCellOccupied(x, y, parent.subItems)) {
          // Already occupied
          return;
      }

      const paletteToUse = config.palette.length > 0 ? config.palette : ['#333', '#444'];
      const randomColor = paletteToUse[Math.floor(Math.random() * paletteToUse.length)];

      const newItem: BentoItem = {
          id: uuidv4(),
          x,
          y,
          colSpan: 1,
          rowSpan: 1,
          title: "New",
          content: "",
          type: BentoType.TEXT,
          backgroundColor: randomColor,
          textColor: getContrastColor(randomColor)
      };

      updateItem(parentId, { subItems: [...parent.subItems, newItem] });
      setSelectedSubItemIds([newItem.id]);
      setActiveParentId(parentId);
  };

  const handleRemoveSubGrid = (id: string) => {
      updateItem(id, { subItems: undefined, subRows: undefined, subColumns: undefined });
      setSelectedSubItemIds([]);
      setActiveParentId(null);
  };

  // MERGE SUB ITEMS
  const handleMergeSubItems = () => {
      if (!activeParentId || selectedSubItemIds.length < 2) return;
      
      const parent = config.items.find(i => i.id === activeParentId);
      if (!parent || !parent.subItems) return;

      const itemsToMerge = parent.subItems.filter(i => selectedSubItemIds.includes(i.id));
      
      const minX = Math.min(...itemsToMerge.map(i => i.x));
      const minY = Math.min(...itemsToMerge.map(i => i.y));
      const maxX = Math.max(...itemsToMerge.map(i => i.x + i.colSpan));
      const maxY = Math.max(...itemsToMerge.map(i => i.y + i.rowSpan));

      const newColSpan = maxX - minX;
      const newRowSpan = maxY - minY;

      const remainingItems = parent.subItems.filter(i => !selectedSubItemIds.includes(i.id));

      const newItem: BentoItem = {
          id: uuidv4(),
          x: minX,
          y: minY,
          colSpan: newColSpan,
          rowSpan: newRowSpan,
          title: "Merged",
          content: "Group",
          type: BentoType.TEXT,
          backgroundColor: itemsToMerge[0].backgroundColor,
          textColor: itemsToMerge[0].textColor,
      };

      updateItem(activeParentId, { subItems: [...remainingItems, newItem] });
      setSelectedSubItemIds([newItem.id]);
  };

  const handleAddAtPosition = (x: number, y: number) => {
    let w = 2;
    let h = 2;
    if (x + w > config.columns) w = 1;
    if (y + h > config.rows) h = 1;

    let fits = true;
    for(let i=0; i<w; i++){
        for(let j=0; j<h; j++){
            if(isCellOccupied(x+i, y+j, config.items)) fits = false;
        }
    }
    
    if (!fits) {
        w = 1; h = 1;
        if (isCellOccupied(x, y, config.items)) {
            setToastMessage("Espacio ocupado");
            return;
        }
    }

    const paletteToUse = config.palette.length > 0 ? config.palette : ['#191b32', '#2e3250', '#ba8bff', '#d5ec2c'];
    const randomColor = paletteToUse[Math.floor(Math.random() * paletteToUse.length)];

    const types = [BentoType.TEXT, BentoType.STAT, BentoType.IMAGE];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const newItem: BentoItem = {
      id: uuidv4(),
      x, y,
      colSpan: w,
      rowSpan: h,
      title: "Title",
      content: "Content",
      type: randomType,
      backgroundColor: randomColor,
      textColor: getContrastColor(randomColor),
      locked: false
    };

    setConfig(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setSelectedItemIds([newItem.id]);
    
    // Clear sub selection when adding new main item
    setSelectedSubItemIds([]);
    setActiveParentId(null);
  };

  const handleAddItem = () => {
    const pos = findFreeSpace(2, 2, config.items, config.columns, config.rows);
    if (pos) {
        handleAddAtPosition(pos.x, pos.y);
    } else {
        const pos1x1 = findFreeSpace(1, 1, config.items, config.columns, config.rows);
        if (pos1x1) handleAddAtPosition(pos1x1.x, pos1x1.y);
        else setToastMessage("Grid lleno!");
    }
  };

  const handleDeleteItem = (id: string) => {
    setConfig(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    setSelectedItemIds(prev => prev.filter(pid => pid !== id));
    // Clear sub if deleted parent
    if (activeParentId === id) {
        setActiveParentId(null);
        setSelectedSubItemIds([]);
    }
  };

  const handleMergeItems = () => {
      if (selectedItemIds.length < 2) return;
      
      const itemsToMerge = config.items.filter(i => selectedItemIds.includes(i.id));
      const minX = Math.min(...itemsToMerge.map(i => i.x));
      const minY = Math.min(...itemsToMerge.map(i => i.y));
      const maxX = Math.max(...itemsToMerge.map(i => i.x + i.colSpan));
      const maxY = Math.max(...itemsToMerge.map(i => i.y + i.rowSpan));

      const newColSpan = maxX - minX;
      const newRowSpan = maxY - minY;

      const remainingItems = config.items.filter(i => !selectedItemIds.includes(i.id));

      const newItem: BentoItem = {
          id: uuidv4(),
          x: minX,
          y: minY,
          colSpan: newColSpan,
          rowSpan: newRowSpan,
          title: "Merged Item",
          content: "Contenido fusionado",
          type: BentoType.TEXT,
          backgroundColor: itemsToMerge[0].backgroundColor,
          textColor: itemsToMerge[0].textColor,
          locked: false
      };

      setConfig(prev => ({ ...prev, items: [...remainingItems, newItem] }));
      setSelectedItemIds([newItem.id]);
      setSelectedSubItemIds([]);
      setActiveParentId(null);
  };

  const handleSelect = (id: string | null, multiSelect: boolean = false) => {
      if (id === null) {
          setSelectedItemIds([]);
          setSelectedSubItemIds([]);
          setActiveParentId(null);
          return;
      }

      setSelectedItemIds(prev => {
          if (multiSelect) {
              if (prev.includes(id)) return prev.filter(pid => pid !== id);
              return [...prev, id];
          }
          return [id];
      });
      
      // If we select a main item, we clear sub-item selection UNLESS we are already editing that parent?
      // Actually simpler: Single click on main item selects it. 
      // Further clicks inside will be handled by sub-item selection logic.
      if (!selectedItemIds.includes(id)) {
          setSelectedSubItemIds([]);
          setActiveParentId(null);
      }
  };

  const handleSelectSubItem = (parentId: string, subItemId: string | null, multiSelect: boolean = false) => {
      setActiveParentId(parentId);
      // Ensure parent is selected as well conceptually (or just tracked via activeParentId)
      
      if (subItemId === null) {
          setSelectedSubItemIds([]);
          return;
      }

      setSelectedSubItemIds(prev => {
           if (multiSelect) {
               if (prev.includes(subItemId)) return prev.filter(id => id !== subItemId);
               return [...prev, subItemId];
           }
           return [subItemId];
      });
  };

  const handleExport = async (target: 'figma' | 'illustrator_1' | 'illustrator_3') => {
    try {
        const svgString = generateSvgString(config, config.width, false, true, true, true);
        
        // Ensure XMLNS is present for standard parsing
        const finalSvg = svgString.includes('xmlns="http://www.w3.org/2000/svg"') 
            ? svgString 
            : svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

        // --- FIGMA MODE ---
        if (target === 'figma') {
            const textBlob = new Blob([finalSvg], { type: 'text/plain' });
            await navigator.clipboard.write([
                new ClipboardItem({ 'text/plain': textBlob })
            ]);
            setToastMessage("Figma: Copiado (Arial Nativo)");
        }

        // --- ILLUSTRATOR OPTION A (Text) ---
        else if (target === 'illustrator_1') {
             await navigator.clipboard.writeText(finalSvg);
             setToastMessage("Ai (A): Copiado como Texto");
        }

        // --- ILLUSTRATOR OPTION B (Blob) ---
        else if (target === 'illustrator_3') {
             const blob = new Blob([finalSvg], { type: 'text/plain' });
             await navigator.clipboard.write([
                 new ClipboardItem({ 'text/plain': blob })
             ]);
             setToastMessage("Ai (B): Copiado como Blob");
        }

    } catch (err) {
        console.error("Clipboard error", err);
        setToastMessage("Error: Tu navegador bloqueó la acción.");
    }
    
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex h-screen w-screen bg-[#191b32] text-[#f7f6fc] font-inter overflow-hidden">
      <Controls 
        config={config} 
        setConfig={setConfig} 
        isGenerating={isGenerating}
        onGenerate={handleAiGenerate}
        onRandomize={handleRandomize}
        // onExport={handleExport} // Removed from Controls
        selectedItemIds={selectedItemIds}
        selectedSubItemIds={selectedSubItemIds}
        activeParentId={activeParentId}
        onSelectItem={(id) => handleSelect(id)}
        onSelectSubItem={(pid, sid) => handleSelectSubItem(pid, sid)}
        onUpdateItem={updateItem}
        onUpdateSubItem={updateSubItem}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onMergeItems={handleMergeItems}
        onMergeSubItems={handleMergeSubItems}
        onCreateSubGrid={handleCreateSubGrid}
        onRemoveSubGrid={handleRemoveSubGrid}
        onRandomizeSubGrid={handleRandomizeSubGrid}
      />
      
      {/* Canvas Wrapper - #656a82 */}
      <div className="flex-1 bg-[#656a82] relative overflow-hidden flex flex-col">
        {/* Top Info Bar - RESTORED TO #191b32 */}
        <div className="h-14 border-b border-[#2e3250] flex items-center justify-between px-6 bg-[#191b32] z-10 shrink-0">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Workspace</span>
                <span className="text-[10px] text-neutral-400">SHIFT + Click para selección múltiple</span>
            </div>

            <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mr-1">
                    Copiar a:
                 </span>
                
                <button
                    onClick={() => handleExport('figma')}
                    className="flex items-center gap-2 bg-[#15172b] hover:bg-[#2e3250] text-white px-3 py-1.5 rounded-md text-xs font-semibold border border-[#2e3250] transition-colors"
                >
                     <svg className="w-3 h-3" viewBox="0 0 15 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.75 22C5.82107 22 7.5 20.3211 7.5 18.25V14.5H3.75C1.67893 14.5 0 16.1789 0 18.25C0 20.3211 1.67893 22 3.75 22Z" fill="#0ACF83"/><path d="M0 10.75C0 8.67893 1.67893 7 3.75 7H7.5V14.5H3.75C1.67893 14.5 0 12.8211 0 10.75Z" fill="#A259FF"/><path d="M3.75 0C1.67893 0 0 1.67893 0 3.75C0 5.82107 1.67893 7.5 3.75 7.5H7.5V0H3.75Z" fill="#F24E1E"/><path d="M11.25 0H7.5V7.5H11.25C13.3211 7.5 15 5.82107 15 3.75C15 1.67893 13.3211 0 11.25 0Z" fill="#FF7262"/><path d="M15 10.75C15 12.8211 13.3211 14.5 11.25 14.5C9.17893 14.5 7.5 12.8211 7.5 10.75C7.5 8.67893 9.17893 7 11.25 7C13.3211 7 15 8.67893 15 10.75Z" fill="#1ABCFE"/></svg>
                    Figma
                </button>

                <button
                    onClick={() => handleExport('illustrator_1')}
                    className="flex items-center gap-2 bg-[#ba8bff]/10 hover:bg-[#ba8bff]/20 text-[#ba8bff] px-3 py-1.5 rounded-md text-xs font-semibold border border-[#ba8bff]/30 transition-colors"
                >
                     <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M24 0H0V24H24V0ZM8.6 15.6L12.4 5.3H14.9L18.7 15.6H16.2L15.3 12.9H12L11.1 15.6H8.6ZM12.7 11H14.6L13.7 8L12.7 11ZM6.3 15.6H4.2V8.4H6.3V15.6ZM6.3 6.9H4.2V5.3H6.3V6.9Z" /></svg>
                    SVG (Illustrator)
                </button>
            </div>
        </div>

        <GridCanvas 
            config={config} 
            onItemUpdate={updateItem}
            onSubItemUpdate={updateSubItem}
            selectedItemIds={selectedItemIds}
            selectedSubItemIds={selectedSubItemIds}
            activeParentId={activeParentId}
            onSelect={handleSelect}
            onSelectSubItem={handleSelectSubItem}
            onAddAt={handleAddAtPosition}
            onAddSubItemAt={handleAddSubItemAtPosition}
            zoom={100} 
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#d5ec2c] text-[#191b32] px-6 py-3 rounded-full font-medium shadow-2xl animate-bounce z-50 pointer-events-none text-center min-w-[300px]">
              {toastMessage}
          </div>
      )}
    </div>
  );
};

export default App;