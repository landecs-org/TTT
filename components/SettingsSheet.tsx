
import React from 'react';
import { clsx } from 'clsx';
import { AppSettings } from '../types';
import { Check, Key } from 'lucide-react';

interface SettingsSheetProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({ settings, onUpdate }) => {
  
  const updateLogic = (key: keyof AppSettings['logic'], val: any) => {
    onUpdate({ ...settings, logic: { ...settings.logic, [key]: val } });
  };
  
  const updateTable = (key: keyof AppSettings['table'], val: any) => {
    onUpdate({ ...settings, table: { ...settings.table, [key]: val } });
  };
  
  const updateAI = (key: keyof AppSettings['ai'], val: any) => {
      onUpdate({ ...settings, ai: { ...settings.ai, [key]: val } });
  }

  return (
    <div className="p-6 pb-20 space-y-8">
      
      {/* AI Settings */}
      <section className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4" /> AI Integration
        </h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Enable AI Explanations</span>
                <button 
                    onClick={() => updateAI('enabled', !settings.ai?.enabled)}
                    className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        settings.ai?.enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                    )}
                >
                    <div className={clsx(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                        settings.ai?.enabled ? "translate-x-6" : "translate-x-0"
                    )} />
                </button>
            </div>
            
            {settings.ai?.enabled && (
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Gemini API Key</label>
                    <input 
                        type="password"
                        value={settings.ai?.apiKey || ''}
                        onChange={(e) => updateAI('apiKey', e.target.value)}
                        placeholder="AIza..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-500/50"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                        Key is stored locally in your browser.
                    </p>
                </div>
            )}
        </div>
      </section>

      {/* Negation Handling */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Negation Display</h3>
        <div className="bg-surface-50 dark:bg-slate-800 rounded-xl p-1 grid grid-cols-3 gap-1">
            {[
                { id: 'preserve', label: 'Preserve', sub: '--A' },
                { id: 'normalize', label: 'Normalize', sub: '¬¬A' },
                { id: 'simplify', label: 'Simplify', sub: 'A' },
            ].map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => updateLogic('negationHandling', opt.id)}
                    className={clsx(
                        "py-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center",
                        settings.logic.negationHandling === opt.id 
                            ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400" 
                            : "text-slate-500 hover:bg-white/50"
                    )}
                >
                    <span>{opt.label}</span>
                    <span className="text-[10px] font-mono opacity-60 mt-0.5">{opt.sub}</span>
                </button>
            ))}
        </div>
      </section>

      {/* Row Order & Truth Values */}
      <section className="grid grid-cols-2 gap-4">
        <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Row Order</h3>
            <div className="bg-surface-50 dark:bg-slate-800 rounded-xl p-1 grid grid-cols-2 gap-1">
                {['0→1', '1→0'].map(opt => (
                     <button
                        key={opt}
                        onClick={() => updateLogic('rowOrder', opt)}
                        className={clsx(
                            "py-2 rounded-lg text-sm font-medium transition-all",
                            settings.logic.rowOrder === opt 
                                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                                : "text-slate-500"
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Truth Values</h3>
            <div className="bg-surface-50 dark:bg-slate-800 rounded-xl p-1 grid grid-cols-2 gap-1">
                {['0/1', 'F/T'].map(opt => (
                     <button
                        key={opt}
                        onClick={() => updateLogic('truthValues', opt)}
                        className={clsx(
                            "py-2 rounded-lg text-sm font-medium transition-all",
                            settings.logic.truthValues === opt 
                                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                                : "text-slate-500"
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
      </section>

      {/* Table Options */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Table View</h3>
        <div className="space-y-2">
            {[
                { id: 'showSubExpressions', label: 'Show intermediate steps' },
                { id: 'stickyHeaders', label: 'Sticky headers' },
                { id: 'highlightDependencies', label: 'Highlight dependencies on click' },
                { id: 'dense', label: 'Compact view' },
            ].map((opt) => (
                <button 
                    key={opt.id}
                    onClick={() => updateTable(opt.id as any, !settings.table[opt.id as keyof AppSettings['table']])}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{opt.label}</span>
                    <div className={clsx(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                        settings.table[opt.id as keyof AppSettings['table']] ? "bg-primary-600 border-primary-600" : "border-slate-300"
                    )}>
                        {settings.table[opt.id as keyof AppSettings['table']] && <Check className="w-4 h-4 text-white" />}
                    </div>
                </button>
            ))}
        </div>
      </section>

    </div>
  );
};

export default SettingsSheet;
