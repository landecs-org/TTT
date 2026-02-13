
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { AnalysisResult, AppSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ArrowRightLeft, ShieldCheck, AlertTriangle, CheckCircle2, Zap, Search, Activity, Download, FileText, BrainCircuit, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface LogicAnalysisProps {
  analysis: AnalysisResult;
  settings?: AppSettings;
}

const LogicAnalysis: React.FC<LogicAnalysisProps> = ({ analysis, settings }) => {
  const { classification, implicationForms, mainConnective, variables, rightAway, sttt, complexity } = analysis;
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const getBadgeColor = (c: string) => {
    if (c === 'Tautology') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
    if (c === 'Contradiction') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  };

  const getIcon = (c: string) => {
    if (c === 'Tautology') return <ShieldCheck className="w-5 h-5" />;
    if (c === 'Contradiction') return <AlertTriangle className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  const handleExportCSV = () => {
      const header = [...analysis.columns.map(c => c.label)];
      const rows = analysis.rows.map(r => analysis.columns.map(c => r.values[c.expression] ? '1' : '0'));
      const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logicflow_${Date.now()}.csv`;
      a.click();
  };

  const handleExplain = async () => {
      if (!settings?.ai?.apiKey) return;
      setExplaining(true);
      try {
          const ai = new GoogleGenAI({ apiKey: settings.ai.apiKey });
          const prompt = `Explain why the logical expression ${analysis.ast.expression} is a ${classification}. 
          Variables: ${variables.join(', ')}. 
          Complexity: ${complexity.operators} operators, depth ${complexity.depth}.
          Provide a concise mathematical explanation suitable for a logic student.`;
          
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });
          setExplanation(response.text || "No explanation generated.");
      } catch (e) {
          setExplanation("Failed to generate explanation. Check API Key.");
      } finally {
          setExplaining(false);
      }
  };

  return (
    <div className="p-6 pb-20 max-w-2xl mx-auto w-full flex flex-col gap-6">
      
      {/* Classification Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
            "p-5 rounded-2xl border flex items-start gap-4 shadow-sm",
            getBadgeColor(classification)
        )}
      >
        <div className="mt-1">{getIcon(classification)}</div>
        <div>
            <h3 className="font-display font-bold text-lg mb-1">{classification}</h3>
            <p className="text-sm opacity-90 leading-relaxed">
                {classification === 'Tautology' && "This proposition is always true, regardless of the truth values of its variables."}
                {classification === 'Contradiction' && "This proposition is always false (an absurdity)."}
                {classification === 'Contingency' && `This proposition is true in some cases and false in others.`}
            </p>
        </div>
      </motion.div>

      {/* Complexity Metrics */}
      <div className="grid grid-cols-3 gap-2">
           <div className="bg-surface-50 dark:bg-slate-800 p-3 rounded-xl border border-surface-200 dark:border-slate-700 text-center">
               <div className="text-xs text-slate-400 uppercase font-bold mb-1">Operators</div>
               <div className="text-lg font-mono font-bold text-slate-700 dark:text-white">{complexity.operators}</div>
           </div>
           <div className="bg-surface-50 dark:bg-slate-800 p-3 rounded-xl border border-surface-200 dark:border-slate-700 text-center">
               <div className="text-xs text-slate-400 uppercase font-bold mb-1">Depth</div>
               <div className="text-lg font-mono font-bold text-slate-700 dark:text-white">{complexity.depth}</div>
           </div>
           <div className="bg-surface-50 dark:bg-slate-800 p-3 rounded-xl border border-surface-200 dark:border-slate-700 text-center">
               <div className="text-xs text-slate-400 uppercase font-bold mb-1">Rows</div>
               <div className="text-lg font-mono font-bold text-slate-700 dark:text-white">{complexity.totalRows}</div>
           </div>
      </div>

      {/* RightAway (RW) Result */}
      {rightAway?.isApplicable && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-5 rounded-2xl relative overflow-hidden"
          >
              <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Zap className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">RightAway™ Simplified</span>
              </div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Logically Equivalent to {rightAway.resultValue !== undefined ? (rightAway.resultValue ? '1 (True)' : '0 (False)') : rightAway.variable}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                  {rightAway.explanation}
              </p>
          </motion.div>
      )}

      {/* Implication Forms (if applicable) */}
      {mainConnective === 'IMPLIES' && implicationForms && (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <h4 className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" /> Conditional Forms
            </h4>
            
            <div className="grid gap-3">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">CONVERSE (Q → P)</span>
                    <div className="font-mono text-slate-800 dark:text-slate-200">{implicationForms.converse}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">INVERSE (¬P → ¬Q)</span>
                    <div className="font-mono text-slate-800 dark:text-slate-200">{implicationForms.inverse}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <span className="text-xs font-bold text-primary-500 block mb-1">CONTRAPOSITIVE (¬Q → ¬P)</span>
                    <div className="font-mono font-medium text-slate-900 dark:text-white">{implicationForms.contrapositive}</div>
                    <div className="mt-2 text-xs text-slate-400">Logically equivalent to original.</div>
                </div>
            </div>
        </motion.div>
      )}

      {/* Actions: Export & AI */}
      <div className="flex gap-3">
           <button 
                onClick={handleExportCSV}
                className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
           >
               <Download className="w-4 h-4" /> Export CSV
           </button>
           
           {settings?.ai?.enabled && settings.ai.apiKey && (
               <button 
                    onClick={handleExplain}
                    disabled={explaining}
                    className="flex-1 py-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-indigo-700 dark:text-indigo-300 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center justify-center gap-2"
               >
                   {explaining ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                   {explaining ? "Thinking..." : "Explain Logic"}
               </button>
           )}
      </div>

      {/* AI Explanation Result */}
      <AnimatePresence>
          {explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl overflow-hidden"
              >
                  <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                      <BrainCircuit className="w-5 h-5" />
                      <span className="font-bold text-sm">AI Analysis</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {explanation}
                  </p>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
};

export default LogicAnalysis;
