import React, { useEffect, useState } from 'react';
import { AlertCircle, ShoppingCart } from 'lucide-react';
import {
    Home, Car, Utensils, Zap, Heart, PiggyBank,
    Dog, Film, GraduationCap, CreditCard, Gift,
    HelpCircle, Star, LucideIcon
} from 'lucide-react';

export interface CategorySpendingItem {
    id: string;
    categoryId: string;
    label: string;
    budget: number;
    spent: number;
    color?: string;
}

interface BudgetCategorySpendingProps {
    categories: CategorySpendingItem[];
    onOpenCategory: (categoryId: string, categoryName: string) => void;
}

// Icon mapping based on category name - matching database categories
const getCategoryIcon = (name: string): LucideIcon => {
    const nameLower = name.toLowerCase();

    // Remove emojis from name for matching
    const cleanName = nameLower.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

    if (cleanName.includes('vivienda') || cleanName.includes('casa') || cleanName.includes('renta')) return Home;
    if (cleanName.includes('transporte') || cleanName.includes('auto') || cleanName.includes('gasolina')) return Car;
    if (cleanName.includes('alimentación') || cleanName.includes('comida') || cleanName.includes('super')) return Utensils;
    if (cleanName.includes('servicio') || cleanName.includes('suscripci')) return Zap;
    if (cleanName.includes('salud') || cleanName.includes('bienestar')) return Heart;
    if (cleanName.includes('ahorro') || cleanName.includes('inversión')) return PiggyBank;
    if (cleanName.includes('mascota') || cleanName.includes('perro') || cleanName.includes('gato')) return Dog;
    if (cleanName.includes('entretenimiento') || cleanName.includes('ocio') || cleanName.includes('estilo')) return Film;
    if (cleanName.includes('educación') || cleanName.includes('desarrollo') || cleanName.includes('curso')) return GraduationCap;
    if (cleanName.includes('deuda') || cleanName.includes('crédito')) return CreditCard;
    if (cleanName.includes('apoyo') || cleanName.includes('regalo') || cleanName.includes('otro')) return Gift;
    if (cleanName.includes('no identificado')) return HelpCircle;
    if (cleanName.includes('personal')) return Star;

    return ShoppingCart; // Default icon matching Gastos
};

// Get progress bar color based on spending percentage - using coffee tones
const getProgressBarColor = (spent: number, budget: number) => {
    if (budget === 0) return 'bg-red-500';
    const ratio = spent / budget;

    if (ratio > 1) return 'bg-red-500'; // Over Budget (Critical)
    if (ratio > 0.85) return 'bg-[#5D4037]'; // Darker Coffee for warning
    return 'bg-[#8D6E63]'; // Primary Coffee color for normal spending
};

// Clean category name by removing emojis
const cleanCategoryName = (name: string): string => {
    return name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
};

const BudgetCategorySpending: React.FC<BudgetCategorySpendingProps> = ({
    categories,
    onOpenCategory
}) => {
    const maxBudget = Math.max(...categories.map(c => c.budget), 1);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Trigger animations after a slight delay
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full px-6 mt-6 pb-20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col mb-5 ml-1">
                <h3 className="text-[10px] font-bold text-[#8D6E63] uppercase tracking-widest opacity-80">
                    Recorrido de Gastos
                </h3>
                <span className="text-xs font-medium text-gray-400 mt-1">
                    Monitorea tu progreso por categoría.
                </span>
            </div>

            <div className="space-y-3">
                {categories.map((cat, index) => {
                    const Icon = getCategoryIcon(cat.label);
                    const displayName = cleanCategoryName(cat.label);
                    // Track width represents the Budget size relative to the largest budget
                    const relativeWidth = (cat.budget / maxBudget) * 100;
                    // Fill width represents Spending relative to THIS budget
                    const fillWidth = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
                    const barColor = getProgressBarColor(cat.spent, cat.budget);
                    const percent = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
                    const isOver = cat.spent > cat.budget;

                    return (
                        <div
                            key={cat.id}
                            onClick={() => onOpenCategory(cat.categoryId, cat.label)}
                            className="group flex items-center justify-between p-3.5 bg-white rounded-2xl border border-stone-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_14px_rgba(93,64,55,0.08)] hover:border-stone-200 transition-all duration-300 cursor-pointer"
                            style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                        >
                            <div className="flex items-center gap-4 w-full">
                                {/* Icon Container with Zoom Effect - Coffee styled */}
                                <div className="w-11 h-11 flex-shrink-0 rounded-full bg-[#EFEBE9] border border-[#E0D6D2] flex items-center justify-center text-[#5D4037] group-hover:bg-[#5D4037] group-hover:text-white group-hover:scale-110 transition-all duration-300 transform">
                                    <Icon size={18} strokeWidth={1.5} />
                                </div>

                                {/* Text & Progress Track */}
                                <div className="flex flex-col gap-1.5 w-full mr-1">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-bold text-[#5D4037] tracking-tight mb-0.5">{displayName}</span>
                                            {cat.budget === 0 && (
                                                <AlertCircle size={14} className="text-amber-500 mb-0.5" strokeWidth={2.5} />
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-2">
                                            {/* Percentage */}
                                            <span className={`text-[10px] font-bold ${percent > 100 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {Math.round(percent)}%
                                            </span>

                                            <div className="w-[1px] h-3 bg-stone-200"></div>

                                            {/* Amount / Budget */}
                                            <div className="flex items-center gap-1">
                                                <span className={`text-xs font-bold ${isOver ? 'text-red-500' : 'text-[#5D4037]'}`}>
                                                    ${cat.spent.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-300">de</span>
                                                <span className="text-xs font-bold text-gray-400">
                                                    ${cat.budget.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Track (Length = Budget Size relative to Max) */}
                                    <div
                                        className="h-1.5 bg-[#EFEBE9] rounded-full overflow-hidden flex transition-all duration-1000 ease-out"
                                        style={{ width: mounted ? `${Math.max(relativeWidth, 15)}%` : '0%' }}
                                    >
                                        {/* Spending Fill */}
                                        <div
                                            className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(93,64,55,0.15)]`}
                                            style={{ width: mounted ? `${Math.min(fillWidth, 100)}%` : '0%' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BudgetCategorySpending;
