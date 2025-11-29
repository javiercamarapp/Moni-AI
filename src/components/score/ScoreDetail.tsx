import React, { useState } from 'react';
import { ArrowLeft, Info, X, TrendingUp, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { RADAR_DATA, SCORE_COMPONENTS } from './constants';
import { ScoreComponent } from './types';
import { headingPage, kpiNumberPrimary } from '@/styles/typography';

interface ScoreDetailProps {
  onBack?: () => void;
  score?: number;
}

const ScoreDetail: React.FC<ScoreDetailProps> = ({ onBack, score }) => {
  const [selectedComponent, setSelectedComponent] = useState<ScoreComponent | null>(null);
  const [api, setApi] = useState<any>();
  const [showInsight, setShowInsight] = useState(true);

  // Use passed score or default to 99 (as per design)
  // In a real scenario, we might want to calculate the difference or use real data.
  const displayScore = score ?? 99;

  return (
    <div className="pb-24 pt-6 w-full min-h-screen bg-[#F2F4F6] relative">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className={headingPage}>Score Moni</h1>
            <p className="text-[11px] md:text-xs text-[#8D6E63] font-medium">Análisis de salud financiera</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Score Summary Card - Reduced Height/Padding */}
          <div className="bg-white rounded-[1.75rem] p-4 md:p-6 md:pl-10 shadow-sm flex flex-col justify-center">
            <p className="text-slate-400 font-medium mb-1 text-xs md:text-sm pl-1">Score Moni</p>
            <div className="flex items-baseline gap-2">
              <span className={kpiNumberPrimary}>{displayScore}</span>
              <span className="text-base md:text-lg text-slate-400 font-medium">/100</span>
              <span className="text-emerald-500 font-bold text-sm md:text-base ml-2">↑ 64 pts</span>
            </div>
          </div>

          {/* Radar Chart Card - Reduced Height */}
          <div className="bg-white rounded-[1.75rem] p-4 shadow-sm h-[260px] md:h-[280px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={RADAR_DATA}>
                <PolarGrid stroke="#E2E8F0" strokeWidth={1} />
                <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#334155', fontSize: 12, fontWeight: 600, dy: 4 }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  fill="#A78BFA"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info/Insight Card - now below score */}
        {showInsight && (
          <div className="bg-[#F3E8FF] rounded-2xl py-3 px-4 mb-6 flex gap-3 items-center shadow-sm border border-[#E9D5FF]/50">
            <div className="w-5 h-5 rounded-full border-2 border-[#A855F7] flex items-center justify-center shrink-0">
                <span className="text-[#A855F7] font-bold text-[10px]">!</span>
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[#6B21A8] text-xs md:text-sm leading-tight">¿Por qué cambió?</h4>
                <p className="text-[11px] md:text-xs text-[#7E22CE] leading-snug mt-0.5">
                    Tu score mejoró gracias a mejores hábitos financieros.
                </p>
            </div>
            <button 
              onClick={() => setShowInsight(false)}
              className="ml-auto text-[#6B21A8] hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div>
          {/* Breakdown Header */}
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Desglose por Componente</h3>
              <div className="flex items-center gap-2 text-slate-400">
                  <Info size={14} />
                  <span className="text-xs font-medium">Toca cada tarjeta para ver detalles de cambios</span>
              </div>
            </div>

            <div className="hidden md:flex gap-2 pb-1">
                 <button onClick={() => api?.scrollPrev()} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                     <ChevronLeft size={16} />
                 </button>
                 <button onClick={() => api?.scrollNext()} className="p-1.5 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
                     <ChevronRight size={16} />
                 </button>
            </div>
          </div>

          {/* Cards Carousel */}
          <div>
            <Carousel
              setApi={setApi}
              opts={{
                    align: "start",
                    dragFree: true,
                }}
                className="w-full"
            >
              <CarouselContent className="-ml-4 py-4">
                {SCORE_COMPONENTS.map((comp) => (
                    <CarouselItem key={comp.id} className="pl-4 basis-[45%] md:basis-1/3 lg:basis-[20%]">
                        <button 
                            onClick={() => setSelectedComponent(comp)}
                            className={`w-full h-[260px] rounded-[1.5rem] p-4 shadow-lg flex flex-col items-center text-center relative overflow-hidden transition-transform active:scale-[0.98]
                                ${comp.name === 'Ahorro' ? 'bg-[#00A86B] shadow-emerald-200' : 'bg-white shadow-slate-200'}
                            `}
                        >
                            {comp.name === 'Ahorro' ? (
                                <>
                                    <div className="mt-2 mb-2 relative">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <span className="text-xl font-bold text-[#00A86B]">100%</span>
                                        </div>
                                    </div>
                                    
                                    <h4 className="text-base font-bold text-white mb-1">{comp.name}</h4>
                                    <div className="text-xl font-bold text-white mb-2">
                                        {comp.score}/{comp.maxScore}
                                    </div>
                                    
                                    <p className="text-[11px] text-white/90 font-medium leading-tight">
                                        {comp.description}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="mt-2 mb-2 relative">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center shadow-inner border border-slate-100">
                                            <span className="text-xl font-bold text-slate-700">{(comp.score / comp.maxScore * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    
                                    <h4 className="text-base font-bold text-slate-800 mb-1">{comp.name}</h4>
                                    <div className="text-xl font-bold text-slate-400 mb-2">
                                        {comp.score}/{comp.maxScore}
                                    </div>
                                    
                                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                                        {comp.description}
                                    </p>
                                </>
                            )}
                        </button>
                    </CarouselItem>
                ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
      </div>

      {/* Detailed Modal Overlay */}
      {selectedComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedComponent(null)}
            ></div>
            
            <div className="relative w-full max-w-[340px] bg-[#0F8A5F] rounded-[2rem] p-6 text-white shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                {/* Close Button */}
                <button 
                    onClick={() => setSelectedComponent(null)}
                    className="absolute top-5 right-5 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center mt-2 mb-6">
                    <div className="text-3xl mb-2">{selectedComponent.icon || '📊'}</div>
                    <h2 className="text-xl font-bold mb-4 text-center">{selectedComponent.title || selectedComponent.name}</h2>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold">
                            {selectedComponent.score}/{selectedComponent.maxScore}
                        </span>
                        {selectedComponent.trend && (
                            <div className="flex items-center text-emerald-200 font-semibold text-sm">
                                <TrendingUp size={16} className="mr-1" />
                                {selectedComponent.trend}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full h-px bg-white/20 mb-6"></div>

                {/* Why Improved Section */}
                <div className="bg-white/10 rounded-2xl p-5 mb-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={18} className="text-emerald-100" />
                        <h3 className="font-bold text-emerald-50">¿Por qué mejoró?</h3>
                    </div>
                    <ul className="space-y-2.5">
                        {selectedComponent.details?.whyImproved.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-[13px] font-medium leading-snug text-emerald-50/90">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-200 mt-1.5 shrink-0" />
                                {item}
                            </li>
                        ))}
                         {!selectedComponent.details && (
                            <li className="text-sm opacity-70">Detalles no disponibles.</li>
                        )}
                    </ul>
                </div>

                {/* How to Improve Section */}
                <div className="bg-white/10 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={18} className="text-yellow-100" />
                        <h3 className="font-bold text-emerald-50">Cómo mejorar este rubro</h3>
                    </div>
                    <ul className="space-y-3">
                        {selectedComponent.details?.howToImprove.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-[13px] font-medium leading-snug text-emerald-50/90">
                                <div className="min-w-[14px] pt-0.5">
                                    <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="1 7 4.5 10 11 2" />
                                    </svg>
                                </div>
                                {item}
                            </li>
                        ))}
                         {!selectedComponent.details && (
                            <li className="text-sm opacity-70">Consejos no disponibles.</li>
                        )}
                    </ul>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};

export default ScoreDetail;
