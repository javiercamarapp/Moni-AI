import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AssetCardProps {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    amount: string;
    tag?: string;
    isCrypto?: boolean;
}

export const AssetCard: React.FC<AssetCardProps> = ({
    icon: Icon,
    title,
    subtitle,
    amount,
    tag,
    isCrypto = false
}) => (
    <div className="bg-white p-4 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#F5F5F4] flex items-center gap-4 mb-3 transition-transform active:scale-[0.99] cursor-pointer">
        <div className={`w-12 h-12 ${isCrypto ? 'bg-emerald-100/50 text-emerald-600' : 'bg-stone-100 text-[#57534E]'} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            <Icon size={22} strokeWidth={isCrypto ? 2 : 2} />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-[#292524] font-bold text-sm truncate">{title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[#A8A29E] text-xs font-medium truncate">{subtitle || 'Activos financieros'}</p>
                {tag && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                        {tag}
                    </span>
                )}
            </div>
        </div>
        <span className="font-bold text-[#292524] text-sm whitespace-nowrap">{amount}</span>
    </div>
);
