import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ASTNode, TruthTableRow } from '../types';
import { Play, Pause, SkipForward, SkipBack, CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface StepByStepProps {
  ast: ASTNode;
  row: TruthTableRow;
  onClose?: () => void;
}

interface Step {
  node: ASTNode;
  result: boolean;
  explanation: string;
  depth: number;
}

const StepByStep: React.FC<StepByStepProps> = ({ ast, row, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  // Generate steps on mount or row change
  useEffect(() => {
    const generatedSteps: Step[] = [];
    
    // Post-order traversal to get evaluation order
    const traverse = (node: ASTNode) => {
        if (node.left) traverse(node.left);
        if (node.right) traverse(node.right);
        if (node.operand) traverse(node.operand);
        
        // Don't show steps for simple variables, only operations
        if (node.type !== 'VAR') {
            const result = evaluateNode(node);
            generatedSteps.push({
                node,
                result,
                explanation: generateExplanation(node, result),
                depth: node.depth
            });
        }
    };

    const evaluateNode = (node: ASTNode): boolean => {
       // Helper to just get value from row for display
       // We assume row.values contains all sub-expressions keys or we recurse?
       // logic.ts calculates all sub-expressions. 
       // However, `row.values` keys are expressions strings.
       // It's safer to use the expression string to look up the pre-calculated value.
       return row.values[node.expression]; 
    };

    const generateExplanation = (node: ASTNode, result: boolean): string => {
        const val = (n: ASTNode) => row.values[n.expression] ? 'True' : 'False';
        
        if (node.type === 'NOT' && node.operand) {
            return `Since ${node.operand.expression} is ${val(node.operand)}, its negation is ${result ? 'True' : 'False'}.`;
        }
        if (node.left && node.right) {
            const lVal = val(node.left);
            const rVal = val(node.right);
            if (node.type === 'AND') return `${lVal} AND ${rVal} results in ${result ? 'True' : 'False'}.`;
            if (node.type === 'OR') return `${lVal} OR ${rVal} results in ${result ? 'True' : 'False'}.`;
            if (node.type === 'IMPLIES') return `${lVal} → ${rVal} results in ${result ? 'True' : 'False'}.`;
            if (node.type === 'IFF') return `${lVal} ↔ ${rVal} results in ${result ? 'True' : 'False'}.`;
            if (node.type === 'XOR') return `${lVal} ⊕ ${rVal} results in ${result ? 'True' : 'False'}.`;
        }
        return '';
    };

    traverse(ast);
    setSteps(generatedSteps);
    setCurrentStepIndex(0);
    setIsPlaying(true);
  }, [ast, row]);

  // Auto-play effect
  useEffect(() => {
    let timer: any;
    if (isPlaying && currentStepIndex < steps.length - 1) {
        timer = setTimeout(() => {
            setCurrentStepIndex(prev => prev + 1);
        }, 2500); // 2.5s per step
    } else if (currentStepIndex === steps.length - 1) {
        setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  const currentStep = steps[currentStepIndex];

  if (!currentStep) return <div className="p-8 text-center text-slate-500">Initializing evaluation...</div>;

  return (
    <div className="p-6 flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Evaluation Mode</h3>
            <p className="font-mono text-xs text-slate-400 mt-1">Row {row.index + 1}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <SkipBack className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <SkipForward className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] relative">
         {/* Expression Visualization */}
         <div className="text-center mb-10">
            <div className="text-2xl font-mono font-medium text-slate-900 dark:text-white mb-2">
                {currentStep.node.expression}
            </div>
            <div className={clsx(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold",
                currentStep.result ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            )}>
                {currentStep.result ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {currentStep.result ? 'Evaluates to True' : 'Evaluates to False'}
            </div>
         </div>

         {/* Explanation Card */}
         <AnimatePresence mode="wait">
            <motion.div 
                key={currentStepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-surface-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md text-center shadow-sm"
            >
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {currentStep.explanation}
                </p>
            </motion.div>
         </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-6">
          <motion.div 
            className="h-full bg-primary-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
      </div>
      <div className="text-center mt-2 text-xs text-slate-400 font-mono">
          Step {currentStepIndex + 1} of {steps.length}
      </div>
    </div>
  );
};

export default StepByStep;