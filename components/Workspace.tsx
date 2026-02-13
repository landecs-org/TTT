
import React, { useState, useEffect } from 'react';
import { WorkspaceState, ProofStep } from '../types';
import { db } from '../utils/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, AlertCircle, Save, Trash2, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

const Workspace: React.FC = () => {
    const [premises, setPremises] = useState('');
    const [conclusion, setConclusion] = useState('');
    const [steps, setSteps] = useState<ProofStep[]>([]);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadWorkspace();
    }, []);

    const loadWorkspace = async () => {
        const data = await db.getWorkspace();
        if (data) {
            setPremises(data.premises);
            setConclusion(data.conclusion);
            setSteps(data.steps);
        }
    };

    const handleSave = async () => {
        await db.saveWorkspace({ premises, conclusion, steps });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const addStep = () => {
        setSteps([...steps, { 
            id: crypto.randomUUID(), 
            content: '', 
            justification: '' 
        }]);
    };

    const updateStep = (id: string, field: keyof ProofStep, value: string) => {
        setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const deleteStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    // Mock validation logic for V4 demo
    const validateStep = (step: ProofStep): ProofStep => {
        // In a real app, this would use the logic engine
        const isValid = step.content.length > 0 && step.justification.length > 0;
        return { ...step, isValid, error: isValid ? undefined : 'Complete both fields' };
    };

    return (
        <div className="h-full flex flex-col bg-surface-50 dark:bg-slate-950 overflow-y-auto pb-32">
            <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Logical Workspace</h2>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
                    >
                        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Saved' : 'Save Work'}
                    </button>
                </div>

                {/* Problem Statement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Assume (Premises)</label>
                        <textarea 
                            value={premises}
                            onChange={e => setPremises(e.target.value)}
                            className="w-full bg-transparent resize-none outline-none font-mono text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 h-24"
                            placeholder="P → Q&#10;Q → R"
                        />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-bold uppercase tracking-wider text-primary-500 mb-2">Show (Conclusion)</label>
                        <textarea 
                            value={conclusion}
                            onChange={e => setConclusion(e.target.value)}
                            className="w-full bg-transparent resize-none outline-none font-mono text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 h-24"
                            placeholder="P → R"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 py-4">
                     <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                     <span className="text-slate-400 font-mono text-sm">PROOF</span>
                     <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                </div>

                {/* Steps */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {steps.map((step, index) => (
                            <motion.div 
                                layout
                                key={step.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="group relative flex gap-4 items-start"
                            >
                                <div className="w-8 pt-4 text-center font-mono text-slate-400 text-sm">{index + 1}.</div>
                                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 flex shadow-sm focus-within:ring-2 ring-primary-500/20 transition-all">
                                    <input 
                                        type="text" 
                                        value={step.content}
                                        onChange={e => updateStep(step.id, 'content', e.target.value)}
                                        placeholder="Statement"
                                        className="flex-1 bg-transparent px-4 py-3 font-mono text-slate-900 dark:text-white outline-none"
                                    />
                                    <div className="w-px bg-slate-100 dark:bg-slate-700 my-2" />
                                    <input 
                                        type="text" 
                                        value={step.justification}
                                        onChange={e => updateStep(step.id, 'justification', e.target.value)}
                                        placeholder="Justification"
                                        className="flex-1 bg-transparent px-4 py-3 font-sans text-slate-600 dark:text-slate-400 outline-none"
                                    />
                                    
                                    <button 
                                        onClick={() => deleteStep(step.id)}
                                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button 
                        onClick={addStep}
                        className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 font-bold hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Add Step
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Workspace;
