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
      <div className="p-4 flex items-center justify-between border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-12 w-12"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Score Moni</h1>
            <p className="text-sm text-muted-foreground">Análisis completo de tu salud financiera</p>
          </div>
        </div>
      </div>

      {/* Score Breakdown Widget */}
      <div className="px-4 py-6">
        <ScoreBreakdownWidget
          components={components}
          scoreMoni={score}
          changeReason={changeReason}
          previousScore={previousScore}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default ScoreMoni;