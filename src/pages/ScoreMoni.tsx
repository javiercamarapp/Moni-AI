import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const ScoreMoni = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(40);
  const [loading, setLoading] = useState(true);
  const [previousScore] = useState(35); // Simulated previous score
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
    { dimension: 'Ahorro', value: components.savingsAndLiquidity, fullMark: 30 },
    { dimension: 'Deuda', value: components.debt, fullMark: 20 },
    { dimension: 'Control', value: components.control, fullMark: 20 },
    { dimension: 'Crecimiento', value: components.growth, fullMark: 15 },
    { dimension: 'Hábitos', value: components.behavior, fullMark: 15 }
  ];

  const scoreChange = previousScore ? score - previousScore : 0;
  const changeReason = scoreChange > 0 
    ? "Tu ahorro mensual aumentó 15% y redujiste gastos hormiga significativamente." 
    : scoreChange < 0 
    ? "Incremento en gastos variables y reducción en tu tasa de ahorro mensual."
    : undefined;

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
              <h1 className="text-xl font-bold text-white">Desglose Score Moni</h1>
              <p className="text-xs text-white/70">Análisis completo de tu salud financiera</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Score Breakdown Widget */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="p-8 bg-gradient-card card-glow border-white/20 min-h-[calc(100vh-200px)]">
          <div className="space-y-6 h-full flex flex-col">
            {/* Score Header */}
            <div>
              <p className="text-lg font-medium text-white/80 mb-2">Tu Score Moni</p>
              <div className="flex items-baseline gap-3">
                <p className="text-7xl font-bold text-white">{score}</p>
                <span className="text-3xl text-white/60">/100</span>
                {scoreChange !== 0 && (
                  <span className={`text-xl font-medium ${scoreChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {scoreChange > 0 ? '↑' : '↓'} {Math.abs(scoreChange)} pts
                  </span>
                )}
              </div>
            </div>

            {/* Radar Chart - Expanded */}
            <div className="flex-1 min-h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    tick={{ fill: 'white', fontSize: 16 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 30]}
                    tick={{ fill: 'white', fontSize: 14 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    labelStyle={{ color: 'white' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Change Reason */}
            {changeReason && (
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-purple-300 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-200 mb-1">¿Por qué cambió?</p>
                    <p className="text-sm text-white/70">{changeReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Score Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/10">
              {radarData.map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <span className="text-sm text-white/60 block mb-2">{item.dimension}</span>
                  <span className="text-2xl font-bold text-white block">
                    {item.value}
                  </span>
                  <span className="text-xs text-white/50">
                    de {item.fullMark}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default ScoreMoni;