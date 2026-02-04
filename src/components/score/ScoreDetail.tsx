import React, { useState } from 'react';
import { ArrowLeft, Info, X, TrendingUp, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { RADAR_DATA, SCORE_COMPONENTS } from './constants';
import { ScoreComponent } from './types';

interface ScoreDetailProps {
  onBack?: () => void;
  score?: number;
  onModalChange?: (isOpen: boolean) => void;
}

const ScoreDetail: React.FC<ScoreDetailProps> = ({ onBack, score, onModalChange }) => {
  const [selectedComponent, setSelectedComponent] = useState<ScoreComponent | null>(null);
  const [api, setApi] = useState<any>();
  const [showInsight, setShowInsight] = useState(true);

  // Notify parent when modal opens/closes
  const handleSelectComponent = (comp: ScoreComponent | null) => {
    setSelectedComponent(comp);
    onModalChange?.(comp !== null);
  };

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
                        onClick={() => handleSelectComponent(comp)}
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
                        
                        <p className={`text-[10px] font-medium leading-tight px-1 line-clamp-2 ${subTextColor}`}>
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

      {/* Detailed Modal Overlay - Full screen on mobile to avoid nav overlap */}
      {selectedComponent && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => handleSelectComponent(null)}
          ></div>
          
          <div className="relative w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] sm:animate-[fadeIn_0.2s_ease-out] max-h-[95vh] sm:max-h-[85vh] overflow-y-auto safe-bottom">
            {/* Close Button */}
            <button 
              onClick={() => handleSelectComponent(null)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 bg-[#8D6E63] text-white hover:bg-[#5D4037] rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl z-10"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 sm:gap-4 mb-5 pr-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#5D4037] to-[#8D6E63] rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                {selectedComponent.IconComponent ? (
                  <selectedComponent.IconComponent size={22} className="text-white" />
                ) : (
                  <TrendingUp size={22} className="text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1 leading-tight">{selectedComponent.title || selectedComponent.name}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black text-[#5D4037]">
                    {selectedComponent.score}/{selectedComponent.maxScore}
                  </span>
                  {selectedComponent.trend && (
                    <span className="flex items-center text-emerald-600 font-bold text-[11px] sm:text-xs bg-emerald-50 px-2 py-0.5 rounded-full">
                      <TrendingUp size={10} className="mr-1" />
                      {selectedComponent.trend}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-5">
              <div className="h-2.5 sm:h-3 bg-[#F5EDE8] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#8D6E63] to-[#5D4037] rounded-full transition-all duration-500"
                  style={{ width: `${(selectedComponent.score / selectedComponent.maxScore) * 100}%` }}
                />
              </div>
              <p className="text-[11px] sm:text-xs text-[#A1887F] mt-1.5 text-right font-medium">
                {((selectedComponent.score / selectedComponent.maxScore) * 100).toFixed(0)}% completado
              </p>
            </div>

            {/* Why Improved Section */}
            <div className="bg-[#F5EDE8] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 mb-3 border border-[#E8DDD4]">
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#8D6E63] rounded-lg flex items-center justify-center">
                  <TrendingUp size={12} className="text-white" />
                </div>
                <h3 className="font-bold text-[#5D4037] text-xs sm:text-sm">¿Por qué mejoró?</h3>
              </div>
              <ul className="space-y-1.5 sm:space-y-2">
                {selectedComponent.details?.whyImproved.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-[13px] font-medium leading-snug text-[#5D4037]">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <span className="text-[#8D6E63] text-[10px] sm:text-xs font-bold">✓</span>
                    </div>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
                {!selectedComponent.details && (
                  <li className="text-xs sm:text-sm text-[#A1887F]">Detalles no disponibles.</li>
                )}
              </ul>
            </div>

            {/* How to Improve Section */}
            <div className="bg-gradient-to-br from-[#5D4037] to-[#8D6E63] rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <Lightbulb size={12} className="text-yellow-200" />
                </div>
                <h3 className="font-bold text-white text-xs sm:text-sm">Cómo mejorar</h3>
              </div>
              <ul className="space-y-2 sm:space-y-2.5">
                {selectedComponent.details?.howToImprove.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-[13px] font-medium leading-snug text-white/90">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-white text-[9px] sm:text-[10px] font-bold">{idx + 1}</span>
                    </div>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
                {!selectedComponent.details && (
                  <li className="text-xs sm:text-sm text-white/70">Consejos no disponibles.</li>
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
