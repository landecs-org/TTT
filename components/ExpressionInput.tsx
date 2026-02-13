
import React, { useState, useRef, useLayoutEffect } from 'react';
import { clsx } from 'clsx';
import { Sparkles, Play, Delete, Keyboard, ArrowUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpressionInputProps {
  value: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  isValid: boolean;
}

const SYMBOL_GROUPS = [
    { name: 'Logic', symbols: ['¬', '∧', '∨', '→', '↔', '⊕'] },
    { name: 'Groups', symbols: ['(', ')', '[', ']', '{', '}'] },
    { name: 'Values', symbols: ['1', '0'] },
    { name: 'Vars', symbols: ['P', 'Q', 'R', 'S'] }
];

const ExpressionInput: React.FC<ExpressionInputProps> = ({ value, onChange, onGenerate, isValid }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);

  useLayoutEffect(() => {
      if (inputRef.current && cursorRef.current !== null) {
          inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
          cursorRef.current = null;
      }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      onGenerate();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const pos = e.target.selectionStart;
      
      // Auto-pair logic on typing
      if (pos !== null && val.length > value.length) {
          const char = val.slice(pos - 1, pos);
          if (['(', '[', '{'].includes(char)) {
             const pair = char === '(' ? ')' : char === '[' ? ']' : '}';
             // Check if next char is already the pair (skip it) or insert new
             const nextChar = val.slice(pos, pos + 1);
             if (nextChar !== pair) {
                 const newValue = val.slice(0, pos) + pair + val.slice(pos);
                 cursorRef.current = pos; 
                 onChange(newValue);
                 return;
             }
          }
      }
      cursorRef.current = pos;
      onChange(val);
  };

  const insertSymbol = (char: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || value.length;
      const end = input.selectionEnd || value.length;
      
      // Auto-pair from keyboard click
      let insertion = char;
      let moveCursor = 1;
      
      if (char === '(') { insertion = '()'; }
      if (char === '[') { insertion = '[]'; }
      if (char === '{') { insertion = '{}'; }
      
      const newValue = value.substring(0, start) + insertion + value.substring(end);
      
      cursorRef.current = start + moveCursor;
      onChange(newValue);
      input.focus();
    } else {
        onChange(value + char);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 relative z-10 flex flex-col gap-4">
      <motion.div 
        layout
        className={clsx(
          "relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl transition-all duration-300 overflow-hidden",
          isFocused ? "shadow-primary-200/50 ring-4 ring-primary-100 dark:ring-primary-900" : "shadow-md"
        )}
      >
        <div className="flex items-center p-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              className="w-full h-14 pl-6 pr-4 bg-transparent text-xl md:text-2xl font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
              placeholder="{P ∧ [Q ∨ R]}"
              autoComplete="off"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={clsx(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 ml-2",
                showKeyboard ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700/50"
            )}
          >
            <Keyboard className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGenerate}
            disabled={!isValid || value.length === 0}
            className={clsx(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 ml-2",
              isValid && value.length > 0
                ? "bg-primary-600 text-white shadow-md shadow-primary-500/30"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {value.length > 0 && isValid ? (
              <Play className="w-5 h-5 fill-current" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Pro Keyboard */}
        <AnimatePresence>
            {showKeyboard && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-2"
                >
                    <div className="flex flex-col gap-2">
                        {SYMBOL_GROUPS.map(group => (
                            <div key={group.name} className="flex gap-2 items-center overflow-x-auto no-scrollbar py-1 px-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 w-10 flex-shrink-0">{group.name}</span>
                                {group.symbols.map(char => (
                                    <button
                                        key={char}
                                        onClick={() => insertSymbol(char)}
                                        className="h-10 w-10 min-w-[2.5rem] bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center font-mono text-lg text-slate-700 dark:text-slate-200"
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                        ))}
                        <div className="flex justify-end pt-1 px-1">
                            <button
                                onClick={() => onChange(value.slice(0, -1))}
                                className="h-10 px-6 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors flex items-center gap-2"
                            >
                                <Delete className="w-5 h-5" /> Backspace
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ExpressionInput;
