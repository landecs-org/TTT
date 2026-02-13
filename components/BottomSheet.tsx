import React, { useEffect } from 'react';
import { motion, useAnimation, PanInfo, useMotionValue, useDragControls, Variants, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const y = useMotionValue(0);

  // Constants
  const DRAG_THRESHOLD = 150;

  useEffect(() => {
    if (isOpen) {
      controls.start('visible');
    } else {
      controls.start('hidden');
    }
  }, [isOpen, controls]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 300) {
      onClose();
    } else {
      controls.start('visible');
    }
  };

  const variants: Variants = {
    hidden: { y: '100%', opacity: 0, transition: { type: "spring", damping: 30, stiffness: 300 } },
    visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 30, stiffness: 400 } },
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
        )}
      </AnimatePresence>

      {/* Sheet */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false} 
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial="hidden"
        animate={controls}
        variants={variants}
        style={{ y }}
        className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 z-50 rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800"
      >
        {/* Drag Handle / Header Area */}
        <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="w-full pt-4 pb-2 flex flex-col items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing touch-none bg-white dark:bg-slate-900"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-4" />
          
          <div className="w-full px-6 flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">{title}</h2>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"
            >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 relative">
          {children}
        </div>
      </motion.div>
    </>
  );
};

export default BottomSheet;