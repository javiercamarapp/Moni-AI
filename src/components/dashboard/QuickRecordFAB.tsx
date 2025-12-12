import React, { useState } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Mic, Camera, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VoiceRecordingModal from './VoiceRecordingModal';

const QuickRecordFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleRecord = (type: 'income' | 'expense') => {
    setIsOpen(false);
    navigate('/movimientos', { 
      state: { 
        openAddModal: true, 
        defaultType: type
      } 
    });
  };

  const openVoiceRecording = () => {
    setIsOpen(false);
    setIsVoiceModalOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Income button - top left */}
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, x: -70, y: -70 }}
                exit={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => handleRecord('income')}
                className="absolute bottom-0 right-0 flex items-center gap-2 bg-[#A1887F] text-white rounded-full px-4 py-2.5 shadow-lg hover:bg-[#8D6E63] transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Ingreso</span>
              </motion.button>

              {/* Expense button - top */}
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, y: -110 }}
                exit={{ opacity: 0, scale: 0.5, y: 0 }}
                transition={{ duration: 0.15, delay: 0.05 }}
                onClick={() => handleRecord('expense')}
                className="absolute bottom-0 right-0 flex items-center gap-2 bg-[#5D4037] text-white rounded-full px-4 py-2.5 shadow-lg hover:bg-[#4E342E] transition-colors"
              >
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">Gasto</span>
              </motion.button>

              {/* Voice button - top right */}
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, x: 70, y: -70 }}
                exit={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                transition={{ duration: 0.15, delay: 0.1 }}
                onClick={openVoiceRecording}
                className="absolute bottom-0 right-0 flex items-center justify-center w-11 h-11 bg-white text-[#5D4037] rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <Mic className="w-5 h-5" />
              </motion.button>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-[#5D4037] text-white shadow-xl flex items-center justify-center hover:bg-[#4E342E] transition-colors"
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

      <VoiceRecordingModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </>
  );
};

export default QuickRecordFAB;
