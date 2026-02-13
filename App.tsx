
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import ExpressionInput from './components/ExpressionInput';
import TruthTable from './components/TruthTable';
import BottomSheet from './components/BottomSheet';
import LogicAnalysis from './components/LogicAnalysis';
import VariableSelector from './components/VariableSelector';
import SettingsSheet from './components/SettingsSheet';
import KarnaughMap from './components/KarnaughMap';
import StepByStep from './components/StepByStep';
import Onboarding from './components/Onboarding';
import HistorySheet from './components/HistorySheet';
import Workspace from './components/Workspace';
import STTTInteractive from './components/STTTInteractive';
import { analyzeLogic, extractVariablesFromExpression, reanalyzeFromRows, recalculateRow } from './utils/logic';
import { db } from './utils/db';
import { AnalysisResult, AppSettings, DEFAULT_SETTINGS, TruthTableRow, TableColumn, HistoryItem } from './types';
import { Table2, Sparkles, BrainCircuit, Settings2, AlertCircle, Grid2X2, RotateCcw, Sun, Moon, Trash2, ListEnd, History, BookOpen, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

const App: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [selectedVars, setSelectedVars] = useState<string[]>([]);
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusMode, setFocusMode] = useState(true); // V6: Focus mode enabled by default
  
  // View State
  const [currentView, setCurrentView] = useState<'calculator' | 'workspace'>('calculator');
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('lf_theme');
        if (saved === 'dark' || saved === 'light') return saved;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('lf_settings_v3');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetContent, setSheetContent] = useState<'result' | 'settings' | 'history' | 'sttt'>('result');
  const [viewMode, setViewMode] = useState<'table' | 'analysis' | 'kmap' | 'step'>('table');
  const [selectedRow, setSelectedRow] = useState<TruthTableRow | null>(null);

  // Check Onboarding
  useEffect(() => {
      const onboarded = localStorage.getItem('lf_has_onboarded');
      if (!onboarded) {
          setShowOnboarding(true);
      }
  }, []);

  const completeOnboarding = () => {
      localStorage.setItem('lf_has_onboarded', 'true');
      setShowOnboarding(false);
  };

  // Persistence & Theme
  useEffect(() => {
      localStorage.setItem('lf_settings_v3', JSON.stringify(settings));
      if (analysis && isSheetOpen && sheetContent === 'result') {
          handleGenerate();
      }
  }, [settings]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('lf_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Auto-Variable Detection
  useEffect(() => {
    const timer = setTimeout(() => {
        if (!expression.trim()) {
            setDetectedVars([]);
            return;
        }
        const detected = extractVariablesFromExpression(expression);
        setDetectedVars(detected);
    }, 300);
    return () => clearTimeout(timer);
  }, [expression]);

  // Real-time Validation for Undeclared Variables and Brackets
  useEffect(() => {
    const trimmed = expression.trim();
    if (trimmed.length === 0) {
        setIsValid(false);
        setErrorMessage(null);
        return;
    }

    // Check for undeclared variables
    const used = extractVariablesFromExpression(trimmed);
    const undeclared = used.filter(v => !selectedVars.includes(v));
    
    // Check bracket balance (simple heuristic for immediate feedback, full parser will validate stricter)
    const openBrackets = (trimmed.match(/[(\[{]/g) || []).length;
    const closeBrackets = (trimmed.match(/[)\]}]/g) || []).length;

    if (undeclared.length > 0) {
        setIsValid(false);
        setErrorMessage(`Undeclared: ${undeclared.join(', ')}`);
    } else if (selectedVars.length === 0) {
        setIsValid(false);
        setErrorMessage("Declare variables above");
    } else if (openBrackets !== closeBrackets) {
        setIsValid(false);
        setErrorMessage("Mismatched brackets");
    } else {
        setIsValid(true);
        setErrorMessage(null);
    }
  }, [expression, selectedVars]);

  const handleGenerate = async () => {
    setErrorMessage(null);
    try {
      const result = analyzeLogic(expression, selectedVars, settings);
      setAnalysis(result);
      
      // Save to IndexedDB History
      await db.addHistory({
          id: crypto.randomUUID(),
          expression,
          variables: selectedVars,
          timestamp: Date.now(),
          classification: result.classification
      });
      
      if (result.classification !== 'Contingency') {
          setViewMode('analysis');
      } else {
          setViewMode('table');
      }

      setSheetContent('result');
      setIsSheetOpen(true);
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Invalid expression");
      if (navigator.vibrate) navigator.vibrate([50, 50]);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
      setExpression(item.expression);
      setSelectedVars(item.variables);
      setIsSheetOpen(false);
  };

  const handleReset = () => {
      setExpression('');
      setSelectedVars([]);
      setDetectedVars([]);
      setAnalysis(null);
      setIsSheetOpen(false);
      if (navigator.vibrate) navigator.vibrate(20);
  };

  const openSettings = () => {
      setSheetContent('settings');
      setIsSheetOpen(true);
  };
  
  const handleRowSelect = (row: TruthTableRow) => {
      setSelectedRow(row);
      setViewMode('step');
  };

  const handleRowChange = (updatedRow: TruthTableRow, changedCol: TableColumn) => {
      if (!analysis) return;
      let finalRow = updatedRow;
      if (changedCol.isInput) {
          finalRow = recalculateRow(updatedRow, analysis.columns, analysis.ast);
      }
      const newRows = analysis.rows.map(r => r.id === finalRow.id ? finalRow : r);
      const newAnalysis = reanalyzeFromRows(analysis, newRows, settings);
      setAnalysis(newAnalysis);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary-200 selection:text-primary-900 overflow-hidden transition-colors duration-500">
      <Analytics />
      
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 h-screen flex flex-col items-center justify-center pb-32">
        
        {/* Header Actions */}
        <div className="absolute top-6 right-6 z-20 flex gap-3">
             <AnimatePresence>
                {!focusMode && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-3">
                         <button 
                            onClick={() => { setSheetContent('history'); setIsSheetOpen(true); }}
                            className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
                            title="History"
                        >
                            <History className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </button>
                        <button 
                            onClick={toggleTheme}
                            className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
                        </button>
                    </motion.div>
                )}
             </AnimatePresence>
            
            <button 
                onClick={() => setFocusMode(!focusMode)}
                className={clsx(
                    "p-3 backdrop-blur-md rounded-full shadow-sm transition-colors",
                    focusMode ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600" : "bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                )}
                title={focusMode ? "Disable Focus Mode" : "Enable Focus Mode"}
            >
                {focusMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>

            <button 
                onClick={openSettings}
                className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
                <Settings2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
        </div>

        {/* View Toggle (Calculator vs Workspace) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full p-1 flex shadow-sm">
            <button
                onClick={() => setCurrentView('calculator')}
                className={clsx(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all",
                    currentView === 'calculator' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
            >
                Calculator
            </button>
            <button
                onClick={() => setCurrentView('workspace')}
                className={clsx(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all",
                    currentView === 'workspace' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
            >
                Workspace
            </button>
        </div>

        {/* Clear Button */}
        <AnimatePresence>
            {currentView === 'calculator' && (expression || selectedVars.length > 0) && !focusMode && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-6 left-6 z-20"
                >
                    <button 
                        onClick={handleReset}
                        className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                        title="Clear Table"
                    >
                        <RotateCcw className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Calculator View */}
        {currentView === 'calculator' && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
            >
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-6"
                >
                {!focusMode && (
                    <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-800 shadow-sm rounded-2xl mb-4">
                        <Sparkles className="w-6 h-6 text-primary-500" />
                    </div>
                )}
                <h1 className={clsx(
                    "font-display font-bold text-slate-900 dark:text-white mb-2 tracking-tight transition-all",
                    focusMode ? "text-2xl opacity-50" : "text-4xl"
                )}>
                    LogicFlow <span className="text-primary-500 text-lg align-top font-mono">v6</span>
                </h1>
                {!focusMode && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Professional Logic Engine
                    </p>
                )}
                </motion.div>

                {/* Core Inputs */}
                <div className="w-full max-w-3xl flex flex-col gap-2">
                    
                    <VariableSelector 
                        selected={selectedVars} 
                        suggested={detectedVars}
                        onChange={setSelectedVars} 
                    />

                    <ExpressionInput 
                        value={expression} 
                        onChange={setExpression} 
                        onGenerate={handleGenerate} 
                        isValid={isValid} 
                    />
                    
                    <div className="h-6 px-6">
                        <AnimatePresence>
                            {errorMessage && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-xs font-medium text-red-500"
                                >
                                    <AlertCircle className="w-3 h-3" /> {errorMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        )}

        {/* Workspace View */}
        {currentView === 'workspace' && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="w-full h-full pt-20"
            >
                <Workspace />
            </motion.div>
        )}

        {/* Floating Quick Action */}
        <AnimatePresence>
            {!isSheetOpen && analysis && currentView === 'calculator' && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={() => { setSheetContent('result'); setIsSheetOpen(true); }}
                    className="absolute bottom-10 bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 px-6 py-3 rounded-full font-medium text-primary-600 dark:text-primary-400 flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <Table2 className="w-4 h-4" /> View Analysis
                </motion.button>
            )}
        </AnimatePresence>

      </main>

      {/* Sheets */}
      <BottomSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)}
        title={
            sheetContent === 'settings' ? 'Settings' : 
            sheetContent === 'history' ? 'History' :
            sheetContent === 'sttt' ? 'STTT Mode' :
            (viewMode === 'table' ? 'Truth Table' : viewMode === 'kmap' ? 'Karnaugh Map' : viewMode === 'step' ? 'Evaluation Steps' : 'Analysis')
        }
      >
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {sheetContent === 'result' && (
                <>
                    <div className="px-6 mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button 
                            onClick={() => setViewMode('table')}
                            className={clsx(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
                                viewMode === 'table' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <Table2 className="w-4 h-4" /> Table
                        </button>
                        
                        {analysis?.kMapData && (
                            <button 
                                onClick={() => setViewMode('kmap')}
                                className={clsx(
                                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
                                    viewMode === 'kmap' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <Grid2X2 className="w-4 h-4" /> K-Map
                            </button>
                        )}
                        
                        {viewMode === 'step' && (
                             <button 
                                onClick={() => setViewMode('step')}
                                className={clsx(
                                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
                                    viewMode === 'step' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <ListEnd className="w-4 h-4" /> Steps
                            </button>
                        )}

                        <button 
                            onClick={() => setViewMode('analysis')}
                            className={clsx(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
                                viewMode === 'analysis' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <BrainCircuit className="w-4 h-4" /> Analysis
                        </button>

                         <button 
                            onClick={() => setSheetContent('sttt')}
                            className={clsx(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <GraduationCap className="w-4 h-4" /> STTT
                        </button>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {viewMode === 'table' && analysis && (
                                <motion.div 
                                    key="table"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="h-full w-full"
                                >
                                    <TruthTable 
                                        rows={analysis.rows} 
                                        columns={analysis.columns}
                                        settings={settings}
                                        onRowSelect={handleRowSelect}
                                        onRowChange={handleRowChange}
                                    />
                                </motion.div>
                            )}
                            {viewMode === 'kmap' && analysis?.kMapData && (
                                <motion.div 
                                    key="kmap"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="h-full w-full overflow-y-auto"
                                >
                                    <KarnaughMap data={analysis.kMapData} expression={expression} />
                                </motion.div>
                            )}
                            {viewMode === 'step' && analysis && selectedRow && (
                                <motion.div 
                                    key="step"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full w-full overflow-y-auto"
                                >
                                    <StepByStep 
                                        ast={analysis.ast} 
                                        row={selectedRow} 
                                    />
                                </motion.div>
                            )}
                            {viewMode === 'analysis' && analysis && (
                                <motion.div 
                                    key="analysis"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full w-full overflow-y-auto"
                                >
                                    <LogicAnalysis analysis={analysis} settings={settings} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}

            {sheetContent === 'settings' && (
                <div className="h-full overflow-y-auto">
                    <SettingsSheet settings={settings} onUpdate={setSettings} />
                </div>
            )}

            {sheetContent === 'history' && (
                <HistorySheet onSelect={loadFromHistory} />
            )}

            {sheetContent === 'sttt' && analysis && (
                <STTTInteractive expression={expression} variables={analysis.variables} />
            )}
        </div>
      </BottomSheet>
    </div>
  );
};

export default App;
