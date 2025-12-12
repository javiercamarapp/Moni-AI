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
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 right-0 flex items-center gap-2"
          >
            {/* Income button - LEFT */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => handleRecord('income')}
              className="flex items-center justify-center gap-2 bg-[#5D4037] text-white rounded-full px-4 py-2.5 shadow-lg hover:bg-[#4E342E] transition-colors min-w-[100px]"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Ingreso</span>
            </motion.button>

            {/* Expense button - RIGHT */}
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1, delay: 0.05 }}
              onClick={() => handleRecord('expense')}
              className="flex items-center justify-center gap-2 bg-[#D4A574] text-white rounded-full px-4 py-2.5 shadow-lg hover:bg-[#C4956A] transition-colors min-w-[100px]"
            >
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Gasto</span>
            </motion.button>
          </motion.div>
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
