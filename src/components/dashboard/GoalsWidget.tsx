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
                                <CarouselItem key={goal.id} className="pl-3 basis-[42vw] md:basis-[160px]">
                                    <div
                                        className="w-full bg-white rounded-2xl p-3 shadow-[0_10px_20px_-8px_rgba(0,0,0,0.05)] border border-gray-50 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                                        onClick={() => navigate(`/goals/${goal.id}`)}
                                    >
                                        {/* Icon - top left */}
                                        <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-[#F5F0EE] flex items-center justify-center">
                                            <Icon size={14} className="text-[#8D6E63]" />
                                        </div>
                                        
                                        {/* Percentage - top right */}
                                        <span className={`absolute top-2 right-2 text-xs font-bold ${getTextColor(index)}`}>{percentage}%</span>
                                        
                                        {/* Name centered */}
                                        <div className="mt-8 mb-1">
                                            <h3 className="text-gray-800 font-bold text-xs leading-tight text-center truncate w-full">{goal.name}</h3>
                                        </div>

                                        {/* Amount - above progress bar */}
                                        <div className="text-center mb-1.5">
                                            <span className="text-[10px] text-gray-800 font-bold">{formatCurrency(goal.current)}</span>
                                            <span className="text-[9px] text-gray-400"> / {formatCurrency(goal.target)}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${getProgressColor(index)} rounded-full`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
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
                            const colorIndex = index + 2;
                            const textColorClass = getTextColor(colorIndex);
                            const Icon = getGoalIcon(goal.name);

                            return (
                                <CarouselItem key={goal.id} className="pl-3 basis-[42vw] md:basis-[160px]">
                                    <div
                                        className="w-full bg-white rounded-2xl p-3 shadow-[0_10px_20px_-8px_rgba(0,0,0,0.05)] border border-gray-50 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                                        onClick={() => navigate(`/group-goals/${goal.id}`)}
                                    >
                                        {/* Icon - top left */}
                                        <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-[#F5F0EE] flex items-center justify-center">
                                            <Icon size={14} className="text-[#8D6E63]" />
                                        </div>
                                        
                                        {/* Percentage - top right */}
                                        <div className="absolute top-2 right-2 flex items-center gap-1">
                                            <Users size={10} className="text-[#8D6E63]" />
                                            <span className={`text-xs font-bold ${textColorClass}`}>{percentage}%</span>
                                        </div>
                                        
                                        {/* Name centered */}
                                        <div className="mt-8 mb-1">
                                            <h3 className="text-gray-800 font-bold text-xs leading-tight text-center truncate w-full">{goal.name}</h3>
                                        </div>

                                        {/* Amount - above progress bar */}
                                        <div className="text-center mb-1.5">
                                            <span className="text-[10px] text-gray-800 font-bold">{formatCurrency(goal.current)}</span>
                                            <span className="text-[9px] text-gray-400"> / {formatCurrency(goal.target)}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${getProgressColor(colorIndex)} rounded-full`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
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
