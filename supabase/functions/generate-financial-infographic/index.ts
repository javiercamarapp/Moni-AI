import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      currentNetWorth, 
      totalAspiration, 
      gap, 
      aspirations, 
      comparativeData,
      userScore 
    } = await req.json();

    console.log("Generating financial infographic with data:", {
      currentNetWorth,
      totalAspiration,
      gap,
      aspirationsCount: aspirations?.length,
      userScore
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Preparar el texto del prompt con la información financiera
    const aspirationLabels: Record<number, string> = {
      1: "Casa principal",
      2: "Coche de tus sueños",
      3: "Ahorros disponibles",
      4: "Inversiones en bolsa",
      7: "Coche cónyuge",
      8: "Segunda propiedad",
      9: "Propiedades de inversión",
      10: "Terrenos",
      11: "Fondo de emergencia",
      12: "Criptomonedas",
      13: "AFORE/Retiro",
      14: "Empresas/Startups",
      15: "Vehículos extras"
    };

    // Crear resumen de aspiraciones
    const aspirationsSummary = aspirations
      .map((asp: any) => `${aspirationLabels[asp.question_id]}: $${Number(asp.value).toLocaleString('es-MX')}`)
      .join(', ');

    // Crear resumen comparativo
    const comparativeSummary = comparativeData
      .map((item: any) => `${item.category}: Actual $${Number(item.current).toLocaleString('es-MX')} / Meta $${Number(item.aspiration).toLocaleString('es-MX')}`)
      .join(', ');

    const progressPercentage = totalAspiration > 0 ? ((currentNetWorth / totalAspiration) * 100).toFixed(1) : '0';

    const prompt = `Crea una infografía financiera MINIMALISTA y ELEGANTE con el siguiente contenido:

LOGO Y TÍTULO:
- En la parte superior debe aparecer el logo "MONI AI." (tipografía bold, negra) con el subtítulo "coach financiero" debajo (tipografía delgada)
- Mantener el diseño exacto del logo: MONI AI. en negro bold con punto final

TÍTULO PRINCIPAL: "Mi Viaje Financiero"

SECCIÓN 1 - RESUMEN GENERAL:
- Net Worth Actual: $${Number(currentNetWorth).toLocaleString('es-MX')}
- Meta Aspiracional: $${Number(totalAspiration).toLocaleString('es-MX')}
- Brecha a Cerrar: $${Number(gap).toLocaleString('es-MX')}
- Progreso: ${progressPercentage}%
- Score Moni: ${userScore}/100

SECCIÓN 2 - MIS ASPIRACIONES:
${aspirationsSummary}

SECCIÓN 3 - COMPARATIVA POR CATEGORÍAS:
${comparativeSummary}

PALETA DE COLORES ESTRICTA (SOLO USAR ESTOS):
- BEIGE: #F5F5DC, #EAE0D5, #D4C5B0
- CAFÉ: #8B7355, #6F5645, #4A3728
- NEGRO: #000000, #1A1A1A
- GRIS: #9E9E9E, #6B6B6B, #D3D3D3

ESTILO VISUAL MINIMALISTA:
- Fondo: beige claro (#F5F5DC) uniforme o con textura muy sutil
- Logo "MONI AI." en NEGRO en la parte superior (tipografía bold moderna)
- Subtítulo "coach financiero" en gris oscuro (#6B6B6B) con tipografía delgada
- Tipografía principal: sans-serif elegante en negro
- Números: café oscuro (#4A3728) en negrita
- Iconos: líneas minimalistas en café (#6F5645) sin relleno
- Líneas divisorias: gris claro (#D3D3D3) delgadas
- NO usar colores fuera de la paleta
- NO usar gradientes coloridos
- Diseño ultra limpio con mucho espacio negativo
- Formato vertical 1080x1920px para Instagram Stories/redes sociales
- Aspecto sofisticado tipo revista financiera premium
- Estética minimalista escandinava/japonesa`;

    console.log("Calling Lovable AI image generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor intenta de nuevo más tarde." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar créditos a tu workspace de Lovable AI." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Lovable AI response received");

    // Extraer la imagen generada
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No se pudo generar la imagen");
    }

    console.log("Infographic generated successfully");

    return new Response(
      JSON.stringify({ 
        imageUrl,
        message: "Infografía generada exitosamente"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in generate-financial-infographic:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error al generar la infografía" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
