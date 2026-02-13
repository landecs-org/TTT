import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { TruthTableRow, TableColumn, AppSettings } from '../types';
import { Copy, Check, GripVertical, MoreHorizontal, Edit2 } from 'lucide-react';

interface TruthTableProps {
  rows: TruthTableRow[];
  columns: TableColumn[];
  settings: AppSettings;
  onRowSelect?: (row: TruthTableRow) => void;
  onRowChange?: (row: TruthTableRow, changedCol: TableColumn) => void;
}

const TruthTable: React.FC<TruthTableProps> = ({ rows, columns, settings, onRowSelect, onRowChange }) => {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const [focusedColId, setFocusedColId] = useState<string | null>(null);
  
  // Resizing State
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure text to auto-resize columns
  const measureText = (text: string, isHeader: boolean) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text.length * 10;
    // Match the font styles from Tailwind config and CSS
    context.font = isHeader 
        ? 'bold 14px "Plus Jakarta Sans", sans-serif' 
        : '14px "JetBrains Mono", monospace';
    return context.measureText(text).width;
  };

  // Initialize and Auto-Resize widths
  useEffect(() => {
    const newWidths: Record<string, number> = {};
    columns.forEach(col => {
        const headerWidth = measureText(col.label, true) + 40; // padding for icon + space
        const cellWidth = measureText(settings.logic.truthValues === 'F/T' ? 'F' : '0', false) + 40;
        
        // Input cols usually smaller, but let content dictate. Min width 64.
        // Derived cols usually larger headers.
        newWidths[col.id] = Math.max(headerWidth, cellWidth, col.isInput ? 56 : 80);
    });
    setColWidths(newWidths);
  }, [columns, settings.table.dense, settings.logic.truthValues]);

  const displayValue = (val: boolean) => {
      if (settings.logic.truthValues === 'F/T') return val ? 'T' : 'F';
      return val ? '1' : '0';
  };

  // --- Resizing Logic ---
  const startResize = (e: React.PointerEvent, colId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const currentWidth = colWidths[colId] || 64;
      resizingRef.current = { id: colId, startX: e.clientX, startWidth: currentWidth };
      
      document.addEventListener('pointermove', handleResizeMove);
      document.addEventListener('pointerup', stopResize);
  };

  const handleResizeMove = (e: PointerEvent) => {
      if (!resizingRef.current) return;
      const { id, startX, startWidth } = resizingRef.current;
      const diff = e.clientX - startX;
      // Min width 40px
      const newWidth = Math.max(40, startWidth + diff);
      
      setColWidths(prev => ({ ...prev, [id]: newWidth }));
  };

  const stopResize = () => {
      resizingRef.current = null;
      document.removeEventListener('pointermove', handleResizeMove);
      document.removeEventListener('pointerup', stopResize);
  };

  // --- Interaction Logic ---

  const handleTouchStart = (row: TruthTableRow) => {
    longPressTimer.current = setTimeout(() => {
        handleCopyRow(row);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
    }
  };

  const handleCopyRow = (row: TruthTableRow) => {
    const text = columns.map(c => displayValue(row.values[c.expression])).join('\t');
    
    navigator.clipboard.writeText(text).catch(() => {});
    if (navigator.vibrate) navigator.vibrate([10, 50]);
    setCopiedRowId(row.id);
    setTimeout(() => setCopiedRowId(null), 2000);
  };

  const handleRowClick = (row: TruthTableRow) => {
    // Selection logic for Step-by-step view
    if (selectedRowId === row.id) {
        setSelectedRowId(null);
    } else {
        setSelectedRowId(row.id);
        if (onRowSelect) onRowSelect(row);
    }
  };

  const toggleColFocus = (colId: string) => {
      setFocusedColId(prev => prev === colId ? null : colId);
  };

  const handleCellClick = (e: React.MouseEvent, row: TruthTableRow, col: TableColumn) => {
    if (onRowChange) {
        e.stopPropagation(); // Prevent row selection when editing
        const newValue = !row.values[col.expression];
        const newRow = { ...row, values: { ...row.values, [col.expression]: newValue } };
        onRowChange(newRow, col);
        if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  // Dependency Highlighting Logic
  const getOpacity = (col: TableColumn) => {
      if (!focusedColId) return 1;
      if (col.id === focusedColId) return 1;
      
      // If the focused column depends on this column, highlight it
      const focusedCol = columns.find(c => c.id === focusedColId);
      if (focusedCol && focusedCol.dependencyIds?.includes(col.astId || '')) return 1;

      return 0.2; // Dim unrelated
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface-50 dark:bg-slate-900 overflow-hidden">
      <div className="flex-1 overflow-auto no-scrollbar pb-32 w-full">
        {/* Scroll Container */}
        <div className="min-w-max inline-block align-middle">
           
           {/* Header */}
           <div className={clsx(
               "z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-surface-200 dark:border-surface-800 flex shadow-sm",
               settings.table.stickyHeaders ? "sticky top-0" : ""
           )}>
              {columns.map((col, i) => {
                  const width = colWidths[col.id] || (col.isInput ? 64 : 120);
                  const opacity = settings.table.highlightDependencies ? getOpacity(col) : 1;

                  return (
                    <motion.div 
                        layout
                        key={col.id}
                        style={{ width: width, opacity }}
                        onClick={() => toggleColFocus(col.id)}
                        className={clsx(
                            "relative py-3 px-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer select-none group",
                            col.isInput 
                                ? "bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900" 
                                : col.isOutput 
                                    ? "bg-primary-50/50 dark:bg-primary-900/20" 
                                    : "bg-white dark:bg-slate-900"
                        )}
                    >
                        {/* Grouping Border for Inputs */}
                        {col.isInput && i === columns.filter(c=>c.isInput).length - 1 && (
                            <div className="absolute right-0 top-0 bottom-0 w-[4px] border-r-2 border-double border-slate-300 dark:border-slate-700 z-10" />
                        )}

                        {/* Label */}
                        <div className="flex items-center gap-1">
                            <span className={clsx(
                                "text-sm font-bold font-display truncate text-center",
                                col.isOutput ? "text-primary-700 dark:text-primary-300" : 
                                col.isInput ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"
                            )}>
                                {col.label}
                            </span>
                            {/* All columns are editable now, show icon on hover */}
                            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Resize Handle */}
                        <div 
                            onPointerDown={(e) => startResize(e, col.id)}
                            className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-slate-200/50 dark:hover:bg-slate-700/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        >
                            <div className="w-[1px] h-4 bg-slate-400 dark:bg-slate-500" />
                        </div>
                    </motion.div>
                  );
              })}
           </div>

           {/* Body */}
           <div className="divide-y divide-slate-100 dark:divide-slate-800">
             {rows.map((row, i) => {
                const isSelected = selectedRowId === row.id;
                const isCopied = copiedRowId === row.id;
                const finalVal = row.values[columns[columns.length-1].expression];
                
                return (
                  <motion.div
                    layout
                    key={row.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                        delay: Math.min(i * 0.03, 0.8), // Staggered delay capped at 0.8s
                        duration: 0.4, 
                        ease: [0.25, 1, 0.5, 1] // Apple-like easing
                    }}
                    onClick={() => handleRowClick(row)}
                    onTouchStart={() => handleTouchStart(row)}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={() => handleTouchStart(row)}
                    onMouseUp={handleTouchEnd}
                    onMouseLeave={handleTouchEnd}
                    className={clsx(
                      "flex transition-colors duration-200 select-none relative group touch-manipulation",
                      isSelected ? "bg-primary-50 dark:bg-primary-900/40" : "hover:bg-slate-50 dark:hover:bg-slate-800",
                      finalVal ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/50"
                    )}
                  >
                    {columns.map((col, colIdx) => {
                        const val = row.values[col.expression];
                        const width = colWidths[col.id] || (col.isInput ? 64 : 120);
                        const opacity = settings.table.highlightDependencies ? getOpacity(col) : 1;
                        
                        // All cells are editable
                        const isEditable = true; 

                        return (
                            <motion.div 
                                layout
                                key={col.id} 
                                style={{ width: width, opacity }}
                                onClick={(e) => handleCellClick(e, row, col)}
                                className={clsx(
                                    "relative py-3.5 px-2 flex items-center justify-center flex-shrink-0 transition-opacity",
                                    col.isInput 
                                        ? "bg-slate-50/30 dark:bg-slate-800/10" 
                                        : "",
                                    isEditable ? "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform" : ""
                                )}
                            >
                                {/* Input Grouping Divider */}
                                {col.isInput && colIdx === columns.filter(c=>c.isInput).length - 1 && (
                                    <div className="absolute right-0 top-0 bottom-0 w-[4px] border-r-2 border-double border-slate-200 dark:border-slate-800" />
                                )}

                                <span className={clsx(
                                    "font-mono transition-all",
                                    col.isOutput ? "text-lg font-bold" : col.isInput ? "text-base" : "text-sm",
                                    val 
                                      ? (col.isOutput ? "text-primary-600 dark:text-primary-400" : "text-slate-900 dark:text-white font-medium") 
                                      : (col.isOutput ? "text-slate-400 dark:text-slate-600" : "text-slate-400 dark:text-slate-600")
                                )}>
                                    {col.isOutput && isCopied ? <Check className="w-5 h-5 text-green-500 scale-125" /> : displayValue(val)}
                                </span>
                            </motion.div>
                        );
                    })}
                  </motion.div>
                );
             })}
           </div>
        </div>
      </div>
      
      {/* Copied Toast */}
      <AnimatePresence>
        {copiedRowId && (
            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full text-sm font-bold shadow-2xl pointer-events-none z-50 flex items-center gap-3 backdrop-blur-xl"
            >
                <div className="bg-green-500 rounded-full p-1">
                    <Check className="w-3 h-3 text-white stroke-[4]" />
                </div>
                <span>Row Copied!</span>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TruthTable;