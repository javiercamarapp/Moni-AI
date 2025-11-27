import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShoppingBag, Bus, Gamepad2, Plane, Zap, Shirt, Dumbbell, TrendingUp, TrendingDown, Home, Car, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: string;
    categories?: { name: string; color?: string };
    transaction_date: string;
    payment_method?: string | null;
    account?: string | null;
}

interface RecentTransactionsWidgetProps {
    transactions: Transaction[];
}

const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({ transactions }) => {
    const navigate = useNavigate();
    const listRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'up' | 'down') => {
        if (listRef.current) {
            const scrollAmount = 100; // Approximate height of a card + gap
            listRef.current.scrollBy({
                top: direction === 'up' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const getPaymentMethodInfo = (tx: Transaction) => {
        if (tx.payment_method?.toLowerCase() === 'efectivo') {
            return { label: 'Efectivo', color: 'bg-teal-50 text-teal-700 border-teal-100' };
        }
        if (tx.account) {
            return { label: tx.account, color: 'bg-gray-50 text-gray-600 border-gray-100' };
        }
        if (tx.payment_method?.toLowerCase() === 'tarjeta') {
            return { label: 'Tarjeta', color: 'bg-purple-50 text-purple-700 border-purple-100' };
        }
        return null;
    };

    // Helper to get icon and color based on category/description
    const getTransactionStyle = (tx: Transaction) => {
        const lowerDesc = tx.description.toLowerCase();
        const lowerCat = tx.categories?.name?.toLowerCase() || '';
        const text = `${lowerDesc} ${lowerCat}`;

        if (text.includes('uber') || text.includes('transporte') || text.includes('bus') || text.includes('taxi')) {
            return { icon: Bus, color: 'bg-blue-50 text-blue-600' };
        }
        if (text.includes('comida') || text.includes('starbucks') || text.includes('restaurante') || text.includes('cafe')) {
            return { icon: Coffee, color: 'bg-amber-50 text-amber-600' };
        }
        if (text.includes('super') || text.includes('despensa') || text.includes('market') || text.includes('oxxo')) {
            return { icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' };
        }
        if (text.includes('netflix') || text.includes('spotify') || text.includes('cine') || text.includes('juego')) {
            return { icon: Gamepad2, color: 'bg-rose-50 text-rose-600' };
        }
        if (text.includes('gym') || text.includes('gimnasio') || text.includes('salud') || text.includes('medico')) {
            return { icon: Dumbbell, color: 'bg-purple-50 text-purple-600' };
        }
        if (text.includes('ropa') || text.includes('zara') || text.includes('shopping') || text.includes('liverpool')) {
            return { icon: Shirt, color: 'bg-pink-50 text-pink-600' };
        }
        if (text.includes('luz') || text.includes('agua') || text.includes('gas') || text.includes('internet') || text.includes('cfe')) {
            return { icon: Zap, color: 'bg-yellow-50 text-yellow-600' };
        }
        if (text.includes('viaje') || text.includes('vuelo') || text.includes('hotel') || text.includes('airbnb')) {
            return { icon: Plane, color: 'bg-indigo-50 text-indigo-600' };
        }
        if (text.includes('casa') || text.includes('renta') || text.includes('hipoteca')) {
            return { icon: Home, color: 'bg-teal-50 text-teal-600' };
        }
        if (text.includes('auto') || text.includes('gasolina')) {
            return { icon: Car, color: 'bg-orange-50 text-orange-600' };
        }

        // Default
        return { 
            icon: tx.type === 'income' || tx.type === 'ingreso' ? TrendingUp : TrendingDown, 
            color: tx.type === 'income' || tx.type === 'ingreso' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600' 
        };
    };

    return (
        <div className="px-6 mb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Transacciones Recientes</h2>
                <div className="flex items-center gap-3">
                    {transactions.length > 0 && (
                        <div className="hidden md:flex gap-2">
                            <button onClick={() => scroll('up')} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronUp size={16} />
                            </button>
                            <button onClick={() => scroll('down')} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronDown size={16} />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/movimientos')}
                        className="text-[#8D6E63] text-xs font-bold hover:underline flex items-center gap-0.5 whitespace-nowrap"
                    >
                        Ver todas
                        <ChevronRight size={12} />
                    </button>
                </div>
            </div>

            {/* Transactions List */}
            <div className="relative rounded-[1.75rem] overflow-hidden">
                {/* Fade masks - Colors matched to dashboard background #fafaf9 */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#fafaf9] to-transparent z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#fafaf9] to-transparent z-10 pointer-events-none"></div>

                <div 
                    ref={listRef}
                    className="flex flex-col gap-3 max-h-[425px] overflow-y-auto pb-6 pt-4 px-4 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 scroll-smooth"
                >
                    {transactions.length === 0 ? (
                        <div className="bg-white rounded-[1.75rem] p-8 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-white text-center">
                            <p className="text-gray-400 text-sm">No hay movimientos recientes</p>
                        </div>
                    ) : (
                        transactions.slice(0, 8).map((tx) => {
                            const { icon: Icon, color } = getTransactionStyle(tx);
                            const isExpense = tx.type === 'expense' || tx.type === 'gasto';
                            const paymentInfo = getPaymentMethodInfo(tx);
                            
                            return (
                                <div 
                                    key={tx.id} 
                                    className="bg-white rounded-[1.75rem] p-4 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-white flex items-center justify-between group shrink-0 cursor-pointer"
                                    onClick={() => navigate('/movimientos')}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Icon Container */}
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] ${color}`}>
                                            <Icon size={20} strokeWidth={2.5} />
                                        </div>
                                        
                                        {/* Text Info */}
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-bold text-gray-800 leading-tight truncate max-w-[150px]">{tx.description}</span>
                                            <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                                                {tx.categories?.name || 'General'} • {new Date(tx.transaction_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                            </span>
                                            {paymentInfo && (
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full border ${paymentInfo.color} mt-1 font-medium`}>
                                                    {paymentInfo.label}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <span className={`text-sm font-bold ${isExpense ? 'text-gray-800' : 'text-green-600'}`}>
                                        {isExpense ? '-' : '+'}${Math.abs(Number(tx.amount)).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecentTransactionsWidget;
