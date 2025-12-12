import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Home, ShoppingCart, Car, Utensils, Zap, Wifi, Heart, GraduationCap, Plane, Coffee, Film, ShoppingBag, Briefcase, DollarSign, Gift, Smartphone, Wrench } from 'lucide-react';

interface CategoryData {
    name: string;
    amount: number;
    color: string;
    percent: number;
}

interface BalanceCategoryBreakdownProps {
    title: string;
    data: CategoryData[];
    type: 'expense' | 'income';
}

// Helper function to get icon for category
const getCategoryIcon = (categoryName: string, type: 'expense' | 'income') => {
    const name = categoryName.toLowerCase();

    // Income categories
    if (name.includes('salario') || name.includes('sueldo') || name.includes('nómina')) return Briefcase;
    if (name.includes('freelance') || name.includes('independiente')) return DollarSign;
    if (name.includes('inversión') || name.includes('inversiones') || name.includes('dividendo')) return TrendingUp;
    if (name.includes('bono') || name.includes('comisión')) return Gift;
    if (name.includes('negocio') || name.includes('empresa')) return Briefcase;

    // Expense categories
    if (name.includes('hogar') || name.includes('casa') || name.includes('renta') || name.includes('alquiler')) return Home;
    if (name.includes('alimento') || name.includes('comida') || name.includes('supermercado') || name.includes('mercado')) return ShoppingCart;
    if (name.includes('transporte') || name.includes('gasolina') || name.includes('uber') || name.includes('taxi')) return Car;
    if (name.includes('restaurante') || name.includes('comida fuera')) return Utensils;
    if (name.includes('servicios') || name.includes('luz') || name.includes('agua') || name.includes('gas')) return Zap;
    if (name.includes('internet') || name.includes('teléfono') || name.includes('celular') || name.includes('telefonía')) return Wifi;
    if (name.includes('salud') || name.includes('médico') || name.includes('farmacia') || name.includes('hospital')) return Heart;
    if (name.includes('educación') || name.includes('escuela') || name.includes('universidad') || name.includes('curso')) return GraduationCap;
    if (name.includes('viaje') || name.includes('vacaciones') || name.includes('turismo')) return Plane;
    if (name.includes('café') || name.includes('cafetería') || name.includes('starbucks')) return Coffee;
    if (name.includes('entretenimiento') || name.includes('cine') || name.includes('netflix') || name.includes('spotify')) return Film;
    if (name.includes('ropa') || name.includes('vestimenta') || name.includes('moda')) return ShoppingBag;
    if (name.includes('tecnología') || name.includes('electrónica') || name.includes('gadget')) return Smartphone;
    if (name.includes('mantenimiento') || name.includes('reparación') || name.includes('herramienta')) return Wrench;
    if (name.includes('ocio') || name.includes('diversión')) return Film;

    // Default icons
    return type === 'income' ? DollarSign : Wallet;
};

const BalanceCategoryBreakdown: React.FC<BalanceCategoryBreakdownProps> = ({ title, data, type }) => {
    const isIncome = type === 'income';
    const Icon = isIncome ? TrendingUp : TrendingDown;
    const iconBg = isIncome ? 'bg-emerald-50' : 'bg-red-50';
    const iconColor = isIncome ? 'text-emerald-600' : 'text-red-600';

    // Calculate total and max for bar scaling
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    const maxAmount = Math.max(...data.map(item => item.amount));
    const formattedTotal = totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const [integerPart, decimalPart] = formattedTotal.split('.');

    return (
        <div className="bg-gradient-to-br from-[#FAF8F6] to-[#F5F0EE] rounded-[1.75rem] p-4 shadow-sm border border-[#EBE5E2]/50 h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}>
                        <Icon className={`w-3 h-3 ${iconColor}`} />
                    </div>
                    <span className="font-bold text-xs text-[#5D4037]">{title}</span>
                </div>
                <div className="flex items-baseline gap-[1px]">
                    <span className="text-sm font-black text-[#5D4037]">${integerPart}</span>
                    <span className="text-[9px] font-bold text-gray-500">.{decimalPart}</span>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="flex flex-col gap-2.5">
                {data.map((item, index) => {
                    const IconComponent = getCategoryIcon(item.name, type);
                    const barWidth = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                    
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: `${item.color}15` }}>
                                <IconComponent className="w-3 h-3" style={{ color: item.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-semibold text-gray-700 truncate">{item.name}</span>
                                    <span className="text-[10px] font-bold text-[#5D4037] ml-2">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{ 
                                            width: `${barWidth}%`,
                                            backgroundColor: item.color 
                                        }}
                                    />
                                </div>
                                <span className="text-[9px] text-gray-400 mt-0.5 block">{item.percent}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BalanceCategoryBreakdown;
