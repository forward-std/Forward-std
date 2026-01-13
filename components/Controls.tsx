import React, { useState } from 'react';
import { GridConfig, BentoItem, BentoType } from '../types';
import { getContrastColor } from '../services/layoutUtils';

interface ControlsProps {
  config: GridConfig;
  setConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
  isGenerating: boolean;
  onGenerate: (prompt: string, imageBase64?: string) => void;
  onRandomize: () => void;
  // onExport prop removed
  selectedItemIds: string[];
  selectedSubItemIds: string[];
  activeParentId: string | null;
  onSelectItem: (id: string | null) => void; 
  onSelectSubItem: (parentId: string, subItemId: string | null) => void;
  onUpdateItem: (id: string, updates: Partial<BentoItem>) => void;
  onUpdateSubItem: (parentId: string, subItemId: string, updates: Partial<BentoItem>) => void;
  onAddItem: () => void;
  onDeleteItem: (id: string) => void;
  onMergeItems: () => void;
  onMergeSubItems: () => void;
  onCreateSubGrid: (id: string) => void; 
  onRemoveSubGrid: (id: string) => void; 
  onRandomizeSubGrid: (id: string) => void; 
}

const ASPECT_RATIOS = [
    { label: "16:9", w: 1920, h: 1080 },
    { label: "9:16", w: 1080, h: 1920 },
    { label: "4:5", w: 1080, h: 1350 },
    { label: "1:1", w: 1080, h: 1080 },
    { label: "3:4", w: 1200, h: 1600 },
];

export const Controls: React.FC<ControlsProps> = ({ 
  config, setConfig, isGenerating, onGenerate, onRandomize, 
  selectedItemIds, selectedSubItemIds, activeParentId, onSelectItem, onSelectSubItem,
  onUpdateItem, onUpdateSubItem, onAddItem, onDeleteItem,
  onMergeItems, onMergeSubItems, onCreateSubGrid, onRemoveSubGrid, onRandomizeSubGrid
}) => {
  // Local state for the "Add Color" input
  const [hexInput, setHexInput] = useState('#FFFFFF');
  
  // Single Select Mode (Main)
  const singleSelectedId = selectedItemIds.length === 1 ? selectedItemIds[0] : null;
  const parentItem = singleSelectedId ? config.items.find(i => i.id === singleSelectedId) : null;
  const isMultiSelect = selectedItemIds.length > 1;

  // Sub Item Selection Logic
  const isSubMultiSelect = selectedSubItemIds.length > 1;
  const singleSubId = selectedSubItemIds.length === 1 ? selectedSubItemIds[0] : null;
  
  // Resolve Active Item for Editing
  let activeItem: BentoItem | undefined | null = parentItem;
  let isSubItemEditing = false;

  // If we have an active parent and selected sub items, we might be editing a sub item
  if (activeParentId && config.items.find(i => i.id === activeParentId)) {
      const parent = config.items.find(i => i.id === activeParentId);
      if (parent && singleSubId && parent.subItems) {
          const subItem = parent.subItems.find(s => s.id === singleSubId);
          if (subItem) {
              activeItem = subItem;
              isSubItemEditing = true;
          }
      }
      if (isSubMultiSelect) activeItem = null;
  }

  if (!activeParentId && parentItem) {
      activeItem = parentItem;
  }
  if (activeParentId && selectedSubItemIds.length === 0) {
       activeItem = config.items.find(i => i.id === activeParentId);
  }

  const isItemSquare = activeItem ? activeItem.colSpan === activeItem.rowSpan : false;
  const hasSubGrid = parentItem && parentItem.subItems && parentItem.subItems.length > 0;

  const updateConfig = (key: keyof GridConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleAddColor = () => {
    // Validate HEX
    const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(hexInput);
    if (isValidHex && !config.palette.includes(hexInput)) {
        setConfig(prev => ({ ...prev, palette: [...prev.palette, hexInput] }));
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
      setConfig(prev => ({ ...prev, palette: prev.palette.filter(c => c !== colorToRemove) }));
  };

  const handleUpdate = (updates: Partial<BentoItem>) => {
      const finalUpdates = { ...updates };

      // Auto Contrast Logic: If background changes, update text color
      if (updates.backgroundColor) {
          finalUpdates.textColor = getContrastColor(updates.backgroundColor);
      }

      if (isSubItemEditing && activeParentId && singleSubId) {
          onUpdateSubItem(activeParentId, singleSubId, finalUpdates);
      } else if (activeItem) {
          onUpdateItem(activeItem.id, finalUpdates);
      }
  };

  return (
    <div className="w-80 h-full bg-[#191b32] border-r border-[#2e3250] flex flex-col p-6 overflow-y-auto z-20 scrollbar-hide text-[#f7f6fc]">
      
      <div className="mb-8">
        <svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4187.42 1383.57" className="w-full h-auto max-w-[200px]">
            <g id="Capa_1-2" data-name="Capa 1">
                <g>
                <path d="M0,1053.65V0h519.3c99.34,0,178.11,25.85,236.32,77.52,58.18,51.7,87.31,116.17,87.31,193.43s-26.61,136.48-79.78,177.6c-22.08,17.09-48.17,30.63-78.27,40.65v7.52c37.12,8.04,69.74,21.6,97.84,40.65,65.21,47.18,97.83,118.91,97.83,215.24,0,89.32-32.12,161.81-96.33,217.5-64.23,55.7-155.04,83.54-272.44,83.54H0ZM173.1,428.99h338.68c48.17,0,85.28-12.04,111.38-36.13,26.09-24.08,39.14-57.69,39.14-100.84,0-38.13-13.05-68.74-39.14-91.83-26.1-23.07-63.21-34.61-111.38-34.61H173.1v263.41ZM173.1,888.09h331.15c130.44,0,195.68-50.17,195.68-150.53s-65.24-150.53-195.68-150.53H173.1v301.05Z" fill="#d5ec2c"/>
                <path d="M1114.59,953.56c-75.78-76.78-113.64-171.35-113.64-283.75s37.87-206.95,113.64-283.73c75.75-76.76,168.33-115.14,277.71-115.14s201.94,38.38,277.72,115.14c75.75,76.78,113.64,171.37,113.64,283.73v52.69h-624.67c12.04,63.22,39.63,112.89,82.79,149.01,43.13,36.13,93.33,54.19,150.52,54.19,70.23,0,126.44-17.54,168.59-52.68,19.05-14.04,35.6-31.62,49.67-52.69h165.57c-21.07,49.18-47.67,90.84-79.78,124.93-82.29,82.29-183.63,123.43-304.05,123.43-109.38,0-201.96-38.38-277.71-115.14ZM1166.52,594.57h451.57c-9.03-50.17-32.88-92.82-71.5-127.96-38.64-35.12-90.07-52.68-154.28-52.68-54.18,0-102.35,16.31-144.5,48.93-42.15,32.61-69.24,76.53-81.28,131.71Z" fill="#d5ec2c"/>
                <path d="M1919.1,1053.65V286h158.04v105.35h7.53c12.04-20.05,30.6-40.11,55.69-60.19,54.19-40.13,115.9-60.21,185.14-60.21,95.33,0,169.34,27.6,222.02,82.78,52.68,55.2,79.02,135.47,79.02,240.84v459.08h-158.04v-444.03c0-67.22-14.82-116.65-44.41-148.27-29.61-31.6-75.02-47.41-136.22-47.41s-111.64,20.84-151.27,62.46c-39.65,41.66-59.45,96.1-59.45,163.33v413.92h-158.04Z" fill="#d5ec2c"/>
                <path d="M2739.43,428.99v-142.99h90.32V120.42h158.04v165.58h233.31v142.99h-233.31v481.67h240.83v142.99h-398.88V428.99h-90.32Z" fill="#d5ec2c"/>
                <path d="M3434.09,953.56c-76.77-76.78-115.15-171.35-115.15-283.75s38.38-206.95,115.15-283.73c76.77-76.76,171.34-115.14,283.73-115.14s206.97,38.38,283.74,115.14c76.77,76.78,115.15,171.37,115.15,283.73s-38.38,206.97-115.15,283.75c-76.77,76.76-171.36,115.14-283.74,115.14s-206.96-38.38-283.73-115.14ZM3549.24,483.94c-43.16,46.65-64.73,108.63-64.73,185.88s21.57,139.24,64.73,185.9c43.13,46.67,99.35,70,168.58,70s125.43-23.33,168.59-70c43.13-46.65,64.73-108.6,64.73-185.9s-21.6-139.22-64.73-185.88c-43.16-46.67-99.35-70-168.59-70s-125.45,23.33-168.58,70Z" fill="#d5ec2c"/>
                </g>
                <g>
                <g>
                    <g>
                    <path d="M3195.69,1336.54v-176.71h123.7v27.77h-94.67v50.49h74.47v27.77h-74.47v70.68h-29.03Z" fill="#b77df3"/>
                    <path d="M3338.84,1319.75c-12.87-12.87-19.31-28.73-19.31-47.59s6.44-34.71,19.31-47.59c12.88-12.87,28.74-19.31,47.59-19.31s34.71,6.44,47.59,19.31c12.88,12.87,19.31,28.74,19.31,47.59s-6.44,34.71-19.31,47.59c-12.87,12.87-28.74,19.31-47.59,19.31s-34.71-6.44-47.59-19.31ZM3358.15,1240.99c-7.24,7.83-10.86,18.22-10.86,31.18s3.62,23.35,10.86,31.18c7.23,7.83,16.66,11.74,28.27,11.74s21.04-3.91,28.27-11.74c7.23-7.83,10.86-18.21,10.86-31.18s-3.62-23.35-10.86-31.18c-7.24-7.83-16.66-11.74-28.27-11.74s-21.04,3.91-28.27,11.74Z" fill="#b77df3"/>
                    <path d="M3471.83,1336.54v-128.75h26.51v18.93h1.26c1.85-3.53,4.54-6.9,8.08-10.1,7.74-6.73,16.83-10.1,27.26-10.1h15.15v25.24h-16.41c-10.27,0-18.72,3.24-25.37,9.72-6.65,6.48-9.97,15.02-9.97,25.62v69.42h-26.51Z" fill="#b77df3"/>
                    <path d="M3558.92,1207.79h27.77l21.46,104.76h3.79l21.46-104.76h37.86l21.46,104.76h3.79l21.46-104.76h27.77l-27.77,128.75h-45.44l-18.93-98.45h-2.52l-18.94,98.45h-45.44l-27.77-128.75Z" fill="#b77df3"/>
                    <path d="M3769.45,1320.51c-11.53-12.37-17.29-28.48-17.29-48.34s5.76-35.97,17.29-48.34c11.52-12.37,25.96-18.55,43.29-18.55,10.94,0,20.95,3.2,30.04,9.59,3.87,2.69,7.32,5.81,10.35,9.34h1.26v-16.41h26.51v128.75h-26.51v-17.67h-1.26c-2.53,3.53-5.98,6.9-10.35,10.1-9.09,6.73-19.1,10.1-30.04,10.1-17.33,0-31.77-6.18-43.29-18.55ZM3790.03,1240.36c-6.73,7.41-10.1,18.01-10.1,31.81s3.37,24.4,10.1,31.81c6.73,7.41,15.99,11.11,27.77,11.11,11.11,0,19.98-3.74,26.63-11.23,6.65-7.49,9.97-18.05,9.97-31.68s-3.32-24.19-9.97-31.68c-6.65-7.49-15.52-11.23-26.63-11.23-11.78,0-21.04,3.7-27.77,11.11Z" fill="#b77df3"/>
                    <path d="M3906.83,1336.54v-128.75h26.51v18.93h1.26c1.85-3.53,4.54-6.9,8.08-10.1,7.74-6.73,16.83-10.1,27.26-10.1h15.15v25.24h-16.41c-10.27,0-18.72,3.24-25.37,9.72-6.65,6.48-9.97,15.02-9.97,25.62v69.42h-26.51Z" fill="#b77df3"/>
                    <path d="M4007.63,1320.51c-11.53-12.37-17.29-28.48-17.29-48.34s5.76-35.97,17.29-48.34c11.52-12.37,25.96-18.55,43.29-18.55,10.94,0,20.95,3.2,30.04,9.59,3.87,2.69,7.32,5.81,10.35,9.34h1.26v-64.37h26.51v176.71h-26.51v-16.41h-1.26c-2.86,3.53-6.31,6.73-10.35,9.59-8.92,6.23-18.93,9.34-30.04,9.34-17.33,0-31.77-6.18-43.29-18.55ZM4028.2,1240.36c-6.73,7.41-10.1,18.01-10.1,31.81s3.37,24.4,10.1,31.81c6.73,7.41,15.99,11.11,27.77,11.11,11.11,0,19.98-3.74,26.63-11.23,6.65-7.49,9.97-18.05,9.97-31.68s-3.32-24.19-9.97-31.68c-6.65-7.49-15.52-11.23-26.63-11.23-11.78,0-21.04,3.7-27.77,11.11Z" fill="#b77df3"/>
                    </g>
                    <path d="M4150.19,1197.01c-4.11-4.14-6.17-9.3-6.17-15.49s2.06-11.35,6.17-15.49c4.11-4.14,9.29-6.21,15.53-6.21s11.42,2.07,15.53,6.21c4.11,4.14,6.17,9.31,6.17,15.49s-2.06,11.35-6.17,15.49c-4.11,4.14-9.29,6.21-15.53,6.21s-11.42-2.07-15.53-6.21ZM4152.95,1168.81c-3.4,3.43-5.11,7.67-5.11,12.72s1.7,9.29,5.11,12.72c3.4,3.43,7.66,5.15,12.76,5.15s9.36-1.71,12.76-5.15c3.41-3.43,5.11-7.67,5.11-12.72s-1.7-9.29-5.11-12.72c-3.4-3.43-7.66-5.15-12.76-5.15s-9.36,1.72-12.76,5.15ZM4158.06,1191.74v-20.85h8.93c2.67,0,4.75.65,6.26,1.96,1.5,1.3,2.26,2.98,2.26,5.02s-.85,3.69-2.55,4.94c-.74.57-1.59.99-2.55,1.28l5.11,7.66h-4.25l-4.68-6.81h-4.68v6.81h-3.83ZM4161.89,1181.1h5.7c2.72,0,4.09-1.08,4.09-3.23s-1.42-3.15-4.25-3.15h-5.53v6.38Z" fill="#b77df3"/>
                </g>
                <g>
                    <path d="M2832.81,1337.09v-171.23h84.39c16.15,0,28.94,4.2,38.4,12.6,9.46,8.4,14.19,18.88,14.19,31.43s-4.32,22.18-12.96,28.86c-3.59,2.78-7.83,4.98-12.72,6.61v1.22c6.03,1.31,11.33,3.51,15.9,6.61,10.6,7.67,15.9,19.32,15.9,34.98,0,14.52-5.22,26.29-15.66,35.35-10.44,9.05-25.2,13.58-44.27,13.58h-83.17ZM2860.94,1235.58h55.04c7.83,0,13.86-1.96,18.1-5.87,4.24-3.91,6.36-9.37,6.36-16.39,0-6.2-2.12-11.17-6.36-14.92-4.24-3.75-10.27-5.63-18.1-5.63h-55.04v42.81ZM2860.94,1310.19h53.82c21.2,0,31.8-8.15,31.8-24.46s-10.6-24.46-31.8-24.46h-53.82v48.92Z" fill="#b77df3"/>
                    <path d="M2990.58,1212.34h26.91l26.91,100.29h13.45l29.35-100.29h26.91l-51.37,171.23h-26.91l14.68-46.48h-25.68l-34.24-124.75Z" fill="#b77df3"/>
                </g>
                </g>
            </g>
        </svg>
      </div>

      {/* MULTI SELECT MAIN ITEMS */}
      {isMultiSelect && (
        <div className="animate-fade-in-right">
             <button onClick={() => onSelectItem(null)} className="mb-6 text-xs text-neutral-400 hover:text-white flex items-center gap-2 transition-colors uppercase font-bold tracking-wider">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Volver
            </button>
            <div className="bg-[#242742] p-4 rounded-lg border border-[#2e3250] text-center">
                <div className="text-white font-bold text-sm mb-2">{selectedItemIds.length} Items Seleccionados</div>
                <button 
                    onClick={onMergeItems}
                    className="w-full bg-[#d5ec2c] hover:bg-[#c2d627] text-[#191b32] py-2 rounded text-xs font-bold transition-colors"
                >
                    Fusionar (Merge)
                </button>
            </div>
             <div className="pt-4">
                 <button
                    onClick={() => selectedItemIds.forEach(id => onDeleteItem(id))}
                    className="w-full bg-red-900/10 hover:bg-red-900/20 text-red-500 border border-red-900/20 py-2 rounded text-xs font-bold transition-colors"
                >
                    Eliminar Todos
                </button>
            </div>
        </div>
      )}

      {/* MULTI SELECT SUB ITEMS */}
      {isSubMultiSelect && (
          <div className="animate-fade-in-right">
             <button onClick={() => onSelectSubItem(activeParentId!, null)} className="mb-6 text-xs text-neutral-400 hover:text-white flex items-center gap-2 transition-colors uppercase font-bold tracking-wider">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg> Volver al Grid
            </button>
            <div className="bg-[#242742] p-4 rounded-lg border border-[#2e3250] text-center">
                <div className="text-white font-bold text-sm mb-2">{selectedSubItemIds.length} Sub-Items Seleccionados</div>
                <button 
                    onClick={onMergeSubItems}
                    className="w-full bg-[#ba8bff] hover:bg-[#a379e0] text-[#191b32] py-2 rounded text-xs font-bold transition-colors"
                >
                    Fusionar Sub-Items
                </button>
            </div>
        </div>
      )}

      {activeItem && !isMultiSelect && !isSubMultiSelect ? (
        /* ITEM EDITOR MODE (Single Main or Single Sub) */
        <div className="animate-fade-in-right">
          <div className="flex items-center gap-2 mb-6">
            <button 
                onClick={() => isSubItemEditing ? onSelectSubItem(activeParentId!, null) : onSelectItem(null)}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-2 transition-colors uppercase font-bold tracking-wider"
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                {isSubItemEditing ? 'Volver al Padre' : 'Volver'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#2e3250] pb-2">
                <h2 className="text-sm font-bold text-white uppercase truncate pr-2">
                    {isSubItemEditing ? `Editando Sub-Item` : `Editar Elemento`}
                </h2>
                {!isSubItemEditing && (
                    <button 
                        onClick={() => handleUpdate({ locked: !activeItem?.locked })}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${activeItem.locked ? 'bg-[#d5ec2c]/20 text-[#d5ec2c] border-[#d5ec2c]/50' : 'bg-[#15172b] text-neutral-400 border-[#2e3250]'}`}
                    >
                        {activeItem.locked ? 'Bloqueado' : 'Bloquear'}
                    </button>
                )}
            </div>
            
            {/* PARENT SPECIFIC: SUB-GRID CONTROLS */}
            {!isSubItemEditing && (
                <div className="bg-[#242742] p-3 rounded border border-[#2e3250] mb-4">
                    <label className="text-xs font-semibold text-neutral-400 mb-2 block uppercase tracking-wider">Sub-Grid Canvas</label>
                    {!hasSubGrid ? (
                        <button
                            onClick={() => onCreateSubGrid(activeItem!.id)}
                            className="w-full bg-[#ba8bff]/20 hover:bg-[#ba8bff]/30 text-[#ba8bff] border border-[#ba8bff]/30 py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            Convertir a Sub-Grid
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-neutral-400 block mb-1">Filas (Rows)</label>
                                    <input 
                                        type="number" min="1" max="12"
                                        value={parentItem?.subRows || 2}
                                        onChange={(e) => handleUpdate({ subRows: parseInt(e.target.value) })}
                                        className="w-full bg-[#15172b] border border-[#2e3250] rounded px-2 py-1 text-xs text-white focus:border-[#d5ec2c] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-neutral-400 block mb-1">Cols (Cols)</label>
                                    <input 
                                        type="number" min="1" max="12"
                                        value={parentItem?.subColumns || 2}
                                        onChange={(e) => handleUpdate({ subColumns: parseInt(e.target.value) })}
                                        className="w-full bg-[#15172b] border border-[#2e3250] rounded px-2 py-1 text-xs text-white focus:border-[#d5ec2c] outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => onRandomizeSubGrid(activeItem!.id)}
                                className="w-full bg-[#15172b] hover:bg-[#1a1c30] text-neutral-300 py-2 rounded text-xs border border-[#2e3250] flex items-center justify-center gap-2"
                            >
                                Aleatorizar Layout
                            </button>
                            <button
                                onClick={() => onRemoveSubGrid(activeItem!.id)}
                                className="w-full bg-red-900/10 hover:bg-red-900/20 text-red-500 py-1.5 rounded text-xs border border-red-900/20"
                            >
                                Eliminar Sub-Grid
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400">Tipo</label>
              <select 
                disabled={activeItem.locked || (hasSubGrid && !isSubItemEditing)} 
                value={activeItem.type}
                onChange={(e) => handleUpdate({ type: e.target.value as BentoType })}
                className="w-full bg-[#242742] border border-[#2e3250] rounded p-2 text-sm text-white focus:border-[#d5ec2c] focus:outline-none disabled:opacity-50"
              >
                <option value={BentoType.TEXT}>Texto</option>
                <option value={BentoType.STAT}>Dato/Estadística</option>
                <option value={BentoType.IMAGE}>Imagen</option>
              </select>
            </div>

             {/* SHAPE SELECTOR */}
             {((isItemSquare && !hasSubGrid) || isSubItemEditing) && (
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400">Forma</label>
                    <div className="grid grid-cols-2 gap-2">
                         <button
                            onClick={() => handleUpdate({ variant: 'square' })}
                            className={`flex items-center justify-center py-2 rounded border transition-colors ${activeItem.variant !== 'circle' ? 'bg-[#15172b] border-[#d5ec2c] text-white' : 'bg-[#242742] border-[#2e3250] text-neutral-500'}`}
                         >
                            <span className="w-3 h-3 border border-current rounded-sm mr-2"></span>
                            <span className="text-xs">Cuadrado</span>
                         </button>
                         <button
                            onClick={() => handleUpdate({ variant: 'circle' })}
                            className={`flex items-center justify-center py-2 rounded border transition-colors ${activeItem.variant === 'circle' ? 'bg-[#15172b] border-[#d5ec2c] text-white' : 'bg-[#242742] border-[#2e3250] text-neutral-500'}`}
                         >
                            <span className="w-3 h-3 border border-current rounded-full mr-2"></span>
                            <span className="text-xs">Círculo</span>
                         </button>
                    </div>
                </div>
            )}

             {/* BACKGROUND COLOR - SOLIDS ONLY */}
             <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400">Color de Fondo (HEX)</label>
                
                {config.palette.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {config.palette.map(color => (
                            <button
                                key={color}
                                onClick={() => handleUpdate({ backgroundColor: color })}
                                className={`w-6 h-6 rounded-full border border-white/10 hover:scale-110 transition-transform ${activeItem?.backgroundColor === color ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                     <div 
                        className="w-8 h-8 rounded border border-[#2e3250]" 
                        style={{backgroundColor: activeItem.backgroundColor.startsWith('#') ? activeItem.backgroundColor : '#000'}}
                     />
                     <input 
                        type="text" 
                        value={activeItem.backgroundColor}
                        onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                        placeholder="#HEX"
                        className="w-full bg-[#242742] border border-[#2e3250] rounded p-1.5 text-xs text-neutral-300 font-mono focus:border-[#d5ec2c] focus:text-white transition-colors outline-none"
                    />
                </div>
            </div>

            {/* NEW: ITEM PADDING (INSET) */}
             <div className="space-y-2">
                 <div className="flex justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-400">Inset (Padding Interno)</label>
                    <span className="text-xs font-mono text-neutral-400">{activeItem.innerPadding || 0}px</span>
                </div>
                <input 
                    type="range" min="0" max="100" step="4"
                    value={activeItem.innerPadding || 0}
                    onChange={(e) => handleUpdate({ innerPadding: parseInt(e.target.value) })}
                    className="w-full accent-[#d5ec2c] h-1 bg-[#15172b] rounded-lg appearance-none cursor-pointer"
                />
            </div>

            {/* TEXT FIELDS */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400">Título</label>
                <input 
                    type="text"
                    value={activeItem.title}
                    onChange={(e) => handleUpdate({ title: e.target.value })}
                    className="w-full bg-[#242742] border border-[#2e3250] rounded p-2 text-sm text-white focus:border-[#d5ec2c] outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400">Contenido</label>
                <textarea 
                    rows={3}
                    value={activeItem.content}
                    onChange={(e) => handleUpdate({ content: e.target.value })}
                    className="w-full bg-[#242742] border border-[#2e3250] rounded p-2 text-sm text-white focus:border-[#d5ec2c] resize-none outline-none"
                />
            </div>

             {/* DIMENSIONS */}
             <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400">Cols (Ancho)</label>
                    <input 
                        type="number"
                        disabled={activeItem.locked}
                        min="1"
                        max={isSubItemEditing ? (parentItem?.subColumns || 2) : config.columns} 
                        value={activeItem.colSpan}
                        onChange={(e) => handleUpdate({ colSpan: parseInt(e.target.value) })}
                        className="w-full bg-[#242742] border border-[#2e3250] rounded p-2 text-sm text-white focus:border-[#d5ec2c] disabled:opacity-50 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-400">Rows (Alto)</label>
                    <input 
                        type="number"
                        disabled={activeItem.locked}
                        min="1"
                        max={isSubItemEditing ? (parentItem?.subRows || 2) : config.rows}
                        value={activeItem.rowSpan}
                        onChange={(e) => handleUpdate({ rowSpan: parseInt(e.target.value) })}
                        className="w-full bg-[#242742] border border-[#2e3250] rounded p-2 text-sm text-white focus:border-[#d5ec2c] disabled:opacity-50 outline-none"
                    />
                </div>
            </div>

            <div className="pt-6">
                 <button
                    onClick={() => onDeleteItem(activeItem!.id)}
                    disabled={activeItem.locked}
                    className="w-full bg-red-900/10 hover:bg-red-900/20 text-red-500 border border-red-900/20 py-2 rounded text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubItemEditing ? 'Eliminar Sub-Item' : 'Eliminar Elemento'}
                </button>
            </div>
          </div>
        </div>
      ) : (
         /* GLOBAL SETTINGS MODE */
         !isMultiSelect && !isSubMultiSelect && (
        <>
             {/* PALETTE MANAGEMENT */}
             <div className="mb-6">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Paleta de Marca</h3>
                
                {/* Visual Palette List */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {config.palette.map(color => (
                        <div key={color} className="relative group">
                             <div className="w-8 h-8 rounded-md border border-[#2e3250] shadow-sm" style={{ backgroundColor: color }}></div>
                             <button 
                                onClick={() => handleRemoveColor(color)}
                                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 ×
                             </button>
                        </div>
                    ))}
                </div>

                {/* Custom HEX Adder (Replaces Native RGB Picker) */}
                <div className="bg-[#242742] p-2 rounded border border-[#2e3250] flex items-center gap-2">
                    <div 
                        className="w-8 h-8 rounded border border-[#444]" 
                        style={{ backgroundColor: /^#([0-9A-F]{3}){1,2}$/i.test(hexInput) ? hexInput : 'transparent' }} 
                    />
                    <input 
                        type="text" 
                        value={hexInput}
                        onChange={(e) => setHexInput(e.target.value)}
                        placeholder="#HEX"
                        className="flex-1 bg-transparent border-none text-xs text-white placeholder-neutral-500 focus:outline-none font-mono uppercase"
                        maxLength={7}
                    />
                    <button 
                        onClick={handleAddColor}
                        className="bg-[#15172b] hover:bg-[#1f223d] text-white text-[10px] font-bold py-1.5 px-3 rounded border border-[#2e3250] transition-colors"
                    >
                        + ADD
                    </button>
                </div>
            </div>

             <div className="w-full h-px bg-[#2e3250] mb-6"></div>

            {/* CANVAS SIZE SECTION */}
            <div className="mb-6">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Lienzo (Canvas)</h3>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.label}
                            onClick={() => setConfig(prev => ({ ...prev, width: ratio.w, height: ratio.h }))}
                            className={`text-[10px] font-medium py-2 rounded border transition-all
                                ${config.width === ratio.w && config.height === ratio.h 
                                ? 'bg-[#d5ec2c] border-[#d5ec2c] text-[#191b32]' 
                                : 'bg-[#242742] border-[#2e3250] text-neutral-400 hover:border-neutral-500'}`}
                        >
                            {ratio.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                         <label className="text-[10px] text-neutral-400 mb-1 block">Ancho (px)</label>
                         <input type="number" value={config.width} onChange={(e) => updateConfig('width', parseInt(e.target.value))} className="w-full bg-[#242742] border border-[#2e3250] rounded px-2 py-1 text-xs text-white outline-none" />
                    </div>
                    <div>
                         <label className="text-[10px] text-neutral-400 mb-1 block">Alto (px)</label>
                         <input type="number" value={config.height} onChange={(e) => updateConfig('height', parseInt(e.target.value))} className="w-full bg-[#242742] border border-[#2e3250] rounded px-2 py-1 text-xs text-white outline-none" />
                    </div>
                </div>
            </div>

            <div className="w-full h-px bg-[#2e3250] mb-6"></div>

            {/* CONFIGURATION SECTION */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                     <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ajustes Grid</h3>
                     <button onClick={onAddItem} className="text-[10px] bg-[#15172b] hover:bg-[#1f223d] text-white px-2 py-1 rounded border border-[#2e3250] transition-colors">+ Item</button>
                </div>

                <button 
                    onClick={onRandomize}
                    className="w-full bg-[#242742] border border-[#2e3250] hover:border-[#d5ec2c] hover:text-[#d5ec2c] text-neutral-300 py-2 rounded text-xs font-bold transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Randomize Layout
                </button>
               
                {/* Horizontal Columns */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-neutral-400">Columnas (Horizontal)</label>
                        <span className="text-xs font-mono text-neutral-500">{config.columns}</span>
                    </div>
                    <input 
                        type="range" min="2" max="7" step="1"
                        value={config.columns}
                        onChange={(e) => setConfig({...config, columns: parseInt(e.target.value)})}
                        className="w-full accent-[#d5ec2c] h-1 bg-[#15172b] rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Vertical Rows */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-neutral-400">Filas (Vertical)</label>
                        <span className="text-xs font-mono text-neutral-500">{config.rows}</span>
                    </div>
                    <input 
                        type="range" min="2" max="7" step="1"
                        value={config.rows}
                        onChange={(e) => setConfig({...config, rows: parseInt(e.target.value)})}
                        className="w-full accent-[#d5ec2c] h-1 bg-[#15172b] rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-neutral-400">Espaciado (Gap)</label>
                        <span className="text-xs font-mono text-neutral-500">{config.gap}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="64" step="4"
                        value={config.gap}
                        onChange={(e) => setConfig({...config, gap: parseInt(e.target.value)})}
                        className="w-full accent-[#d5ec2c] h-1 bg-[#15172b] rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-neutral-400">Radio Borde</label>
                        <span className="text-xs font-mono text-neutral-500">{config.borderRadius}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" step="4"
                        value={config.borderRadius}
                        onChange={(e) => setConfig({...config, borderRadius: parseInt(e.target.value)})}
                        className="w-full accent-[#d5ec2c] h-1 bg-[#15172b] rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-xs text-neutral-400">Padding Interno</label>
                        <span className="text-xs font-mono text-neutral-500">{config.padding}px</span>
                    </div>
                    <input 
                        type="range" min="0" max="200" step="10"
                        value={config.padding}
                        onChange={(e) => setConfig({...config, padding: parseInt(e.target.value)})}
                        className="w-full accent-[#d5ec2c] h-1 bg-[#15172b] rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
            {/* removed export buttons div */}
        </>
        )
      )}
    </div>
  );
};