import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import ScoreBreakdownWidget from '@/components/analysis/ScoreBreakdownWidget';

const ScoreMoni = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(() => {
    // Load from localStorage first for instant display
    const cached = localStorage.getItem('scoreMoni');
    return cached ? parseInt(cached) : 40;
  });
  const [loading, setLoading] = useState(false);
  const [previousScore] = useState(35); // Simulated previous score
  const [components, setComponents] = useState({
    savingsAndLiquidity: 0,
    debt: 0,
    control: 0,
    growth: 0,
    behavior: 0
  });

  useEffect(() => {
    // Calculate initial components based on cached score
    const cachedScore = localStorage.getItem('scoreMoni');
    if (cachedScore) {
      calculateComponents(parseInt(cachedScore));
    }
    
    // Fetch latest score in background
    fetchScore();
  }, []);

  const calculateComponents = (scoreValue: number) => {
    const basePercentage = scoreValue / 100;
    setComponents({
      savingsAndLiquidity: Math.round(30 * basePercentage * (0.9 + Math.random() * 0.2)),
      debt: Math.round(20 * basePercentage * (0.9 + Math.random() * 0.2)),
      control: Math.round(20 * basePercentage * (0.9 + Math.random() * 0.2)),
      growth: Math.round(15 * basePercentage * (0.9 + Math.random() * 0.2)),
      behavior: Math.round(15 * basePercentage * (0.9 + Math.random() * 0.2))
    });
  };

  const fetchScore = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_scores')
          .select('score_moni')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && !error) {
          setScore(data.score_moni);
          // Update cache for Dashboard
          localStorage.setItem('scoreMoni', data.score_moni.toString());
          
          // Calculate component breakdown
          calculateComponents(data.score_moni);
        }
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  const scoreChange = previousScore ? score - previousScore : 0;
  const changeReason = scoreChange > 0 
    ? "Tu ahorro mensual aumentó 15% y redujiste gastos hormiga significativamente." 
    : scoreChange < 0 
    ? "Incremento en gastos variables y reducción en tu tasa de ahorro mensual."
    : undefined;

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="bg-gradient-card/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate(-1)}
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

      {/* Score Breakdown Widget en tamaño completo */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="transform scale-100 lg:scale-110 origin-top">
          <ScoreBreakdownWidget
            components={components}
            scoreMoni={score}
            changeReason={changeReason}
            previousScore={previousScore}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ScoreMoni;