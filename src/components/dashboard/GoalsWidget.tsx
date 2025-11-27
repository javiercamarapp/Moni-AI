import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Car, Home, Shield, Plane, Heart, Briefcase, Target, ChevronLeft, ChevronRight } from 'lucide-react';

interface Goal {
    id: string;
    name: string;
    target: number;
    current: number;
    deadline?: string;
    is_group: boolean;
}

interface GoalsWidgetProps {
    personalGoals: Goal[];
    groupGoals: Goal[];
}

const GoalsWidget: React.FC<GoalsWidgetProps> = ({ personalGoals, groupGoals }) => {
    const navigate = useNavigate();
    const personalGoalsRef = useRef<HTMLDivElement>(null);
    const groupGoalsRef = useRef<HTMLDivElement>(null);

    const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
        if (ref.current) {
            const { current } = ref;
            const scrollAmount = 340; // Width of a card + gap
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount);
    };

    const getProgressColor = (index: number) => {
        const colors = [
            'from-emerald-400 to-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.25)]',
            'from-blue-400 to-blue-500 shadow-[0_2px_8px_rgba(59,130,246,0.25)]',
            'from-indigo-400 to-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.25)]',
            'from-rose-400 to-rose-500 shadow-[0_2px_8px_rgba(244,63,94,0.25)]',
            'from-amber-400 to-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.25)]'
        ];
        return colors[index % colors.length];
    };

    const getTextColor = (index: number) => {
        const colors = [
            'text-emerald-600',
            'text-blue-600',
            'text-indigo-600',
            'text-rose-600',
            'text-amber-600'
        ];
        return colors[index % colors.length];
    };

    // Helper to assign icons based on goal name
    const getGoalIcon = (name: string) => {
        if (!name) return Target;
        const lowerName = name.toLowerCase();
        if (lowerName.includes('casa') || lowerName.includes('hogar')) return Home;
        if (lowerName.includes('coche') || lowerName.includes('auto') || lowerName.includes('carro')) return Car;
        if (lowerName.includes('viaje') || lowerName.includes('vacaciones') || lowerName.includes('europa')) return Plane;
        if (lowerName.includes('boda') || lowerName.includes('anillo')) return Heart;
        if (lowerName.includes('emergencia') || lowerName.includes('seguro') || lowerName.includes('fondo')) return Shield;
        if (lowerName.includes('negocio') || lowerName.includes('empresa') || lowerName.includes('startup')) return Briefcase;
        return Target;
    };

    return (
        <div className="mb-6">
            
            {/* --- Personal Goals Section --- */}
            <div className="flex items-center justify-between px-6 mb-4">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Tus Metas</h2>
                <div className="flex items-center gap-3">
                    {personalGoals.length > 0 && (
                        <div className="hidden md:flex gap-2">
                            <button onClick={() => scroll(personalGoalsRef, 'left')} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => scroll(personalGoalsRef, 'right')} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={() => navigate('/new-goal')}
                        className="flex items-center gap-1.5 bg-[#F5F0EE] hover:bg-[#EBE5E2] text-[#5D4037] p-2 md:px-4 md:py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={14} strokeWidth={3} />
                        <span className="hidden md:inline">Nueva Meta</span>
                    </button>
                    <button
                        onClick={() => navigate('/goals')}
                        className="text-[#8D6E63] text-xs font-bold hover:underline flex items-center gap-0.5"
                    >
                        Ver todas
                        <ChevronRight size={12} />
                    </button>
                </div>
            </div>

            {/* Personal Goals Carousel */}
            {personalGoals.length === 0 ? (
                <div className="px-6">
                    <div 
                        className="bg-white rounded-[1.75rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => navigate('/new-goal')}
                    >
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Plus className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Crear primera meta</h3>
                            <p className="text-xs text-gray-500 mt-1">Define un objetivo y empieza a ahorrar</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div 
                    ref={personalGoalsRef}
                    className="flex overflow-x-auto pl-6 pr-6 pb-8 gap-4 snap-x snap-mandatory no-scrollbar scroll-smooth"
                >
                    {personalGoals.map((goal, index) => {
                        const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
                        const remaining = goal.target - goal.current;
                        const Icon = getGoalIcon(goal.name);
                        
                        return (
                            <div 
                                key={goal.id} 
                                className="w-[85vw] md:w-80 shrink-0 bg-white rounded-[1.75rem] p-5 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group snap-center cursor-pointer"
                                onClick={() => navigate(`/goals/${goal.id}`)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Icon size={16} className="text-gray-400" />
                                            <h3 className="text-gray-800 font-bold text-lg leading-tight truncate">{goal.name}</h3>
                                        </div>
                                        <span className="text-[10px] font-medium text-gray-400">
                                            {goal.deadline ? new Date(goal.deadline).toLocaleDateString('es-MX') : 'Sin fecha'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gray-800 font-bold text-sm">{formatCurrency(goal.current)}</div>
                                        <div className="text-[10px] text-gray-400">de {formatCurrency(goal.target)}</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full bg-gray-100 rounded-full mt-3 mb-3 overflow-hidden">
                                    <div 
                                        className={`h-full bg-gradient-to-r ${getProgressColor(index)} rounded-full`} 
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                    <span>{formatCurrency(remaining)} restante</span>
                                    <span className={`${getTextColor(index)}`}>{percentage}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* --- Group Goals Section --- */}
            <div className="flex items-center justify-between px-6 mb-4">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Metas Grupales</h2>
                <div className="flex items-center gap-3">
                    {groupGoals.length > 0 && (
                        <div className="hidden md:flex gap-2">
                            <button onClick={() => scroll(groupGoalsRef, 'left')} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => scroll(groupGoalsRef, 'right')} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={() => navigate('/new-goal?type=group')}
                        className="flex items-center gap-1.5 bg-[#F5F0EE] hover:bg-[#EBE5E2] text-[#5D4037] p-2 md:px-4 md:py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={14} strokeWidth={3} />
                        <span className="hidden md:inline">Nueva Meta</span>
                    </button>
                    <button
                        onClick={() => navigate('/groups')}
                        className="text-[#8D6E63] text-xs font-bold hover:underline flex items-center gap-0.5"
                    >
                        Ver todas
                        <ChevronRight size={12} />
                    </button>
                </div>
            </div>

             {/* Group Goals Carousel */}
             {groupGoals.length === 0 ? (
                <div className="px-6">
                     <div className="bg-white rounded-[1.75rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                        <p className="text-sm text-gray-500">No tienes metas grupales aún</p>
                     </div>
                </div>
             ) : (
                <div 
                    ref={groupGoalsRef}
                    className="flex overflow-x-auto pl-6 pr-6 pb-4 gap-4 snap-x snap-mandatory no-scrollbar scroll-smooth"
                >
                    {groupGoals.map((goal, index) => {
                        const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
                        const remaining = goal.target - goal.current;
                        // Offset index for variety in colors
                        const colorIndex = index + 2; 
                        const textColorClass = getTextColor(colorIndex);
                        
                        return (
                            <div 
                                key={goal.id} 
                                className="w-[85vw] md:w-80 shrink-0 bg-white rounded-[1.75rem] p-5 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group snap-center cursor-pointer"
                                onClick={() => navigate(`/group-goals/${goal.id}`)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-gray-800 font-bold text-lg leading-tight truncate">{goal.name}</h3>
                                            <div className={`bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1`}>
                                                <Users size={8} className={textColorClass} />
                                                <span className={`text-[8px] font-bold ${textColorClass} uppercase tracking-wide`}>Grupal</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-medium text-gray-400">
                                            {goal.deadline ? new Date(goal.deadline).toLocaleDateString('es-MX') : 'Sin fecha'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gray-800 font-bold text-sm">{formatCurrency(goal.current)}</div>
                                        <div className="text-[10px] text-gray-400">de {formatCurrency(goal.target)}</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full bg-gray-100 rounded-full mt-3 mb-3 overflow-hidden">
                                    <div 
                                        className={`h-full bg-gradient-to-r ${getProgressColor(colorIndex)} rounded-full`} 
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                    <span>{formatCurrency(remaining)} restante</span>
                                    <span className={`${textColorClass}`}>{percentage}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
             )}
        </div>
    );
};

export default GoalsWidget;
