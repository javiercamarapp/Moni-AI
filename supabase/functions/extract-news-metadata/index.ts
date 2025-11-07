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

    // Extract metadata from HTML using better parsing
    let extractedTitle = "";
    let extractedDescription = "";
    let extractedImage = "";
    let extractedDate = "";

    // Try to extract from meta tags first
    const ogTitleMatch = htmlContent.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const twitterTitleMatch = htmlContent.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
    const titleTagMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    
    extractedTitle = ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleTagMatch?.[1] || "";

    const ogDescMatch = htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const twitterDescMatch = htmlContent.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    
    extractedDescription = ogDescMatch?.[1] || twitterDescMatch?.[1] || metaDescMatch?.[1] || "";

    const ogImageMatch = htmlContent.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const twitterImageMatch = htmlContent.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    
    extractedImage = ogImageMatch?.[1] || twitterImageMatch?.[1] || "";

    console.log("Extracted from HTML:", { title: extractedTitle, description: extractedDescription, image: extractedImage });

    // If we have good metadata, use AI to enhance the description
    const prompt = `Analiza esta noticia financiera y mejora la descripción para hacerla más informativa.

Título extraído: ${extractedTitle}
Descripción extraída: ${extractedDescription}

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional.

Reglas:
1. Si el título está vacío o es genérico, extráelo del siguiente HTML
2. Mejora la descripción para que sea un resumen de 4-5 líneas con información clave para inversionistas
3. La descripción debe ser objetiva, clara y enfocarse en datos relevantes

HTML (primeros 12000 caracteres):
${htmlContent.substring(0, 12000)}

Responde SOLO con este JSON:
{
  "title": "título claro y descriptivo (máximo 120 caracteres)",
  "description": "resumen en 4-5 líneas con información clave y datos relevantes"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Eres un experto en análisis de noticias financieras. Extraes títulos y descripciones claras y precisas. Respondes ÚNICAMENTE con JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
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
      
      // Use extracted metadata as fallback if AI didn't provide good data
      if (!metadata.title || metadata.title.length < 10) {
        metadata.title = extractedTitle || "Noticia compartida";
      }
      if (!metadata.description || metadata.description.length < 20) {
        metadata.description = extractedDescription || "Noticia financiera recomendada por la comunidad";
      }
      
      // Use extracted image if AI didn't find one
      if (!metadata.imageUrl && extractedImage) {
        metadata.imageUrl = extractedImage;
      }
      
      console.log("Final metadata:", metadata);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("AI response was:", content);
      
      // Use extracted metadata as fallback
      metadata = {
        title: extractedTitle || "Noticia compartida",
        description: extractedDescription || "Noticia financiera recomendada por la comunidad",
        imageUrl: extractedImage || null,
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