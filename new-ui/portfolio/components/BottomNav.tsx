import React from 'react';
import { Home, PieChart, TrendingUp, User, CreditCard } from 'lucide-react';

const BottomNav: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-6 pb-6 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#5D4037] transition-colors">
          <Home size={24} />
        </button>
        <button className="flex flex-col items-center gap-1 text-[#5D4037]">
           {/* Active State */}
          <TrendingUp size={24} strokeWidth={2.5} />
          <span className="w-1.5 h-1.5 bg-[#5D4037] rounded-full mt-1"></span>
        </button>
        <div className="w-12"></div> {/* Spacer for FAB if needed, or just center balance */}
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#5D4037] transition-colors">
          <PieChart size={24} />
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#5D4037] transition-colors">
          <User size={24} />
        </button>
      </div>
    </div>
  );
};

export default BottomNav;