import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useGamification() {
  const [loading, setLoading] = useState(false);

  const generatePersonalizedChallenges = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('generate-personalized-challenges');
      
      if (error) throw error;
      
      if (data.challenges && data.challenges.length > 0) {
        // Insertar retos en la BD
        for (const challenge of data.challenges) {
          await supabase.from('daily_challenges').insert({
            title: challenge.titulo,
            description: challenge.descripcion,
            challenge_type: challenge.challenge_type,
            category: challenge.category,
            target_amount: challenge.target_amount,
            xp_reward: challenge.xp_reward,
            difficulty: challenge.difficulty,
            period: challenge.period,
            estimated_savings: challenge.estimated_savings,
            is_personalized: true
          });
        }
        
        toast.success('¡Retos personalizados generados! 🎯');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error generando retos:', error);
      toast.error('Error al generar retos personalizados');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDailyFeedback = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-progress-feedback', {
        body: { feedbackType: 'daily' }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo feedback:', error);
      return null;
    }
  };

  return {
    loading,
    generatePersonalizedChallenges,
    getDailyFeedback
  };
}