import React from 'react';
import { MenuItemProps } from '../types';
import { IconChevronRight } from './Icons';

interface MenuSectionProps {
  title?: string;
  items: MenuItemProps[];
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, items }) => {
  return (
    <div className="mb-6">
      {title && (
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
          {title}
        </h4>
      )}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        {items.map((item, index) => (
          <div key={index}>
            <div 
                onClick={() => {
                   if (item.isToggle && item.onToggle) {
                      item.onToggle(!item.isToggled);
                   } else if (item.onClick) {
                      item.onClick();
                   }
                }}
                className={`w-full flex items-center justify-between p-4 transition-colors ${item.onClick || item.isToggle ? 'cursor-pointer active:bg-gray-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`
                    ${item.isDestructive ? 'text-red-500' : 'text-gray-600'}
                `}>
                  {item.icon}
                </div>
                <span className={`font-medium text-sm ${item.isDestructive ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.isToggle ? (
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${item.isToggled ? 'bg-[#5D4037]' : 'bg-gray-200'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ${item.isToggled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                ) : (
                  <>
                    {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor ? item.badgeColor : 'bg-red-100 text-red-600'}`}>
                            {item.badge}
                        </span>
                    )}
                    <IconChevronRight className="w-4 h-4 text-gray-300" />
                  </>
                )}
              </div>
            </div>
            {index < items.length - 1 && (
                <div className="h-[1px] bg-gray-100 mx-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuSection;