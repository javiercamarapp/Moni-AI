import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Zap, Target, Shield, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';

const ScoreMoni = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(40);
  const [loading, setLoading] = useState(true);

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
        }
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: 'Excelente', color: 'from-[hsl(150,70%,40%)] to-[hsl(150,60%,30%)]', icon: Trophy };
    if (score >= 60) return { level: 'Bueno', color: 'from-[hsl(200,70%,40%)] to-[hsl(200,60%,30%)]', icon: CheckCircle };
    if (score >= 40) return { level: 'Regular', color: 'from-[hsl(45,70%,40%)] to-[hsl(45,60%,30%)]', icon: Target };
    return { level: 'Necesita Mejorar', color: 'from-[hsl(10,70%,40%)] to-[hsl(10,60%,30%)]', icon: AlertCircle };
  };

  const scoreLevel = getScoreLevel(score);
  const LevelIcon = scoreLevel.icon;

  const factors = [
    {
      name: 'Ahorro Consistente',
      description: 'Mantén un ahorro regular mensual',
      impact: '+15 pts',
      icon: TrendingUp,
      color: 'from-[hsl(150,60%,35%)] to-[hsl(150,55%,25%)]',
      current: score >= 60
    },
    {
      name: 'Control de Gastos',
      description: 'Mantén tus gastos dentro del presupuesto',
      impact: '+20 pts',
      icon: Shield,
      color: 'from-[hsl(200,60%,35%)] to-[hsl(200,55%,25%)]',
      current: score >= 50
    },
    {
      name: 'Metas Cumplidas',
      description: 'Completa tus metas financieras',
      impact: '+15 pts',
      icon: Target,
      color: 'from-[hsl(280,60%,35%)] to-[hsl(280,55%,25%)]',
      current: score >= 40
    },
    {
      name: 'Diversificación',
      description: 'Diversifica tus fuentes de ingreso',
      impact: '+10 pts',
      icon: Zap,
      color: 'from-[hsl(45,60%,35%)] to-[hsl(45,55%,25%)]',
      current: score >= 30
    },
    {
      name: 'Deudas Bajo Control',
      description: 'Mantén tus deudas en niveles manejables',
      impact: '+20 pts',
      icon: CheckCircle,
      color: 'from-[hsl(340,60%,35%)] to-[hsl(340,55%,25%)]',
      current: score >= 70
    },
    {
      name: 'Inversiones Activas',
      description: 'Mantén inversiones y activos creciendo',
      impact: '+20 pts',
      icon: TrendingUp,
      color: 'from-[hsl(25,60%,35%)] to-[hsl(25,55%,25%)]',
      current: score >= 80
    }
  ];

  const scoreRanges = [
    { min: 0, max: 39, label: 'Necesita Mejorar', color: 'hsl(10,70%,45%)', description: 'Tu salud financiera necesita atención urgente' },
    { min: 40, max: 59, label: 'Regular', color: 'hsl(45,70%,45%)', description: 'Vas por buen camino, pero hay áreas de mejora' },
    { min: 60, max: 79, label: 'Bueno', color: 'hsl(200,70%,45%)', description: 'Tu situación financiera es sólida' },
    { min: 80, max: 100, label: 'Excelente', color: 'hsl(150,70%,45%)', description: '¡Eres un maestro de las finanzas!' }
  ];

  return (
    <div className="min-h-screen bg-gradient-dashboard pb-20">
      {/* Header */}
      <div className="bg-gradient-card/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Score Moni</h1>
              <p className="text-xs text-white/70">Tu salud financiera en un número</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Score Principal */}
        <Card className={`p-6 bg-gradient-to-br ${scoreLevel.color} card-glow shadow-2xl border-2 border-white/20 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <LevelIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Tu Score Moni</p>
                  <p className="text-2xl font-bold text-white drop-shadow-lg">{scoreLevel.level}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-white drop-shadow-lg">{score}</div>
                <p className="text-sm text-white/80">de 100</p>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={score} className="h-3 bg-black/20" />
              <p className="text-xs text-white/90 drop-shadow">
                {score < 40 && 'Sigue trabajando en tus finanzas, ¡tú puedes!'}
                {score >= 40 && score < 60 && 'Vas bien, continúa mejorando tus hábitos'}
                {score >= 60 && score < 80 && 'Excelente progreso, sigue así'}
                {score >= 80 && '¡Increíble! Eres un ejemplo a seguir'}
              </p>
            </div>
          </div>
        </Card>

        {/* Qué es el Score Moni */}
        <Card className="p-6 bg-gradient-to-br from-[hsl(260,60%,25%)] to-[hsl(260,55%,15%)] card-glow shadow-2xl border-2 border-[hsl(260,70%,45%)]/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
          
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-3 drop-shadow-lg">¿Qué es el Score Moni?</h2>
            <p className="text-sm text-white/90 leading-relaxed drop-shadow">
              El Score Moni es una calificación de 0 a 100 que mide tu salud financiera general. 
              Toma en cuenta múltiples factores como tus hábitos de ahorro, control de gastos, 
              cumplimiento de metas, gestión de deudas y más. Entre más alto tu score, mejor es 
              tu situación financiera.
            </p>
          </div>
        </Card>

        {/* Rangos de Score */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Rangos del Score</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scoreRanges.map((range, index) => (
              <Card 
                key={index}
                className="p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border-2 border-white/20 relative overflow-hidden"
                style={{
                  boxShadow: score >= range.min && score <= range.max ? `0 0 30px ${range.color}` : undefined
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: range.color }}
                  />
                  <div>
                    <p className="text-sm font-bold text-white">{range.label}</p>
                    <p className="text-xs text-white/70">{range.min} - {range.max} pts</p>
                  </div>
                </div>
                <p className="text-xs text-white/80">{range.description}</p>
                {score >= range.min && score <= range.max && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Factores que Afectan tu Score */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Factores que Afectan tu Score</h2>
          <div className="space-y-3">
            {factors.map((factor, index) => {
              const FactorIcon = factor.icon;
              return (
                <Card 
                  key={index}
                  className={`p-4 bg-gradient-to-br ${factor.color} card-glow shadow-xl border-2 ${
                    factor.current ? 'border-white/40' : 'border-white/20'
                  } relative overflow-hidden animate-fade-in`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="relative z-10 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${
                      factor.current ? 'bg-white/30' : 'bg-white/10'
                    } flex items-center justify-center flex-shrink-0`}>
                      <FactorIcon className={`w-5 h-5 ${
                        factor.current ? 'text-white' : 'text-white/60'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-white drop-shadow-lg">{factor.name}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          factor.current 
                            ? 'bg-white/30 text-white' 
                            : 'bg-white/10 text-white/60'
                        }`}>
                          {factor.impact}
                        </span>
                      </div>
                      <p className="text-xs text-white/80 drop-shadow">{factor.description}</p>
                      {factor.current && (
                        <div className="mt-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-white" />
                          <span className="text-xs text-white/90">¡Lo estás logrando!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Cómo Mejorar */}
        <Card className="p-6 bg-gradient-to-br from-[hsl(150,60%,25%)] to-[hsl(150,55%,15%)] card-glow shadow-2xl border-2 border-[hsl(150,70%,45%)]/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white drop-shadow-lg">¿Cómo Mejorar tu Score?</h2>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/90 drop-shadow">
                  Mantén un registro consistente de tus ingresos y gastos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/90 drop-shadow">
                  Establece y cumple metas de ahorro realistas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/90 drop-shadow">
                  Reduce gastos innecesarios y acepta retos de ahorro
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/90 drop-shadow">
                  Mantén tus deudas bajo control y págalas a tiempo
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                <span className="text-sm text-white/90 drop-shadow">
                  Aumenta y diversifica tus activos e inversiones
                </span>
              </li>
            </ul>
          </div>
        </Card>

        <Button 
          onClick={() => navigate('/dashboard')}
          className="w-full bg-gradient-card card-glow hover:bg-white/20 text-white border border-white/30"
        >
          Volver al Dashboard
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ScoreMoni;
