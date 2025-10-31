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

TÍTULO PRINCIPAL: "Mi Viaje Financiero con Moni AI"

En la parte superior DEBE aparecer visible el logo de Moni AI (un búho minimalista en café oscuro)

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

MENSAJE MOTIVACIONAL:
"${
  Number(progressPercentage) >= 75 ? 'Estás muy cerca de alcanzar tus sueños financieros' :
  Number(progressPercentage) >= 50 ? 'Gran progreso. Sigue así y alcanzarás tus metas' :
  Number(progressPercentage) >= 25 ? 'Vas por buen camino. Cada paso cuenta' :
  'Comienza tu viaje financiero hoy. El futuro es tuyo'
}"

ESTILO VISUAL MINIMALISTA:
- Paleta de colores: tonos BEIGE (#F5F5DC, #E8D5B7, #D4C5A9), café claro (#A67B5B), café oscuro (#6F4E37), y blanco cremoso (#FFFEF2)
- Fondo: beige suave uniforme o con textura sutil
- Logo de Moni AI (búho) en café oscuro en la parte superior central
- Tipografía: elegante, sans-serif, en café oscuro
- Iconos: minimalistas de línea fina en café oscuro (sin relleno)
- NO usar colores vibrantes
- NO usar gradientes coloridos
- Diseño limpio con mucho espacio en blanco
- Líneas delgadas en café claro para separar secciones
- Formato vertical para redes sociales
- Aspecto sofisticado y profesional tipo revista de finanzas
- Estética minimalista japonesa (wabi-sabi) aplicada a finanzas`;

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
