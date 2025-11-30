import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { headingSection } from '@/styles/typography';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { getGoalIcon } from '@/lib/goalIcons';

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
    const [personalApi, setPersonalApi] = useState<CarouselApi>();
    const [groupApi, setGroupApi] = useState<CarouselApi>();

    // Enable trackpad scrolling for personal goals
    useEffect(() => {
        if (!personalApi) return;

        const onWheel = (e: WheelEvent) => {
            // Check if horizontal scroll is dominant
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();
                if (e.deltaX > 0) {
                    personalApi.scrollNext();
                } else {
                    personalApi.scrollPrev();
                }
            }
        };

        // Add passive: false to allow preventDefault
        personalApi.containerNode().addEventListener("wheel", onWheel, { passive: false });

        return () => {
            personalApi.containerNode().removeEventListener("wheel", onWheel);
        };
    }, [personalApi]);

    // Enable trackpad scrolling for group goals
    useEffect(() => {
        if (!groupApi) return;

        const onWheel = (e: WheelEvent) => {
            // Check if horizontal scroll is dominant
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();
                if (e.deltaX > 0) {
                    groupApi.scrollNext();
                } else {
                    groupApi.scrollPrev();
                }
            }
        };

        // Add passive: false to allow preventDefault
        groupApi.containerNode().addEventListener("wheel", onWheel, { passive: false });

        return () => {
            groupApi.containerNode().removeEventListener("wheel", onWheel);
        };
    }, [groupApi]);

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

    return (
        <div className="mb-6">

            {/* --- Personal Goals Section --- */}
            <div className="flex items-center justify-between mb-4">
                <button 
                    onClick={() => navigate('/goals')}
                    className={`${headingSection} text-lg hover:text-[#8D6E63] transition-colors flex items-center gap-1.5 group`}
                >
                    Tus Metas
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-[#8D6E63] group-hover:translate-x-0.5 transition-all" />
                </button>
                <div className="flex items-center gap-3">
                    {personalGoals.length > 0 && (
                        <div className="hidden md:flex gap-2">
                            <button onClick={() => personalApi?.scrollPrev()} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => personalApi?.scrollNext()} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/goals?action=new')}
                        className="flex items-center gap-1.5 bg-[#F5F0EE] hover:bg-[#EBE5E2] text-[#5D4037] p-2 md:px-4 md:py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={14} strokeWidth={3} />
                        <span className="hidden md:inline">Nueva</span>
                    </button>
                </div>
            </div>

            {/* Personal Goals Carousel */}
            {personalGoals.length === 0 ? (
                <div>
                    <div
                        className="bg-white rounded-[1.75rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => navigate('/goals?action=new')}
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
                <Carousel
                    setApi={setPersonalApi}
                    opts={{
                        align: "start",
                        dragFree: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4 pb-8">
                        {personalGoals.map((goal, index) => {
                            const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
                            const remaining = goal.target - goal.current;
                            const Icon = getGoalIcon(goal.name);

                            return (
                                <CarouselItem key={goal.id} className="pl-4 basis-[85vw] md:basis-auto">
                                    <div
                                        className="w-full md:w-80 bg-white rounded-[1.75rem] p-5 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
                                        onClick={() => navigate(`/goals/${goal.id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#F5F0EE] flex items-center justify-center flex-shrink-0">
                                                    <Icon size={20} className="text-[#8D6E63]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-gray-800 font-bold text-lg leading-tight truncate">{goal.name}</h3>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {goal.deadline ? new Date(goal.deadline).toLocaleDateString('es-MX') : 'Sin fecha'}
                                                    </span>
                                                </div>
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

                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-500">{formatCurrency(remaining)} restante</span>
                                            <span className={`text-sm font-bold ${getTextColor(index)}`}>{percentage}%</span>
                                        </div>
                                    </div>
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>
                </Carousel>
            )}


            {/* --- Group Goals Section --- */}
            <div className="flex items-center justify-between mb-4">
                <button 
                    onClick={() => navigate('/goals')}
                    className={`${headingSection} text-lg hover:text-[#8D6E63] transition-colors flex items-center gap-1.5 group`}
                >
                    Metas Grupales
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-[#8D6E63] group-hover:translate-x-0.5 transition-all" />
                </button>
                <div className="flex items-center gap-3">
                    {groupGoals.length > 0 && (
                        <div className="hidden md:flex gap-2">
                            <button onClick={() => groupApi?.scrollPrev()} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => groupApi?.scrollNext()} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/goals?action=new')}
                        className="flex items-center gap-1.5 bg-[#F5F0EE] hover:bg-[#EBE5E2] text-[#5D4037] p-2 md:px-4 md:py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={14} strokeWidth={3} />
                        <span className="hidden md:inline">Nueva</span>
                    </button>
                </div>
            </div>

            {/* Group Goals Carousel */}
            {groupGoals.length === 0 ? (
                <div>
                    <div className="bg-white rounded-[1.75rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                        <p className="text-sm text-gray-500">No tienes metas grupales aún</p>
                    </div>
                </div>
            ) : (
                <Carousel
                    setApi={setGroupApi}
                    opts={{
                        align: "start",
                        dragFree: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4 pb-4">
                        {groupGoals.map((goal, index) => {
                            const percentage = Math.min(100, Math.round((goal.current / goal.target) * 100));
                            const remaining = goal.target - goal.current;
                            // Offset index for variety in colors
                            const colorIndex = index + 2;
                            const textColorClass = getTextColor(colorIndex);
                            const Icon = getGoalIcon(goal.name);

                            return (
                                <CarouselItem key={goal.id} className="pl-4 basis-[85vw] md:basis-auto">
                                    <div
                                        className="w-full md:w-80 bg-white rounded-[1.75rem] p-5 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
                                        onClick={() => navigate(`/group-goals/${goal.id}`)}
                                    >
                                        {/* Elegant Grupal badge - top right */}
                                        <div className="absolute top-4 right-4">
                                            <div className="bg-[#F5F0EE] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                                <Users size={10} className="text-[#8D6E63]" />
                                                <span className="text-[9px] font-semibold text-[#5D4037] tracking-wide">Grupal</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 mb-1 pr-16">
                                            <div className="w-10 h-10 rounded-xl bg-[#F5F0EE] flex items-center justify-center flex-shrink-0">
                                                <Icon size={20} className="text-[#8D6E63]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-gray-800 font-bold text-base leading-tight truncate">{goal.name}</h3>
                                                <span className="text-[10px] font-medium text-gray-400">
                                                    {goal.deadline ? new Date(goal.deadline).toLocaleDateString('es-MX') : 'Sin fecha'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2 w-full bg-gray-100 rounded-full mt-3 mb-3 overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${getProgressColor(colorIndex)} rounded-full`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-gray-800 font-bold text-sm">{formatCurrency(goal.current)}</span>
                                                <span className="text-[10px] text-gray-400"> / {formatCurrency(goal.target)}</span>
                                            </div>
                                            <span className={`text-sm font-bold ${textColorClass}`}>{percentage}%</span>
                                        </div>
                                    </div>
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>
                </Carousel>
            )}
        </div>
    );
};

export default GoalsWidget;
