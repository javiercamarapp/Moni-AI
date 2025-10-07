import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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

    const { viewMode, year, month, userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Generating PDF for:', { viewMode, year, month, userId });

    // Fetch transactions based on viewMode
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (viewMode === 'mensual') {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query = query
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);
    } else {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query = query
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0]);
    }

    const { data: transactions, error: transError } = await query;

    if (transError) {
      throw new Error(`Error fetching transactions: ${transError.message}`);
    }

    // Calculate totals
    const ingresos = transactions?.filter(t => t.type === 'income') || [];
    const gastos = transactions?.filter(t => t.type === 'expense') || [];
    const totalIngresos = ingresos.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalGastos = gastos.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = totalIngresos - totalGastos;

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let aiInsights = '';

    if (LOVABLE_API_KEY) {
      try {
        const aiPrompt = `Analiza los siguientes datos financieros ${viewMode === 'mensual' ? 'mensuales' : 'anuales'} y proporciona insights valiosos y recomendaciones:

Período: ${viewMode === 'mensual' ? `${month}/${year}` : year}
Total de Ingresos: $${totalIngresos.toFixed(2)}
Total de Gastos: $${totalGastos.toFixed(2)}
Balance: $${balance.toFixed(2)}
Número de transacciones: ${transactions?.length || 0}

Categorías principales de gastos:
${gastos.slice(0, 5).map(g => `- ${g.description}: $${parseFloat(g.amount).toFixed(2)}`).join('\n')}

Proporciona:
1. Un análisis breve del desempeño financiero
2. 2-3 insights clave sobre patrones de gasto
3. 2-3 recomendaciones específicas para mejorar las finanzas

Mantén el tono profesional pero amigable. Limita tu respuesta a 200 palabras.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un asesor financiero experto que proporciona análisis claros y recomendaciones prácticas.' },
              { role: 'user', content: aiPrompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = aiData.choices?.[0]?.message?.content || '';
        }
      } catch (aiError) {
        console.error('Error generating AI insights:', aiError);
        aiInsights = 'No se pudieron generar insights automáticos para este período.';
      }
    }

    // Generate HTML for PDF
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const periodText = viewMode === 'mensual' 
      ? `${monthNames[month - 1]} ${year}`
      : `Año ${year}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            background: linear-gradient(135deg, #0a0f1c 0%, #1a1f35 100%);
            color: #e0e6ed;
            padding: 40px;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: rgba(20, 25, 45, 0.95);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            padding: 30px;
            color: white;
            text-align: center;
          }
          .header h1 {
            font-size: 32px;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          .summary {
            padding: 30px;
            background: rgba(30, 41, 59, 0.6);
            border-bottom: 1px solid rgba(71, 85, 105, 0.3);
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .summary-item {
            text-align: center;
            padding: 15px;
            background: rgba(51, 65, 85, 0.4);
            border-radius: 12px;
            border: 1px solid rgba(71, 85, 105, 0.3);
            overflow: hidden;
          }
          .summary-item h3 {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
          }
          .summary-item p {
            font-size: 22px;
            font-weight: bold;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.2;
          }
          .income { color: #10b981; }
          .expense { color: #ef4444; }
          .balance { color: ${balance >= 0 ? '#10b981' : '#ef4444'}; }
          
          .ai-insights {
            padding: 25px;
            background: rgba(30, 41, 59, 0.4);
            border-bottom: 1px solid rgba(71, 85, 105, 0.3);
          }
          .ai-insights h2 {
            font-size: 20px;
            margin-bottom: 14px;
            color: #60a5fa;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .ai-insights .content {
            background: rgba(51, 65, 85, 0.3);
            padding: 18px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            line-height: 1.6;
            font-size: 13px;
            color: #cbd5e1;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .transactions {
            padding: 25px;
          }
          .transactions h2 {
            font-size: 20px;
            margin-bottom: 16px;
            color: #e0e6ed;
            border-bottom: 2px solid rgba(71, 85, 105, 0.3);
            padding-bottom: 10px;
          }
          .transaction-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .transaction-table th {
            background: rgba(51, 65, 85, 0.6);
            padding: 10px 8px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94a3b8;
            border-bottom: 2px solid rgba(71, 85, 105, 0.5);
          }
          .transaction-table th:nth-child(1) { width: 18%; }
          .transaction-table th:nth-child(2) { width: 35%; }
          .transaction-table th:nth-child(3) { width: 25%; }
          .transaction-table th:nth-child(4) { width: 22%; }
          .transaction-table td {
            padding: 10px 8px;
            border-bottom: 1px solid rgba(71, 85, 105, 0.2);
            font-size: 12px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            vertical-align: top;
          }
          .transaction-table tr:hover {
            background: rgba(51, 65, 85, 0.3);
          }
          .category-badge {
            display: inline-block;
            padding: 3px 10px;
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 20px;
            font-size: 11px;
            color: #93c5fd;
            word-wrap: break-word;
            max-width: 100%;
          }
          .footer {
            padding: 20px 30px;
            text-align: center;
            background: rgba(15, 23, 42, 0.8);
            color: #94a3b8;
            font-size: 12px;
            border-top: 1px solid rgba(71, 85, 105, 0.3);
          }
          .section-divider {
            margin: 30px 0;
            border-top: 1px solid rgba(71, 85, 105, 0.3);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reporte de Movimientos - Moni</h1>
            <p>${periodText}</p>
          </div>
          
          <div class="summary">
            <div class="summary-grid">
              <div class="summary-item">
                <h3>Total Ingresos</h3>
                <p class="income">$${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="summary-item">
                <h3>Total Gastos</h3>
                <p class="expense">$${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
              <div class="summary-item">
                <h3>Balance</h3>
                <p class="balance">$${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          ${aiInsights ? `
          <div class="ai-insights">
            <h2>🤖 Análisis Inteligente</h2>
            <div class="content">${aiInsights}</div>
          </div>
          ` : ''}

          ${ingresos.length > 0 ? `
          <div class="transactions">
            <h2>Ingresos (${ingresos.length} transacciones)</h2>
            <table class="transaction-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th style="text-align: right;">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${ingresos.map(t => `
                  <tr>
                    <td>${new Date(t.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>${t.description || 'Sin descripción'}</td>
                    <td><span class="category-badge">${t.description || 'Sin categoría'}</span></td>
                    <td style="text-align: right; color: #10b981; font-weight: 600;">
                      +$${parseFloat(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${gastos.length > 0 ? `
          <div class="section-divider"></div>
          <div class="transactions">
            <h2>Gastos (${gastos.length} transacciones)</h2>
            <table class="transaction-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th style="text-align: right;">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${gastos.map(t => `
                  <tr>
                    <td>${new Date(t.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>${t.description || 'Sin descripción'}</td>
                    <td><span class="category-badge">${t.description || 'Sin categoría'}</span></td>
                    <td style="text-align: right; color: #ef4444; font-weight: 600;">
                      -$${parseFloat(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p>Generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} • Moni - Tu asistente financiero inteligente</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate downloadable HTML instead of PDF
    const filename = `Movimientos_${viewMode === 'mensual' ? 'Mes' : 'Anual'}_${periodText.replace(/ /g, '_')}.html`;

    return new Response(
      JSON.stringify({ 
        html: html,
        filename 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Error in generate-statement-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
