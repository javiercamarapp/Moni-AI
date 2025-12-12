import React, { useState } from 'react';
import { Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const QuickRecordFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleRecord = (type: 'income' | 'expense') => {
    setIsOpen(false);
    navigate('/movimientos', { state: { openAddModal: true, defaultType: type } });
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Income button */}
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleRecord('income')}
              className="absolute bottom-32 right-0 flex items-center justify-center gap-2 bg-[#5D4037] text-white rounded-full px-4 py-2.5 shadow-lg hover:bg-[#4E342E] transition-colors min-w-[110px]"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Ingreso</span>
            </motion.button>

            {/* Expense button */}
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              onClick={() => handleRecord('expense')}
              className="absolute bottom-[72px] right-0 flex items-center justify-center gap-2 bg-[#BCAAA4] text-white rounded-full px-4 py-2.5 shadow-lg hover:bg-[#A1887F] transition-colors min-w-[110px]"
            >
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Gasto</span>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#8D6E63] text-white shadow-xl flex items-center justify-center hover:bg-[#6D4C41] transition-colors"
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default QuickRecordFAB;
