import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import ScoreDetail from '@/components/score/ScoreDetail';
import { useInvalidateFinancialData } from '@/hooks/useFinancialData';

const ScoreMoni = () => {
  const navigate = useNavigate();
  const invalidateFinancialData = useInvalidateFinancialData();
  const [score, setScore] = useState(() => {
    // Load from localStorage first for instant display
    const cached = localStorage.getItem('scoreMoni');
    return cached ? parseInt(cached) : 40;
  });
  const [previousScore] = useState(35); // Simulated previous score
  
  // We keep the fetch logic to update the score, but for now the components are hardcoded in the UI
  // until we map them correctly to the new RADAR_DATA structure.

  useEffect(() => {
    // Scroll to top immediately when page loads
    window.scrollTo(0, 0);
    
    // Fetch latest score in background
    fetchScore();
  }, []);

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

        // Invalidate React Query cache to sync dashboard
        invalidateFinancialData();
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    }
  };

  return (
    <div className="page-standard min-h-screen bg-[#F2F4F6]">
      <ScoreDetail 
        onBack={() => navigate('/dashboard')} 
        score={score}
      />
      <BottomNav />
    </div>
  );
};

export default ScoreMoni;