import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, market } = await req.json();
    
    if (!query || query.length < 1) {
      return new Response(JSON.stringify({ quotes: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Yahoo Finance search API
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter by market if specified
    let quotes = data.quotes || [];
    
    if (market === 'MX') {
      quotes = quotes.filter((q: any) => 
        q.exchange === 'BMV' || q.symbol?.endsWith('.MX')
      );
    } else if (market === 'US') {
      quotes = quotes.filter((q: any) => 
        ['NYSE', 'NASDAQ', 'NYQ', 'NMS'].includes(q.exchange) || 
        (!q.symbol?.includes('.') && q.quoteType === 'EQUITY')
      );
    }

    // Get current prices for each quote
    const quotesWithPrices = await Promise.all(
      quotes.slice(0, 5).map(async (quote: any) => {
        try {
          const priceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${quote.symbol}?interval=1d&range=1d`;
          const priceResp = await fetch(priceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          const priceData = await priceResp.json();
          const price = priceData.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
          
          return {
            symbol: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
            exchange: quote.exchange,
            type: quote.quoteType,
            price: price,
          };
        } catch {
          return {
            symbol: quote.symbol,
            name: quote.longname || quote.shortname || quote.symbol,
            exchange: quote.exchange,
            type: quote.quoteType,
            price: 0,
          };
        }
      })
    );

    return new Response(JSON.stringify({ quotes: quotesWithPrices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-stocks:', error);
    return new Response(JSON.stringify({ error: error.message, quotes: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
