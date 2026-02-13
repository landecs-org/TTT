import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Check, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VariableSelectorProps {
  selected: string[];
  suggested?: string[];
  onChange: (vars: string[]) => void;
}

const PRESETS = ['A', 'B', 'C', 'D', 'E'];

const VariableSelector: React.FC<VariableSelectorProps> = ({ selected, suggested = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newVar, setNewVar] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isAdding]);

  const toggleVar = (v: string) => {
    if (selected.includes(v)) {
      onChange(selected.filter(s => s !== v).sort());
    } else {
      onChange([...selected, v].sort());
    }
  };

  const handleAddSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = newVar.trim().toUpperCase();
    if (v && /^[A-Z][0-9]*$/.test(v)) { // Simple validation
        if (!selected.includes(v)) {
            onChange([...selected, v].sort());
        }
        setNewVar('');
        setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAddSubmit();
      if (e.key === 'Escape') {
          setIsAdding(false);
          setNewVar('');
      }
  };

  // Combine and deduplicate logic
  const allVars = Array.from(new Set([...PRESETS, ...selected, ...suggested])).sort();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 mb-4">
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
          1. Declare Propositions
        </label>
        
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {allVars.map((v) => {
                const isActive = selected.includes(v);
                const isSuggested = !isActive && suggested.includes(v);

                return (
                <motion.button
                    layout
                    key={v}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => toggleVar(v)}
                    className={clsx(
                    "w-12 h-12 rounded-xl text-lg font-mono font-bold transition-all flex items-center justify-center relative",
                    isActive 
                        ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900 z-10" 
                        : isSuggested
                            ? "bg-primary-50 text-primary-600 border-2 border-primary-300 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700 animate-pulse"
                            : "bg-white text-slate-400 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300"
                    )}
                >
                    {v}
                    {isActive && (
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center border-2 border-surface-50 dark:border-slate-900"
                        >
                            <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </motion.div>
                    )}
                </motion.button>
                );
            })}
          </AnimatePresence>
          
          {/* Add Button / Input */}
          <div className="relative">
             {!isAdding ? (
                 <motion.button
                    layout
                    onClick={() => setIsAdding(true)}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-400 transition-colors"
                 >
                    <Plus className="w-5 h-5" />
                 </motion.button>
             ) : (
                 <motion.form
                    layout
                    initial={{ width: '3rem', opacity: 0 }}
                    animate={{ width: '6rem', opacity: 1 }}
                    onSubmit={handleAddSubmit}
                    className="h-12 bg-white dark:bg-slate-800 rounded-xl border-2 border-primary-500 flex items-center overflow-hidden shadow-sm"
                 >
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={newVar}
                        onChange={e => setNewVar(e.target.value.toUpperCase().slice(0, 1))} // Single char for simplicity
                        onBlur={() => !newVar && setIsAdding(false)}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full text-center font-mono font-bold bg-transparent outline-none uppercase text-slate-900 dark:text-white"
                        placeholder="?"
                    />
                 </motion.form>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariableSelector;