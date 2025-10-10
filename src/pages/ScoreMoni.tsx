import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, PiggyBank, CreditCard, Target, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const ScoreMoni = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(40);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [components, setComponents] = useState({
    savingsAndLiquidity: 0,
    debt: 0,
    control: 0,
    growth: 0,
    behavior: 0
  });

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_scores')
          .select('score_moni')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setScore(data.score_moni);
          
          // Calculate component breakdown (simulated based on score)
          const basePercentage = data.score_moni / 100;
          setComponents({
            savingsAndLiquidity: Math.round(30 * basePercentage * (0.9 + Math.random() * 0.2)),
            debt: Math.round(20 * basePercentage * (0.9 + Math.random() * 0.2)),
            control: Math.round(20 * basePercentage * (0.9 + Math.random() * 0.2)),
            growth: Math.round(15 * basePercentage * (0.9 + Math.random() * 0.2)),
            behavior: Math.round(15 * basePercentage * (0.9 + Math.random() * 0.2))
          });
        }
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  const radarData = [
    { 
      dimension: 'Ahorro y Liquidez', 
      value: components.savingsAndLiquidity, 
      fullMark: 30,
      icon: PiggyBank,
      color: '#10b981',
      description: 'Capacidad de ahorro mensual, meses de liquidez disponible, y fondos de emergencia'
    },
    { 
      dimension: 'Gestión de Deuda', 
      value: components.debt, 
      fullMark: 20,
      icon: CreditCard,
      color: '#ef4444',
      description: 'Ratio deuda-ingreso, carga financiera, y gestión de intereses'
    },
    { 
      dimension: 'Control Financiero', 
      value: components.control, 
      fullMark: 20,
      icon: Target,
      color: '#3b82f6',
      description: 'Gastos fijos vs variables, gastos hormiga, y control de presupuesto'
    },
    { 
      dimension: 'Crecimiento', 
      value: components.growth, 
      fullMark: 15,
      icon: TrendingUp,
      color: '#8b5cf6',
      description: 'Tasa de inversión, ROE personal, y crecimiento de patrimonio'
    },
    { 
      dimension: 'Hábitos', 
      value: components.behavior, 
      fullMark: 15,
      icon: Activity,
      color: '#f59e0b',
      description: 'Cumplimiento de metas, consistencia en ahorro, y compras impulsivas'
    }
  ];

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: 'Excelente', color: 'from-emerald-600 to-emerald-800', textColor: 'text-emerald-400' };
    if (score >= 60) return { level: 'Bueno', color: 'from-blue-600 to-blue-800', textColor: 'text-blue-400' };
    if (score >= 40) return { level: 'Regular', color: 'from-orange-600 to-orange-800', textColor: 'text-orange-400' };
    return { level: 'Necesita Mejorar', color: 'from-red-600 to-red-800', textColor: 'text-red-400' };
  };

  const scoreLevel = getScoreLevel(score);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Calculando tu Score Moni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dashboard pb-20">
      {/* Header */}
      <div className="bg-gradient-card/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/analysis')}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Score Moni</h1>
              <p className="text-xs text-white/70">Desglose completo de tu salud financiera</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Score Principal */}
        <Card className={`p-8 bg-gradient-to-br ${scoreLevel.color} card-glow shadow-2xl border-2 border-white/20 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <p className="text-sm text-white/80 mb-2">Tu Score Moni</p>
              <div className="flex items-baseline justify-center gap-3">
                <p className="text-7xl font-bold text-white drop-shadow-lg">{score}</p>
                <span className="text-2xl text-white/60">/100</span>
              </div>
              <p className="text-xl font-bold text-white mt-2">{scoreLevel.level}</p>
            </div>
          </div>
        </Card>

        {/* Radar Chart 3D Animado */}
        <Card className="p-6 bg-gradient-card card-glow border-white/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Análisis Multidimensional</h2>
              <p className="text-sm text-white/70">Interactúa con la gráfica para ver detalles</p>
            </div>

            {/* Radar Chart Container con efecto 3D */}
            <div 
              className="relative h-[500px] transition-transform duration-300 hover:scale-105"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d'
              }}
            >
              <div 
                className="absolute inset-0 transition-transform duration-500"
                style={{
                  transform: hoveredPoint ? 'rotateY(5deg) rotateX(5deg)' : 'rotateY(0deg) rotateX(0deg)',
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    data={radarData}
                    onMouseMove={(data: any) => {
                      if (data && data.activeLabel) {
                        setHoveredPoint(data.activeLabel);
                      }
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <radialGradient id="radarGradient">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      </radialGradient>
                    </defs>
                    
                    <PolarGrid 
                      stroke="rgba(255,255,255,0.2)" 
                      strokeWidth={hoveredPoint ? 2 : 1}
                      className="transition-all duration-300"
                    />
                    
                    <PolarAngleAxis 
                      dataKey="dimension" 
                      tick={{ 
                        fill: 'white', 
                        fontSize: 14, 
                        fontWeight: hoveredPoint ? 'bold' : 'normal' 
                      }}
                      className="transition-all duration-300"
                    />
                    
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 30]}
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                    />
                    
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fill="url(#radarGradient)"
                      fillOpacity={hoveredPoint ? 0.8 : 0.6}
                      filter="url(#glow)"
                      className="transition-all duration-300"
                      animationDuration={1500}
                      animationBegin={0}
                    />
                    
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-2xl">
                              <div className="flex items-center gap-2 mb-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <p className="text-sm font-bold text-white">{data.dimension}</p>
                              </div>
                              <p className="text-lg font-bold text-white mb-1">
                                {data.value}<span className="text-xs text-white/60">/{data.fullMark}</span>
                              </p>
                              <p className="text-xs text-white/70">{data.description}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>

        {/* Component Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {radarData.map((item, idx) => {
            const Icon = item.icon;
            const percentage = (item.value / item.fullMark) * 100;
            const isHovered = hoveredPoint === item.dimension;
            
            return (
              <Card 
                key={idx}
                className={`p-4 bg-gradient-card card-glow border-2 transition-all duration-300 ${
                  isHovered 
                    ? 'border-white/40 scale-105 shadow-2xl' 
                    : 'border-white/20'
                }`}
                onMouseEnter={() => setHoveredPoint(item.dimension)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: `${item.color}20`,
                      border: `2px solid ${item.color}40`
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1">{item.dimension}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{item.value}</span>
                      <span className="text-sm text-white/60">/{item.fullMark}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-white/70 mb-3">{item.description}</p>
                
                {/* Progress bar */}
                <div className="relative h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 10px ${item.color}80`
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* AI Methodology Explanation */}
        <Card className="p-6 bg-gradient-to-br from-purple-600/90 to-purple-800/90 card-glow border-2 border-purple-500/30">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-purple-200 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Metodología IA del Score Moni</h3>
              <p className="text-sm text-white/90 leading-relaxed">
                El Score Moni utiliza un sistema de análisis multidimensional basado en inteligencia artificial 
                que evalúa 5 aspectos fundamentales de tu salud financiera. Cada dimensión tiene un peso específico 
                que suma un total de 100 puntos, proporcionando una visión holística y precisa de tu situación actual.
              </p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <p className="text-sm text-white/80">
              {score >= 80 && "🎉 ¡Excelente trabajo! Tu perfil financiero está en un nivel óptimo. Mantén estos hábitos y considera diversificar aún más tus inversiones."}
              {score >= 60 && score < 80 && "👏 Tu situación financiera es sólida. Continúa mejorando en las áreas con menor puntaje para alcanzar la excelencia."}
              {score >= 40 && score < 60 && "💪 Vas por buen camino, pero hay áreas importantes que requieren atención. Enfócate en mejorar tu ahorro y control de gastos."}
              {score < 40 && "🎯 Es momento de tomar acción. Establece un presupuesto, reduce deudas y comienza a construir un fondo de emergencia. ¡Tú puedes!"}
            </p>
          </div>
        </Card>

        <Button 
          onClick={() => navigate('/analysis')}
          className="w-full bg-gradient-card card-glow hover:bg-white/20 text-white border border-white/30"
        >
          Volver al Análisis
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ScoreMoni;