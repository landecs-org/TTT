
import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { db } from '../utils/db';
import { Search, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface HistorySheetProps {
    onSelect: (item: HistoryItem) => void;
}

const HistorySheet: React.FC<HistorySheetProps> = ({ onSelect }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const items = await db.getHistory();
        // Sort by newest first
        setHistory(items.reverse());
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await db.deleteHistory(id);
        loadHistory();
    };

    const filtered = history.filter(h => 
        h.expression.toLowerCase().includes(searchTerm.toLowerCase()) || 
        h.classification.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search calculations..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 ring-primary-500/20 text-slate-900 dark:text-white placeholder-slate-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No history yet.</p>
                    </div>
                ) : filtered.length === 0 ? (
                     <div className="text-center py-10 text-slate-400">
                        <p>No matches found.</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filtered.map((item) => (
                            <motion.button
                                layout
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => onSelect(item)}
                                className="w-full bg-surface-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 p-4 rounded-xl text-left group transition-all shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-mono font-medium text-slate-900 dark:text-white truncate pr-4">
                                        {item.expression}
                                    </div>
                                    <div 
                                        onClick={(e) => handleDelete(e, item.id)}
                                        className="p-1.5 -mr-2 -mt-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]",
                                        item.classification === 'Tautology' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                        item.classification === 'Contradiction' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    )}>
                                        {item.classification}
                                    </span>
                                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default HistorySheet;
