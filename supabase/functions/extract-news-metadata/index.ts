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

    console.log("HTML content length:", htmlContent.length);

    // Direct AI extraction - let the AI handle everything
    const prompt = `Analiza el siguiente HTML de una página web de noticias financieras y extrae la información principal.

IMPORTANTE: Debes extraer el título principal del artículo y crear un resumen informativo.

HTML:
${htmlContent.substring(0, 15000)}

Instrucciones:
1. Busca el título principal del artículo (puede estar en <h1>, <title>, meta tags og:title, etc.)
2. Crea un resumen de 4-5 líneas que capture los puntos clave de la noticia
3. Si encuentras una imagen principal (og:image, twitter:image, etc.), incluye su URL completa
4. Si encuentras fecha de publicación, inclúyela en formato ISO

Responde ÚNICAMENTE con este JSON (sin texto adicional, sin markdown):
{
  "title": "Título principal del artículo (máximo 120 caracteres)",
  "description": "Resumen en 4-5 líneas con los puntos clave de la noticia",
  "imageUrl": "URL de la imagen principal o null",
  "publishedAt": "Fecha en formato ISO o null"
}`;

    console.log("Calling AI with prompt length:", prompt.length);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { 
            role: "system", 
            content: "Eres un experto extractor de información de noticias web. Analizas HTML y extraes títulos y descripciones. SIEMPRE respondes con JSON válido, nunca con texto plano." 
          },
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
      let cleanContent = content.trim();
      
      // Try to extract JSON from the response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      cleanContent = cleanContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      console.log("Attempting to parse JSON:", cleanContent.substring(0, 200));
      metadata = JSON.parse(cleanContent);
      
      // Validate that we have meaningful data
      if (!metadata.title || metadata.title.length < 5 || metadata.title.toLowerCase().includes("sin título")) {
        console.log("Title too short or generic, trying HTML extraction");
        
        // Try to extract from HTML directly
        const ogTitle = htmlContent.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        const titleTag = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        
        if (ogTitle?.[1]) {
          metadata.title = ogTitle[1].substring(0, 120);
        } else if (titleTag?.[1]) {
          metadata.title = titleTag[1].substring(0, 120);
        } else {
          // Extract from URL as last resort
          const urlParts = url.split('/').filter(p => p && p.length > 3);
          metadata.title = urlParts[urlParts.length - 1]?.replace(/-/g, ' ') || "Noticia financiera";
        }
      }
      
      if (!metadata.description || metadata.description.length < 30) {
        console.log("Description too short, trying HTML extraction");
        
        const ogDesc = htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
        const metaDesc = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        
        if (ogDesc?.[1]) {
          metadata.description = ogDesc[1];
        } else if (metaDesc?.[1]) {
          metadata.description = metaDesc[1];
        } else {
          metadata.description = "Artículo financiero recomendado por la comunidad.";
        }
      }
      
      // Try to get image from HTML if AI didn't find one
      if (!metadata.imageUrl) {
        const ogImage = htmlContent.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        const twitterImage = htmlContent.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        
        metadata.imageUrl = ogImage?.[1] || twitterImage?.[1] || null;
      }
      
      console.log("Final metadata:", { 
        title: metadata.title, 
        descLength: metadata.description?.length,
        hasImage: !!metadata.imageUrl 
      });
      
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("AI response was:", content);
      
      // Fallback: try to extract from HTML directly
      const ogTitle = htmlContent.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const titleTag = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogDesc = htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      const metaDesc = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const ogImage = htmlContent.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
      
      metadata = {
        title: ogTitle?.[1] || titleTag?.[1] || "Noticia financiera",
        description: ogDesc?.[1] || metaDesc?.[1] || "Artículo financiero recomendado por la comunidad.",
        imageUrl: ogImage?.[1] || null,
        publishedAt: null,
      };
      
      console.log("Using HTML fallback metadata:", metadata);
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