import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    console.log(`Calculando rankings para ${month}/${year}`);

    // Obtener todos los usuarios con su XP del mes
    const { data: rankings } = await supabaseClient
      .from('monthly_rankings')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .order('total_points', { ascending: false });

    if (!rankings || rankings.length === 0) {
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No hay rankings para calcular este mes'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calcular posiciones y ligas
    const totalUsers = rankings.length;
    
    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      const position = i + 1;
      const percentile = (position / totalUsers) * 100;

      // Asignar liga según percentil
      let league = 'bronze';
      if (percentile <= 5) league = 'diamond';
      else if (percentile <= 20) league = 'gold';
      else if (percentile <= 50) league = 'silver';

      await supabaseClient
        .from('monthly_rankings')
        .update({
          rank_global_position: position,
          league: league
        })
        .eq('id', ranking.id);
    }

    // Calcular rankings entre amigos
    const { data: friendships } = await supabaseClient
      .from('friendships')
      .select('*')
      .eq('status', 'accepted');

    if (friendships) {
      for (const friendship of friendships) {
        // Obtener rankings de amigos del usuario
        const friendIds = [friendship.user_id, friendship.friend_id];
        
        const { data: friendRankings } = await supabaseClient
          .from('monthly_rankings')
          .select('*')
          .eq('month', month)
          .eq('year', year)
          .in('user_id', friendIds)
          .order('total_points', { ascending: false });

        if (friendRankings) {
          for (let i = 0; i < friendRankings.length; i++) {
            await supabaseClient
              .from('monthly_rankings')
              .update({ rank_position: i + 1 })
              .eq('id', friendRankings[i].id);
          }
        }
      }
    }

    console.log(`Rankings calculados para ${rankings.length} usuarios`);

    return new Response(JSON.stringify({ 
      success: true,
      usersProcessed: rankings.length,
      message: 'Rankings actualizados correctamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});