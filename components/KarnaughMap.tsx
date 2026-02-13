import React from 'react';
import { clsx } from 'clsx';
import { KMapData, KMapGroup } from '../types';
import { motion } from 'framer-motion';

interface KMapProps {
  data: KMapData;
  expression: string;
}

const KarnaughMap: React.FC<KMapProps> = ({ data, expression }) => {
  if (!data) return null;

  const { grid, rowLabels, colLabels, variables, groups, minimizedExpression } = data;
  const numRows = grid.length;
  const numCols = grid[0].length;
  
  // Logic.ts splits:
  // 2 vars (A, B): Row A, Col B
  // 3 vars (A, BC): Row A, Col BC
  // 4 vars (AB, CD): Row AB, Col CD
  const displayRowVar = variables.length === 2 ? variables[0] : variables.length === 3 ? variables[0] : variables.slice(0, 2).join('');
  const displayColVar = variables.length === 2 ? variables[1] : variables.length === 3 ? variables.slice(1).join('') : variables.slice(2).join('');

  return (
    <div className="p-6 flex flex-col items-center w-full min-h-[60vh]">
      <div className="w-full max-w-md">
        
        {/* K-Map Layout */}
        <div className="relative mt-10 ml-10 mb-8 select-none">
            {/* Variables Label */}
            <div className="absolute -top-10 -left-10 w-20 h-20 flex items-center justify-center">
                 <div className="relative w-full h-full">
                    <div className="absolute top-2 right-0 text-sm font-bold text-slate-900 dark:text-white">{displayColVar}</div>
                    <div className="absolute bottom-2 left-0 text-sm font-bold text-slate-900 dark:text-white">{displayRowVar}</div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[1px] bg-slate-300 dark:bg-slate-600 -rotate-45 transform origin-center"></div>
                 </div>
            </div>

            {/* Column Headers */}
            <div className="flex ml-[1px]">
                {colLabels.map((label, i) => (
                    <div key={i} className="flex-1 min-w-[3.5rem] text-center text-sm font-mono font-bold text-slate-600 dark:text-slate-400 pb-2">
                        {label}
                    </div>
                ))}
            </div>

            <div className="flex relative">
                {/* Row Headers */}
                <div className="flex flex-col mr-2 w-8">
                    {rowLabels.map((label, i) => (
                        <div key={i} className="flex-1 min-h-[3.5rem] flex items-center justify-end text-sm font-mono font-bold text-slate-600 dark:text-slate-400 pr-2">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Grid Container */}
                <div className="relative">
                    <div 
                        className="grid gap-[2px] bg-slate-200 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden relative z-0"
                        style={{ 
                            gridTemplateColumns: `repeat(${numCols}, 3.5rem)`,
                            gridTemplateRows: `repeat(${numRows}, 3.5rem)`
                        }}
                    >
                        {grid.map((row, rIdx) => (
                            row.map((cell, cIdx) => (
                                <motion.div
                                    key={`${rIdx}-${cIdx}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (rIdx * numCols + cIdx) * 0.02 }}
                                    className={clsx(
                                        "bg-white dark:bg-slate-800 flex items-center justify-center font-mono text-xl font-bold relative group",
                                        cell.value ? "text-slate-900 dark:text-white" : "text-slate-300 dark:text-slate-600"
                                    )}
                                >
                                    {cell.value ? '1' : '0'}
                                    <div className="absolute top-0.5 right-0.5 text-[0.6rem] font-sans text-slate-300 dark:text-slate-600 opacity-50">
                                        {cell.mintermIndex}
                                    </div>
                                </motion.div>
                            ))
                        ))}
                    </div>

                    {/* Groups Overlay */}
                    <div className="absolute inset-0 z-10 pointer-events-none w-full h-full">
                         {groups.map((group, gIdx) => (
                             <React.Fragment key={gIdx}>
                                 {/* 
                                   A group can wrap around. 
                                   We render a box for each cell or use a unified shape?
                                   Simplest robust way: Render a box for each contiguous sub-part.
                                   Actually, simpler: Just render individual cell highlights and connect them? 
                                   No, standard K-Map loops are rectangles. 
                                   If a group wraps, it consists of multiple rectangles.
                                   We need to detect the rectangles.
                                   
                                   Since logic.ts returns a list of cells, let's group adjacent cells in the visual grid space.
                                   Or just render 1-unit borders for each cell and rely on CSS blending?
                                   Better: Render the exact rectangles calculated in logic.ts (which we don't have, we only have cells).
                                   
                                   Let's hack it visually: Render a div for EACH cell in the group, 
                                   but utilize standard css borders to make them look like a blob? Hard.
                                   
                                   Revisiting logic.ts: It calculates `r, rCount, c, cCount`. 
                                   We should pass that to the component!
                                   Wait, logic.ts output `groups` currently only has `cells`. 
                                   I'll just iterate the cells and put a colored ring on each.
                                   It's not perfect "Loop" visualization but it shows membership clearly.
                                 */}
                                 {group.cells.map((cell, cIdx) => (
                                     <motion.div
                                        key={`g-${gIdx}-c-${cIdx}`}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 + gIdx * 0.1 }}
                                        className={clsx(
                                            "absolute rounded-md border-2",
                                            group.color
                                        )}
                                        style={{
                                            // 3.5rem is 56px + gap 2px = 58px approx stride? 
                                            // Grid gap is 2px. Cell size 3.5rem (56px).
                                            // Top = row * (56px + 2px) + 2px border offset
                                            top: `calc(${cell.r} * (3.5rem + 2px) + 2px)`,
                                            left: `calc(${cell.c} * (3.5rem + 2px) + 2px)`,
                                            width: '3.5rem',
                                            height: '3.5rem'
                                        }}
                                     />
                                 ))}
                             </React.Fragment>
                         ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Legend / Results */}
        <div className="w-full space-y-3">
             <div className="bg-surface-50 dark:bg-slate-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">Minimized SOP</h4>
                <div className="font-mono text-lg font-medium text-primary-600 dark:text-primary-400 break-words">
                    {minimizedExpression || "0"}
                </div>
            </div>
            
            {groups.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {groups.map((g, i) => (
                        <div key={i} className={clsx("px-2 py-1 rounded text-xs font-mono font-bold border", g.color.replace('bg-', 'text-').replace('/20',''))}>
                            {g.term}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default KarnaughMap;
