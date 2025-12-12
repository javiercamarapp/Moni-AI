import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickRecordFAB: React.FC = () => {
  const navigate = useNavigate();

  const handleRecord = (type: 'income' | 'expense') => {
    navigate('/movimientos', { state: { openAddModal: true, defaultType: type } });
  };

  return (
    <>
      {/* Gasto button - LEFT */}
      <button
        onClick={() => handleRecord('expense')}
        className="fixed bottom-24 left-6 z-50 flex items-center gap-2 bg-[#5D4037] text-white rounded-full px-4 py-3 shadow-xl hover:bg-[#4E342E] transition-all hover:-translate-y-0.5"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Gasto</span>
      </button>

      {/* Ingreso button - RIGHT */}
      <button
        onClick={() => handleRecord('income')}
        className="fixed bottom-24 right-6 z-50 flex items-center gap-2 bg-[#A1887F] text-white rounded-full px-4 py-3 shadow-xl hover:bg-[#8D6E63] transition-all hover:-translate-y-0.5"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Ingreso</span>
      </button>
    </>
  );
};

export default QuickRecordFAB;
