import React from 'react';
import { IconHome, IconSearch, IconTicket, IconUser } from './Icons';

interface BottomNavProps {
  activeTab?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab = 'profile' }) => {
  const navItems = [
    { id: 'home', icon: IconHome, label: 'Inicio' },
    { id: 'search', icon: IconSearch, label: 'Buscar' },
    { id: 'orders', icon: IconTicket, label: 'Pedidos' },
    { id: 'profile', icon: IconUser, label: 'Perfil', isActive: true },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-100 pb-safe pt-2 px-6 pb-6 z-50">
      <div className="flex justify-between items-end">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${
              item.isActive ? 'text-[#5D4037]' : 'text-gray-400'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;