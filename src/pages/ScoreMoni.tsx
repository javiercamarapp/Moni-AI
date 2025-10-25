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
  const [components, setComponents] = useState(() => {
    // Load from localStorage first for instant display
    const cached = localStorage.getItem('scoreComponents');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached components:', e);
      }
    }
    return {
      savingsAndLiquidity: 0,
      debt: 0,
      control: 0,
      growth: 0,
      behavior: 0
    };
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
    // Scroll to top immediately when page loads
    window.scrollTo(0, 0);
    
    // Fetch latest score in background (no loading state to avoid blocking UI)
    fetchScore();
  }, []);

  const calculateComponents = (scoreValue: number) => {
    // Esta función ya no se usa porque obtenemos los componentes reales del backend
    // La dejamos por compatibilidad con useEffect inicial
    console.log('⚠️ calculateComponents llamado con score:', scoreValue);
  };

  const fetchScore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener score Y componentes directamente de la tabla (súper rápido)
      const { data: scoreData, error: scoreError } = await supabase
        .from('user_scores')
        .select('score_moni, components')
        .eq('user_id', user.id)
        .maybeSingle();

      if (scoreData && !scoreError) {
        // Actualizar score
        const newScore = scoreData.score_moni;
        setScore(newScore);
        localStorage.setItem('scoreMoni', newScore.toString());

        // Actualizar componentes si existen
        if (scoreData.components) {
          setComponents(scoreData.components);
          localStorage.setItem('scoreComponents', JSON.stringify(scoreData.components));
          
          // Generate AI explanation for score change (en background, sin bloquear)
          if (Math.abs(newScore - previousScore) > 0) {
            generateScoreExplanation(newScore, scoreData.components);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    }
  };

  const generateScoreExplanation = async (currentScore: number, currentComponents: typeof components) => {
    try {
      setLoadingReason(true);
      
      // Timeout rápido para no bloquear la UI
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const fetchPromise = supabase.functions.invoke('analyze-score-change', {
        body: {
          currentScore,
          previousScore,
          components: currentComponents,
          previousComponents
        }
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) throw error;
      
      if (data?.explanation) {
        setChangeReason(data.explanation);
      }
    } catch (error) {
      console.log('Explanation not available:', error);
      // Fallback to static message - no es crítico
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
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Score Moni</h1>
              <p className="text-sm text-gray-500">Análisis de salud financiera</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown Widget */}
      <div className="max-w-7xl mx-auto px-4 py-6">
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