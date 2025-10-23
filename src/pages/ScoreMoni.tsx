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
  const [previousComponents] = useState({
    savingsAndLiquidity: 10,
    debt: 8,
    control: 7,
    growth: 5,
    behavior: 5
  });
  const [changeReason, setChangeReason] = useState<string | undefined>(undefined);
  const [loadingReason, setLoadingReason] = useState(false);

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
      savingsAndLiquidity: Math.min(30, Math.round(30 * basePercentage * (0.9 + Math.random() * 0.2))),
      debt: Math.min(20, Math.round(20 * basePercentage * (0.9 + Math.random() * 0.2))),
      control: Math.min(20, Math.round(20 * basePercentage * (0.9 + Math.random() * 0.2))),
      growth: Math.min(15, Math.round(15 * basePercentage * (0.9 + Math.random() * 0.2))),
      behavior: Math.min(15, Math.round(15 * basePercentage * (0.9 + Math.random() * 0.2)))
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
          const newScore = data.score_moni;
          setScore(newScore);
          // Update cache for Dashboard
          localStorage.setItem('scoreMoni', newScore.toString());
          
          // Calculate component breakdown
          const newComponents = {
            savingsAndLiquidity: Math.min(30, Math.round(30 * (newScore / 100) * (0.9 + Math.random() * 0.2))),
            debt: Math.min(20, Math.round(20 * (newScore / 100) * (0.9 + Math.random() * 0.2))),
            control: Math.min(20, Math.round(20 * (newScore / 100) * (0.9 + Math.random() * 0.2))),
            growth: Math.min(15, Math.round(15 * (newScore / 100) * (0.9 + Math.random() * 0.2))),
            behavior: Math.min(15, Math.round(15 * (newScore / 100) * (0.9 + Math.random() * 0.2)))
          };
          setComponents(newComponents);
          
          // Generate AI explanation for score change
          if (Math.abs(newScore - previousScore) > 0) {
            generateScoreExplanation(newScore, newComponents);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateScoreExplanation = async (currentScore: number, currentComponents: typeof components) => {
    try {
      setLoadingReason(true);
      const { data, error } = await supabase.functions.invoke('analyze-score-change', {
        body: {
          currentScore,
          previousScore,
          components: currentComponents,
          previousComponents
        }
      });

      if (error) throw error;
      
      if (data?.explanation) {
        setChangeReason(data.explanation);
      }
    } catch (error) {
      console.error('Error generating explanation:', error);
      // Fallback to static message
      const scoreChange = currentScore - previousScore;
      setChangeReason(
        scoreChange > 0 
          ? "Tu score mejoró gracias a mejores hábitos financieros." 
          : "Tu score disminuyó. Revisa tus gastos y ahorro para mejorarlo."
      );
    } finally {
      setLoadingReason(false);
    }
  };


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
          loadingReason={loadingReason}
        />
      </div>

      <BottomNav />
    </div>
  );
};

export default ScoreMoni;