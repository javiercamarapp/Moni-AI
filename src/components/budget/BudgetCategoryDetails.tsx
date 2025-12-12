import React from 'react';
import { Receipt, CreditCard, ShoppingCart } from 'lucide-react';
import {
    Home, Car, Utensils, Zap, Heart, PiggyBank,
    Dog, Film, GraduationCap, Gift,
    HelpCircle, Star, LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    paymentMethod: string;
}

interface BudgetCategoryDetailsProps {
    categoryName: string;
    budget: number;
    spent: number;
    expenses: Expense[];
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
    if (cleanName.includes('apoyo') || cleanName.includes('regalo') || cleanName.includes('otro')) return Gift;
    if (cleanName.includes('no identificado')) return HelpCircle;
    if (cleanName.includes('personal')) return Star;

    return ShoppingCart; // Default icon matching Gastos
};

// Clean category name by removing emojis
const cleanCategoryName = (name: string): string => {
    return name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
};

const BudgetCategoryDetails: React.FC<BudgetCategoryDetailsProps> = ({
    categoryName,
    budget,
    spent,
    expenses
}) => {
    const Icon = getCategoryIcon(categoryName);
    const displayName = cleanCategoryName(categoryName);
    const percent = budget > 0 ? (spent / budget) * 100 : 0;
    const isOver = spent > budget;
    const hasExpenses = expenses && expenses.length > 0;

    // Format date for display (expecting format like "2024-01-15")
    const formatDate = (dateStr: string) => {
        try {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            const dayNum = date.getDate().toString().padStart(2, '0');
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const monthName = monthNames[date.getMonth()];
            return { day: dayNum, month: monthName };
        } catch {
            return { day: '--', month: '---' };
        }
    };

    return (
        <div className="w-full px-6 mt-6 animate-fade-in pb-20">

            {/* Summary Card */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-stone-100 mb-8 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#5D4037] opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-[#EFEBE9] border border-[#E0D6D2] flex items-center justify-center text-[#5D4037] shadow-sm">
                        <Icon size={26} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#5D4037] tracking-tight">{displayName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-[#5D4037]'}`}>
                                ${spent.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-gray-300">de</span>
                            <span className="text-sm font-bold text-gray-400">
                                ${budget.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Big Progress Bar - Coffee tones */}
                <div className="w-full h-3 bg-[#EFEBE9] rounded-full overflow-hidden border border-stone-50 mb-2">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isOver ? 'bg-red-500' : 'bg-gradient-to-r from-[#8D6E63] to-[#5D4037]'}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>0%</span>
                    <span>{Math.round(percent)}% utilizado</span>
                </div>
            </div>

            {/* Expenses List - Matching Gastos styling */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-[#8D6E63] uppercase tracking-widest pl-1 mb-2">
                    Movimientos Recientes
                </h3>

                {!hasExpenses ? (
                    <div className="p-8 text-center bg-[#EFEBE9]/50 rounded-2xl border border-stone-100 border-dashed">
                        <Receipt size={32} className="mx-auto text-[#8D6E63]/40 mb-3" />
                        <p className="text-gray-400 font-medium text-sm">No hay gastos registrados en este periodo.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {expenses.map((expense, index) => {
                            const { day, month } = formatDate(expense.date);
                            return (
                                <div
                                    key={expense.id}
                                    className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 group cursor-pointer hover:shadow-md transition-all animate-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Icon matching Gastos */}
                                    <div className="w-9 h-9 rounded-xl bg-[#EFEBE9] flex items-center justify-center flex-shrink-0">
                                        <ShoppingCart className="w-4 h-4 text-[#5D4037]" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 text-sm truncate">{expense.description}</h4>
                                        <p className="text-[10px] text-gray-500 font-medium">
                                            {day} {month}
                                        </p>
                                        {expense.paymentMethod && (
                                            <Badge className="text-[9px] font-medium px-1.5 py-0 rounded bg-gray-100 text-gray-600 border-0 capitalize mt-0.5">
                                                {expense.paymentMethod}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <span className="block font-bold text-[#5D4037] text-sm flex-shrink-0">
                                        -${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BudgetCategoryDetails;
