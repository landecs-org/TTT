
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Check, X, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { evaluateRawExpression } from '../utils/logic';

interface STTTInteractiveProps {
    expression: string;
    variables: string[];
}

const STTTInteractive: React.FC<STTTInteractiveProps> = ({ expression, variables }) => {
    const [mode, setMode] = useState<'Tautology' | 'Contradiction' | null>(null);
    const [assumptions, setAssumptions] = useState<Record<string, boolean | null>>({});
    const [result, setResult] = useState<{ status: 'Success' | 'Failure', message: string } | null>(null);

    const startTest = (m: 'Tautology' | 'Contradiction') => {
        setMode(m);
        setAssumptions(Object.fromEntries(variables.map(v => [v, null])));
        setResult(null);
    };

    const toggleAssumption = (v: string) => {
        setAssumptions(prev => {
            const current = prev[v];
            const next = current === null ? true : current === true ? false : null;
            return { ...prev, [v]: next };
        });
        setResult(null); // Reset result on change
    };

    const checkLogic = () => {
        const allSet = Object.values(assumptions).every(val => val !== null);
        if (!allSet) {
             setResult({ status: 'Failure', message: 'Please assign values to all variables first.' });
             return;
        }

        const context = assumptions as Record<string, boolean>;
        const exprValue = evaluateRawExpression(expression, context);
        
        // Mode: Tautology -> Assumption: False
        // If exprValue is False, we found a counter-example. Success!
        // If exprValue is True, we failed to prove it's NOT a tautology with this row.
        
        // Mode: Contradiction -> Assumption: True
        // If exprValue is True, we found a row that works. Success (it's NOT a contradiction).
        
        if (mode === 'Tautology') {
            if (exprValue === false) {
                 setResult({ 
                     status: 'Success', 
                     message: 'Counter-example found! The expression evaluates to FALSE with these inputs. Therefore, it is NOT a Tautology (it is Contingent or Contradiction).'
                 });
            } else {
                 setResult({ 
                     status: 'Failure', 
                     message: 'The expression evaluates to TRUE. This row does not disprove Tautology. Try different values.' 
                 });
            }
        } else {
            // Contradiction Mode
            if (exprValue === true) {
                 setResult({ 
                     status: 'Success', 
                     message: 'Counter-example found! The expression evaluates to TRUE with these inputs. Therefore, it is NOT a Contradiction.'
                 });
            } else {
                 setResult({ 
                     status: 'Failure', 
                     message: 'The expression evaluates to FALSE. This row does not disprove Contradiction. Try different values.' 
                 });
            }
        }
    };

    if (!mode) {
        return (
            <div className="p-6 text-center space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Shortened Truth Table Technique</h3>
                    <p className="text-slate-500 text-sm mt-2">Test validity by assuming the opposite and attempting to find a matching row.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => startTest('Tautology')}
                        className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl hover:scale-105 transition-transform"
                    >
                        <div className="text-blue-600 dark:text-blue-400 font-bold mb-1">Test for Tautology</div>
                        <div className="text-xs text-slate-500">Assume False → Find matching row</div>
                    </button>
                    <button 
                        onClick={() => startTest('Contradiction')}
                        className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl hover:scale-105 transition-transform"
                    >
                        <div className="text-red-600 dark:text-red-400 font-bold mb-1">Test for Contradiction</div>
                        <div className="text-xs text-slate-500">Assume True → Find matching row</div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Testing for {mode}</h3>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        Assumption: Expression is <span className="font-mono font-bold">{mode === 'Tautology' ? 'FALSE (0)' : 'TRUE (1)'}</span>
                    </div>
                </div>
                <button onClick={() => setMode(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                {/* Expression Visualization */}
                <div className="text-2xl font-mono text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    {expression}
                    <div className="mt-2 text-sm text-slate-400 font-sans">
                        Assign values to force the assumption
                    </div>
                </div>

                <ArrowDown className="w-6 h-6 text-slate-300" />

                {/* Variable Assignments */}
                <div className="flex flex-wrap gap-4 justify-center">
                    {variables.map(v => (
                        <button 
                            key={v}
                            onClick={() => toggleAssumption(v)}
                            className={clsx(
                                "w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all",
                                assumptions[v] === true ? "bg-green-100 border-green-500 text-green-700" :
                                assumptions[v] === false ? "bg-red-100 border-red-500 text-red-700" :
                                "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                            )}
                        >
                            <span className="font-bold text-lg">{v}</span>
                            <span className="text-xs font-mono">
                                {assumptions[v] === true ? '1' : assumptions[v] === false ? '0' : '?'}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Result State */}
                {result && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={clsx(
                            "p-4 rounded-xl flex items-start gap-3 max-w-md",
                            result.status === 'Success' ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                        )}
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            {result.status === 'Success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <span className="text-sm font-medium">
                            {result.message}
                        </span>
                    </motion.div>
                )}
                
                 <button 
                    onClick={checkLogic}
                    className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                >
                    Check Logic
                </button>
            </div>
        </div>
    );
};

export default STTTInteractive;
