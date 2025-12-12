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
const GoalsWidget: React.FC<GoalsWidgetProps> = ({
  personalGoals,
  groupGoals
}) => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();

  // Combine all goals with group flag
  const allGoals = [...personalGoals.map(g => ({
    ...g,
    is_group: false
  })), ...groupGoals.map(g => ({
    ...g,
    is_group: true
  }))];

  // Enable trackpad scrolling
  useEffect(() => {
    if (!api) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        if (e.deltaX > 0) {
          api.scrollNext();
        } else {
          api.scrollPrev();
        }
      }
    };
    api.containerNode().addEventListener("wheel", onWheel, {
      passive: false
    });
    return () => {
      api.containerNode().removeEventListener("wheel", onWheel);
    };
  }, [api]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(amount);
  };
  const getProgressColor = (index: number) => {
    const colors = ['from-emerald-400 to-emerald-500 shadow-[0_2px_8px_rgba(16,185,129,0.25)]', 'from-blue-400 to-blue-500 shadow-[0_2px_8px_rgba(59,130,246,0.25)]', 'from-indigo-400 to-indigo-500 shadow-[0_2px_8px_rgba(99,102,241,0.25)]', 'from-rose-400 to-rose-500 shadow-[0_2px_8px_rgba(244,63,94,0.25)]', 'from-amber-400 to-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.25)]'];
    return colors[index % colors.length];
  };
  const getTextColor = (index: number) => {
    const colors = ['text-emerald-600', 'text-blue-600', 'text-indigo-600', 'text-rose-600', 'text-amber-600'];
    return colors[index % colors.length];
  };
  return <div className="mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 my-[20px]">
                <button onClick={() => navigate('/goals')} className={`${headingSection} text-lg hover:text-[#8D6E63] transition-colors flex items-center gap-1.5 group`}>
                    Metas
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-[#8D6E63] group-hover:translate-x-0.5 transition-all" />
                </button>
                <div className="flex items-center gap-3">
                    {allGoals.length > 0 && <div className="hidden md:flex gap-2">
                            <button onClick={() => api?.scrollPrev()} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => api?.scrollNext()} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                                <ChevronRight size={16} />
                            </button>
                        </div>}
                    <button onClick={() => navigate('/goals?action=new')} className="flex items-center gap-1.5 bg-[#F5F0EE] hover:bg-[#EBE5E2] text-[#5D4037] p-2 md:px-4 md:py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap">
                        <Plus size={14} strokeWidth={3} />
                        <span className="hidden md:inline">Nueva</span>
                    </button>
                </div>
            </div>

            {/* Goals Carousel */}
            {allGoals.length === 0 ? <div>
                    <div className="bg-white rounded-[1.75rem] p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate('/goals?action=new')}>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Plus className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Crear primera meta</h3>
                            <p className="text-xs text-gray-500 mt-1">Define un objetivo y empieza a ahorrar</p>
                        </div>
                    </div>
                </div> : <Carousel setApi={setApi} opts={{
      align: "start",
      dragFree: true
    }} className="w-full">
                    <CarouselContent className="-ml-3 pb-4">
                        {allGoals.map((goal, index) => {
          const percentage = Math.min(100, Math.round(goal.current / goal.target * 100));
          const Icon = getGoalIcon(goal.name);
          return <CarouselItem key={goal.id} className="pl-3 basis-[42vw] md:basis-[280px] lg:basis-[320px]">
                                    <div className="w-full bg-white rounded-2xl p-3 shadow-[0_10px_20px_-8px_rgba(0,0,0,0.05)] border border-gray-50 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => navigate(goal.is_group ? `/group-goals/${goal.id}` : `/goals/${goal.id}`)}>
                                        {/* Top row: Icon left, Percentage + Amount right */}
                                        <div className="flex items-start justify-between mb-2">
                                            {/* Icon with group badge */}
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-lg bg-[#F5F0EE] flex items-center justify-center">
                                                    <Icon size={16} className="text-[#8D6E63]" />
                                                </div>
                                                {goal.is_group && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                                        <Users size={8} className="text-white" />
                                                    </div>}
                                            </div>
                                            
                                            {/* Percentage and amounts - same height as icon */}
                                            <div className="flex flex-col items-end justify-between h-8">
                                                <span className={`text-xs font-bold ${getTextColor(index)}`}>{percentage}%</span>
                                                <div className="text-right">
                                                    <span className="text-[9px] text-gray-800 font-bold">{formatCurrency(goal.current)}</span>
                                                    <span className="text-[8px] text-gray-400">/{formatCurrency(goal.target)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Name - left aligned */}
                                        <h3 className="text-gray-800 font-bold text-xs leading-tight text-left truncate w-full mb-2">{goal.name}</h3>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full bg-gradient-to-r ${getProgressColor(index)} rounded-full`} style={{
                  width: `${percentage}%`
                }}></div>
                                        </div>
                                    </div>
                                </CarouselItem>;
        })}
                    </CarouselContent>
                </Carousel>}
        </div>;
};
export default GoalsWidget;