import { useState } from 'react';
import { Zap, AlertCircle, Bug, AlertOctagon, X, Wallet } from 'lucide-react';

interface ExpenseItem {
    id: string;
    title: string;
    mainValue: string;
    subValueLeft: string;
    subValueRight: string;
    icon: React.ElementType;
    theme: 'orange' | 'purple' | 'amber' | 'red';
    details: {
        description: string;
        advice: string;
        topItem: string;
    };
}

interface ExpenseControlCarouselProps {
    fixed: number;
    variable: number;
    ant: number;
    impulsive: number;
    totalExpenses: number;
    fixedCount?: number;
    variableCount?: number;
    antCount?: number;
    impulsiveCount?: number;
    topExpenses?: {
        fixed: string;
        variable: string;
        ant: string;
        impulsive: string;
    };
}

const ExpenseCard = ({ item, onClick }: { item: ExpenseItem; onClick: () => void }) => {
    const themeStyles = {
        orange: 'bg-[#FFF7ED] border-[#FFEDD5] text-[#C2410C]',
        purple: 'bg-[#FAF5FF] border-[#F3E8FF] text-[#7E22CE]',
        amber: 'bg-[#FEFCE8] border-[#FEF08A] text-[#B45309]',
        red: 'bg-[#FEF2F2] border-[#FEE2E2] text-[#B91C1C]',
    };

    const iconColors = {
        orange: 'text-[#EA580C]',
        purple: 'text-[#9333EA]',
        amber: 'text-[#D97706]',
        red: 'text-[#DC2626]',
    };

    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 w-[150px] h-[120px] rounded-[1.5rem] p-4 flex flex-col justify-between text-left relative transition-transform active:scale-95 border-b-4 ${themeStyles[item.theme].split(' ')[1]} ${themeStyles[item.theme].split(' ')[0]}`}
        >
            <div className="flex justify-between items-start w-full mb-1">
                <span className="text-xs font-bold text-[#78716C]">{item.title}</span>
                <item.icon size={16} className={iconColors[item.theme]} />
            </div>

            <div className={`text-2xl font-black ${themeStyles[item.theme].split(' ')[2]} tracking-tight`}>
                {item.mainValue}
            </div>

            <div className="flex justify-between items-center w-full mt-1">
                <span className="text-[10px] font-bold text-[#A8A29E]">{item.subValueLeft}</span>
                <span className="text-[9px] font-medium text-[#78716C] opacity-80">{item.subValueRight}</span>
            </div>
        </button>
    );
};

const ExpenseModal = ({ item, onClose }: { item: ExpenseItem | null; onClose: () => void }) => {
    if (!item) return null;

    const themeColors = {
        orange: 'text-[#C2410C] bg-[#FFF7ED]',
        purple: 'text-[#7E22CE] bg-[#FAF5FF]',
        amber: 'text-[#B45309] bg-[#FEFCE8]',
        red: 'text-[#B91C1C] bg-[#FEF2F2]',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#292524]/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white w-full max-w-[320px] rounded-[2rem] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${themeColors[item.theme].split(' ')[1]}`}>
                        <item.icon size={14} className={themeColors[item.theme].split(' ')[0]} />
                        <span className={`text-xs font-extrabold uppercase ${themeColors[item.theme].split(' ')[0]}`}>{item.title}</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-[#F5F5F4] rounded-full text-[#78716C]">
                        <X size={18} />
                    </button>
                </div>

                <div className="text-center mb-6">
                    <p className="text-xs text-[#A8A29E] font-bold uppercase mb-1">Total del mes</p>
                    <h2 className={`text-4xl font-black ${themeColors[item.theme].split(' ')[0]}`}>{item.mainValue}</h2>
                    <div className="flex justify-center gap-4 mt-2 text-xs font-medium text-[#78716C]">
                        <span>{item.subValueLeft}</span>
                        <span>•</span>
                        <span>{item.subValueRight}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="bg-[#FAFAF9] rounded-xl p-3 border border-[#E7E5E4]">
                        <p className="text-[10px] font-bold text-[#A8A29E] uppercase mb-1">Descripción</p>
                        <p className="text-xs text-[#57534E] leading-relaxed">{item.details.description}</p>
                    </div>

                    <div className="bg-[#FAFAF9] rounded-xl p-3 border border-[#E7E5E4]">
                        <p className="text-[10px] font-bold text-[#A8A29E] uppercase mb-1">Mayor gasto</p>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-[#292524]">{item.details.topItem.split(':')[0]}</p>
                            <p className={`text-xs font-bold ${themeColors[item.theme].split(' ')[0]}`}>{item.details.topItem.split(':')[1]}</p>
                        </div>
                    </div>

                    <div className={`rounded-xl p-3 flex gap-2 items-start ${themeColors[item.theme].split(' ')[1]}`}>
                        <Zap size={14} className={`mt-0.5 flex-shrink-0 ${themeColors[item.theme].split(' ')[0]}`} />
                        <p className={`text-[10px] font-bold leading-tight ${themeColors[item.theme].split(' ')[0]}`}>
                            {item.details.advice}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ExpenseControlCarousel = ({
    fixed,
    variable,
    ant,
    impulsive,
    totalExpenses,
    fixedCount = 0,
    variableCount = 0,
    antCount = 0,
    impulsiveCount = 0,
    topExpenses,
}: ExpenseControlCarouselProps) => {
    const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);

    const EXPENSES: ExpenseItem[] = [
        {
            id: 'fijos',
            title: 'Fijos',
            mainValue: `$${(fixed / 1000).toFixed(1)}k`,
            subValueLeft: `${fixedCount} gastos`,
            subValueRight: totalExpenses > 0 ? `${((fixed / totalExpenses) * 100).toFixed(0)}% del gasto` : '0%',
            icon: AlertCircle,
            theme: 'orange',
            details: {
                description: 'Gastos recurrentes y obligatorios como renta, servicios y suscripciones.',
                advice: 'Revisa suscripciones que no uses. Representan una gran parte de tu presupuesto.',
                topItem: topExpenses?.fixed || 'Sin datos: $0'
            }
        },
        {
            id: 'variables',
            title: 'Variables',
            mainValue: `$${(variable / 1000).toFixed(1)}k`,
            subValueLeft: `${variableCount} gastos`,
            subValueRight: totalExpenses > 0 ? `${((variable / totalExpenses) * 100).toFixed(0)}% del gasto` : '0%',
            icon: Zap,
            theme: 'purple',
            details: {
                description: 'Gastos que cambian mes a mes: comida, transporte, diversión.',
                advice: 'Este es el rubro más fácil de recortar. Intenta cocinar más en casa.',
                topItem: topExpenses?.variable || 'Sin datos: $0'
            }
        },
        {
            id: 'hormiga',
            title: 'Hormiga',
            mainValue: `$${(ant / 1000).toFixed(1)}k`,
            subValueLeft: `${antCount} gastos`,
            subValueRight: totalExpenses > 0 ? `${((ant / totalExpenses) * 100).toFixed(0)}% del gasto` : '0%',
            icon: Bug,
            theme: 'amber',
            details: {
                description: 'Pequeños gastos diarios imperceptibles: café, propinas, snacks.',
                advice: 'Lleva tu propio café o snacks. $50 diarios suman $1,500 al mes.',
                topItem: topExpenses?.ant || 'Sin datos: $0'
            }
        },
        {
            id: 'impulsivos',
            title: 'Impulsivos',
            mainValue: `${impulsiveCount}`,
            subValueLeft: 'compras',
            subValueRight: `$${(impulsive / 1000).toFixed(1)}k`,
            icon: AlertOctagon,
            theme: 'red',
            details: {
                description: 'Compras no planeadas de alto valor.',
                advice: 'Aplica la regla de las 24 horas antes de comprar algo costoso.',
                topItem: topExpenses?.impulsive || 'Sin datos: $0'
            }
        }
    ];

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                    <Wallet size={14} className="text-[#A8A29E]" />
                    <h3 className="text-[#A8A29E] font-bold text-[10px] uppercase tracking-wider">Control de Gastos</h3>
                </div>

                <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar snap-x snap-mandatory">
                    {EXPENSES.map((expense) => (
                        <div key={expense.id} className="snap-start">
                            <ExpenseCard item={expense} onClick={() => setSelectedExpense(expense)} />
                        </div>
                    ))}
                </div>
            </div>

            {selectedExpense && (
                <ExpenseModal item={selectedExpense} onClose={() => setSelectedExpense(null)} />
            )}
        </>
    );
};
