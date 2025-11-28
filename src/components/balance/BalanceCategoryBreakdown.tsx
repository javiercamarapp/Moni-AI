import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

    // Calculate total amount from data
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    // Format formatting similar to StatCard
    const formattedTotal = totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const [integerPart, decimalPart] = formattedTotal.split('.');

    return (
        <div className="bg-white rounded-[1.75rem] p-5 shadow-sm border border-white/50 h-full">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <span className="font-bold text-sm text-[#5D4037]">{title}</span>
            </div>

            <div className="flex flex-col gap-6">
                {/* Chart Section */}
                <div className="h-40 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={5}
                                dataKey="amount"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '11px',
                                    padding: '6px 10px',
                                }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text - Formatted Amount */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <div className="flex items-baseline gap-[1px]">
                            <span className="text-sm font-black text-[#5D4037] tracking-tighter leading-none">
                                ${integerPart}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 opacity-70">
                                .{decimalPart}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Legend List */}
                <div className="flex flex-col gap-3">
                    {data.map((item, index) => {
                        const IconComponent = getCategoryIcon(item.name, type);
                        return (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                                        <IconComponent className="w-4 h-4" style={{ color: item.color }} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#5D4037]">${(item.amount / 1000).toFixed(1)}k</span>
                                    <span className="text-[10px] font-medium text-gray-400 w-8 text-right">{item.percent}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BalanceCategoryBreakdown;
