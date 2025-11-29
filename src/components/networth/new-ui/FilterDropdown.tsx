import React, { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface FilterDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    options: string[];
    selectedOption: string;
    onOptionSelect: (val: string) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
    isOpen,
    onClose,
    options,
    selectedOption,
    onOptionSelect
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-stone-100 p-2 z-50 animate-[fadeIn_0.2s_ease-out] origin-top-right"
        >
            {/* Options List */}
            <div className="max-h-48 overflow-y-auto no-scrollbar">
                <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-stone-400 tracking-wider">Filtrar por</p>
                {options.map((option) => (
                    <button
                        key={option}
                        onClick={() => {
                            onOptionSelect(option);
                            onClose(); // Auto close on select for better UX since there's no multi-select
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-sm transition-colors ${selectedOption === option ? 'bg-[#8C6A5D]/5 text-[#8C6A5D] font-semibold' : 'text-stone-600 hover:bg-stone-50'}`}
                    >
                        <span>{option}</span>
                        {selectedOption === option && <Check size={16} className="text-[#8C6A5D]" />}
                    </button>
                ))}
            </div>
        </div>
    );
};
