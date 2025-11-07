import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó autorización." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuario no autenticado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url, circleId } = await req.json();

    if (!url || !circleId) {
      return new Response(
        JSON.stringify({ error: "URL y circleId son requeridos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is member of the circle
    const { data: membership, error: memberError } = await supabase
      .from("circle_members")
      .select("id")
      .eq("circle_id", circleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: "No eres miembro de este círculo." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching content from URL: ${url}`);

    // Fetch the webpage content
    let htmlContent = "";
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MoniNewsBot/1.0)",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }
      
      htmlContent = await response.text();
    } catch (fetchError) {
      console.error("Error fetching URL:", fetchError);
      return new Response(
        JSON.stringify({ error: "No se pudo acceder a la URL proporcionada." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to extract metadata
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuración de IA no disponible." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Analiza el siguiente contenido HTML de una noticia financiera/económica y extrae la información más relevante.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes o después.

HTML:
${htmlContent.substring(0, 10000)}

Extrae y devuelve SOLO este JSON:
{
  "title": "título principal de la noticia (máximo 120 caracteres, claro y descriptivo)",
  "description": "resumen objetivo de la noticia en 3-5 líneas, enfocándote en los puntos clave y datos relevantes para inversionistas",
  "imageUrl": "URL completa de la imagen principal del artículo (null si no hay, busca en meta tags og:image, twitter:image o la primera imagen relevante del artículo)",
  "publishedAt": "fecha de publicación en formato ISO 8601 (busca en meta tags, article:published_time, o fechas en el contenido. Null si no se encuentra)"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un extractor de metadata de noticias. Respondes ÚNICAMENTE con JSON válido, sin explicaciones adicionales." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Error al procesar la noticia con IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No se pudo extraer información de la noticia." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI Response:", content);

    // Parse the JSON from AI response
    let metadata;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      metadata = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback to basic metadata
      metadata = {
        title: "Noticia sin título",
        description: "No se pudo extraer la descripción.",
        imageUrl: null,
        publishedAt: null,
      };
    }

    // Insert the news into the database
    const { data: newsData, error: insertError } = await supabase
      .from("circle_news")
      .insert({
        circle_id: circleId,
        user_id: user.id,
        url: url,
        title: metadata.title || "Noticia sin título",
        description: metadata.description || null,
        image_url: metadata.imageUrl || null,
        published_at: metadata.publishedAt || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting news:", insertError);
      return new Response(
        JSON.stringify({ error: "Error al guardar la noticia." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ news: newsData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in extract-news-metadata:", error);
    return new Response(
      JSON.stringify({ error: "Error inesperado al procesar la noticia." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});