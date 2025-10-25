import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Iniciando corrección de categorías...');

    // Obtener categoría de Entretenimiento
    const { data: entertainmentCats } = await supabase
      .from('categories')
      .select('id, user_id')
      .eq('name', 'Entretenimiento y estilo de vida')
      .is('parent_id', null);

    // Obtener categoría de Alimentación  
    const { data: foodCats } = await supabase
      .from('categories')
      .select('id, user_id')
      .eq('name', 'Alimentación')
      .is('parent_id', null);

    let totalUpdated = 0;

    // Actualizar para cada usuario
    for (const entertainmentCat of entertainmentCats || []) {
      const userId = entertainmentCat.user_id;
      
      // Obtener categoría "Gastos no identificados" del usuario
      const { data: unidentifiedCat } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'Gastos no identificados')
        .maybeSingle();
      
      // Actualizar Bar, Antro, Cine, Best Buy, Apple Store a Entretenimiento
      // Incluir las que tienen NULL o están en "Gastos no identificados"
      const entertainmentPatterns = ['%Bar%', '%Antro%', '%Cine%', '%Best Buy%', '%Apple%', '%Nike%', '%Liverpool%'];
      
      for (const pattern of entertainmentPatterns) {
        let query = supabase
          .from('transactions')
          .update({ category_id: entertainmentCat.id })
          .ilike('description', pattern)
          .eq('type', 'gasto')
          .eq('user_id', userId);
        
        // Actualizar solo las que están sin categoría o en "Gastos no identificados"
        if (unidentifiedCat) {
          query = query.or(`category_id.is.null,category_id.eq.${unidentifiedCat.id}`);
        } else {
          query = query.is('category_id', null);
        }
        
        const { count } = await query.select('*', { count: 'exact', head: true });
        
        if (count) {
          console.log(`Patrón ${pattern}: ${count} transacciones actualizadas`);
          totalUpdated += count;
        }
      }
    }

    console.log(`Actualizadas ${totalUpdated} transacciones a Entretenimiento`);

    // Actualizar Walmart a Alimentación
    let foodUpdated = 0;
    for (const foodCat of foodCats || []) {
      const userId = foodCat.user_id;
      
      // Obtener categoría "Gastos no identificados" del usuario
      const { data: unidentifiedCat } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'Gastos no identificados')
        .maybeSingle();
      
      let query = supabase
        .from('transactions')
        .update({ category_id: foodCat.id })
        .ilike('description', '%Walmart%')
        .eq('type', 'gasto')
        .eq('user_id', userId);
      
      // Actualizar solo las que están sin categoría o en "Gastos no identificados"
      if (unidentifiedCat) {
        query = query.or(`category_id.is.null,category_id.eq.${unidentifiedCat.id}`);
      } else {
        query = query.is('category_id', null);
      }

      const { count } = await query.select('*', { count: 'exact', head: true });

      if (count) {
        console.log(`Walmart: ${count} transacciones actualizadas`);
        foodUpdated += count;
      }
    }

    console.log(`Actualizadas ${foodUpdated} transacciones de Walmart a Alimentación`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        entertainment: totalUpdated,
        food: foodUpdated,
        total: totalUpdated + foodUpdated,
        message: `Actualizadas ${totalUpdated + foodUpdated} transacciones`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
