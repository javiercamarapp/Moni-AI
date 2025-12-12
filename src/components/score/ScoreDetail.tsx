import React, { useState } from 'react';
import { ArrowLeft, Info, X, TrendingUp, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { RADAR_DATA, SCORE_COMPONENTS } from './constants';
import { ScoreComponent } from './types';

interface ScoreDetailProps {
  onBack?: () => void;
  score?: number;
}

const ScoreDetail: React.FC<ScoreDetailProps> = ({ onBack, score }) => {
  const [selectedComponent, setSelectedComponent] = useState<ScoreComponent | null>(null);
  const [api, setApi] = useState<any>();
  const [showInsight, setShowInsight] = useState(true);

  const displayScore = score ?? 99;

  return (
    <div className="pb-24 pt-6 w-full min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F5F0EB] relative">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        {/* Header - Dashboard style */}
        <div className="flex items-center gap-4 mb-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#5D4037] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">Score Moni</h1>
            <p className="text-xs text-[#8D6E63] font-medium">Análisis de salud financiera</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Score Summary Card - Dashboard card style */}
          <div className="bg-card rounded-3xl p-5 md:p-6 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-center border border-gray-100/50">
            <p className="text-[#A1887F] font-semibold mb-1 text-xs uppercase tracking-wider">Score Moni</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-gray-900 tracking-tight">{displayScore}</span>
              <span className="text-lg text-[#A1887F] font-medium">/100</span>
              <span className="text-emerald-600 font-bold text-sm ml-2 bg-emerald-50 px-2 py-0.5 rounded-full">↑ 64 pts</span>
            </div>
          </div>

          {/* Radar Chart Card */}
          <div className="bg-card rounded-3xl p-4 shadow-lg hover:shadow-xl transition-shadow h-[260px] md:h-[280px] flex items-center justify-center relative border border-gray-100/50">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={RADAR_DATA}>
                <PolarGrid stroke="#E8DDD4" strokeWidth={1} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#5D4037', fontSize: 11, fontWeight: 600, dy: 4 }} 
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#8D6E63"
                  strokeWidth={3}
                  fill="#A1887F"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insight Card - Dashboard style with brown tones */}
        {showInsight && (
          <div className="bg-[#F5EDE8] rounded-2xl py-3 px-4 mb-6 flex gap-3 items-center shadow-sm border border-[#E8DDD4]">
            <div className="w-6 h-6 rounded-full bg-[#8D6E63] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">!</span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-[#5D4037] text-xs md:text-sm leading-tight">¿Por qué cambió?</h4>
              <p className="text-[11px] md:text-xs text-[#8D6E63] leading-snug mt-0.5">
                Tu score mejoró gracias a mejores hábitos financieros.
              </p>
            </div>
            <button 
              onClick={() => setShowInsight(false)}
              className="ml-auto w-7 h-7 bg-[#8D6E63] text-white hover:bg-[#5D4037] rounded-full flex items-center justify-center transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div>
          {/* Breakdown Header */}
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Desglose por Componente</h3>
              <div className="flex items-center gap-2 text-[#A1887F]">
                <Info size={14} />
                <span className="text-xs font-medium">Toca cada tarjeta para ver detalles</span>
              </div>
            </div>

            <div className="hidden md:flex gap-2 pb-1">
              <button onClick={() => api?.scrollPrev()} className="p-2 rounded-full bg-white border border-gray-100 text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#F5EDE8] transition-all shadow-sm hover:shadow-md">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => api?.scrollNext()} className="p-2 rounded-full bg-white border border-gray-100 text-[#8D6E63] hover:text-[#5D4037] hover:bg-[#F5EDE8] transition-all shadow-sm hover:shadow-md">
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
                {SCORE_COMPONENTS.map((comp) => {
                  const percentage = (comp.score / comp.maxScore) * 100;
                  // Dynamic color: darker brown for higher scores, lighter for lower
                  // Range from #F5EDE8 (light, 0%) to #5D4037 (dark brown, 100%)
                  const isHighScore = percentage >= 80;
                  const isMediumScore = percentage >= 50 && percentage < 80;
                  
                  const getCardStyle = () => {
                    if (percentage >= 90) return 'bg-gradient-to-br from-[#5D4037] to-[#6D4C41]';
                    if (percentage >= 75) return 'bg-gradient-to-br from-[#6D4C41] to-[#795548]';
                    if (percentage >= 60) return 'bg-gradient-to-br from-[#8D6E63] to-[#A1887F]';
                    if (percentage >= 45) return 'bg-gradient-to-br from-[#A1887F] to-[#BCAAA4]';
                    if (percentage >= 30) return 'bg-gradient-to-br from-[#D7CCC8] to-[#E8DDD4]';
                    return 'bg-gradient-to-br from-[#EFEBE9] to-[#F5EDE8]';
                  };
                  
                  const textColor = percentage >= 60 ? 'text-white' : 'text-[#5D4037]';
                  const subTextColor = percentage >= 60 ? 'text-white/80' : 'text-[#8D6E63]';
                  const circleStyle = percentage >= 60 
                    ? 'bg-white text-[#5D4037]' 
                    : 'bg-[#5D4037]/10 text-[#5D4037] border border-[#5D4037]/20';
                  
                  return (
                    <CarouselItem key={comp.id} className="pl-4 basis-[45%] md:basis-1/3 lg:basis-[20%]">
                      <button 
                        onClick={() => setSelectedComponent(comp)}
                        className={`w-full h-[260px] rounded-3xl p-4 shadow-lg hover:shadow-xl flex flex-col items-center text-center relative overflow-hidden transition-all active:scale-[0.98] hover:-translate-y-1 border border-[#5D4037]/10 ${getCardStyle()}`}
                      >
                        <div className="mt-3 mb-3 relative">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${circleStyle}`}>
                            <span className="text-xl font-bold">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                        
                        <h4 className={`text-base font-bold mb-1 ${textColor}`}>{comp.name}</h4>
                        <div className={`text-xl font-bold mb-2 ${subTextColor}`}>
                          {comp.score}/{comp.maxScore}
                        </div>
                        
                        <p className={`text-[11px] font-medium leading-tight px-2 ${subTextColor}`}>
                          {comp.description}
                        </p>
                      </button>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>

      {/* Detailed Modal Overlay - Brown theme */}
      {selectedComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedComponent(null)}
          ></div>
          
          <div className="relative w-full max-w-[340px] bg-gradient-to-br from-[#5D4037] to-[#8D6E63] rounded-3xl p-6 text-white shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedComponent(null)}
              className="absolute top-5 right-5 w-8 h-8 bg-white text-[#5D4037] hover:bg-white/90 rounded-full flex items-center justify-center transition-colors shadow-md"
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
                  <div className="flex items-center text-white/80 font-semibold text-sm bg-white/20 px-2 py-1 rounded-full">
                    <TrendingUp size={14} className="mr-1" />
                    {selectedComponent.trend}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-white/20 mb-6"></div>

            {/* Why Improved Section */}
            <div className="bg-white/15 rounded-2xl p-5 mb-3 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-white/90" />
                <h3 className="font-bold text-white">¿Por qué mejoró?</h3>
              </div>
              <ul className="space-y-2.5">
                {selectedComponent.details?.whyImproved.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[13px] font-medium leading-snug text-white/85">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/70 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
                {!selectedComponent.details && (
                  <li className="text-sm opacity-70">Detalles no disponibles.</li>
                )}
              </ul>
            </div>

            {/* How to Improve Section */}
            <div className="bg-white/15 rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-yellow-200" />
                <h3 className="font-bold text-white">Cómo mejorar</h3>
              </div>
              <ul className="space-y-3">
                {selectedComponent.details?.howToImprove.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[13px] font-medium leading-snug text-white/85">
                    <div className="min-w-[14px] pt-0.5">
                      <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" strokeWidth="3">
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
