import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  transaction_date: string;
  categories?: {
    name: string;
    color: string;
  } | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, transactions } = await req.json();
    console.log('Generating movements PDF for user:', userId);

    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions provided');
    }

    // Calcular totales
    const totalIncome = transactions
      .filter((t: Transaction) => t.type === 'ingreso')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
    
    const totalExpense = transactions
      .filter((t: Transaction) => t.type === 'gasto')
      .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

    const balance = totalIncome - totalExpense;

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let aiInsights = '';

    if (LOVABLE_API_KEY) {
      try {
        const contextInfo = `Últimos 50 Movimientos Financieros
Total de Ingresos: $${totalIncome.toFixed(2)}
Total de Gastos: $${totalExpense.toFixed(2)}
Balance: $${balance.toFixed(2)}
Número de transacciones: ${transactions.length}`;

        const aiPrompt = `Analiza los siguientes datos financieros y proporciona conclusiones e insights valiosos:

${contextInfo}

Proporciona:
1. Un análisis del comportamiento financiero en estos últimos movimientos
2. 3-4 conclusiones clave sobre patrones y tendencias observadas
3. 2-3 recomendaciones específicas y accionables para mejorar las finanzas

Mantén el tono profesional y estructurado. Limita tu respuesta a 250 palabras.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un asesor financiero experto que proporciona análisis claros y recomendaciones prácticas en español.' },
              { role: 'user', content: aiPrompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = (aiData.choices?.[0]?.message?.content || '').replace(/\*/g, '');
        }
      } catch (aiError) {
        console.error('Error generating AI insights:', aiError);
        aiInsights = 'No se pudieron generar insights automáticos para este reporte.';
      }
    }

    // Generate HTML document
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Últimos 50 Movimientos - MONI AI</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      padding: 40px;
      line-height: 1.6;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #000000;
    }
    
    .logo {
      font-size: 32px;
      font-weight: 900;
      color: #000000;
      margin-right: 20px;
      letter-spacing: -1px;
    }
    
    .logo-subtitle {
      font-size: 12px;
      font-weight: 400;
      color: #666666;
      letter-spacing: 4px;
      margin-top: -5px;
    }
    
    .header-info {
      flex: 1;
    }
    
    .header-info h1 {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 5px;
    }
    
    .header-info p {
      font-size: 14px;
      color: #666;
    }
    
    .section {
      margin-bottom: 35px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 25px;
    }
    
    .metric-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    
    .metric-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .metric-value {
      font-size: 26px;
      font-weight: bold;
      color: #1a1a1a;
    }
    
    .metric-value.positive {
      color: #10b981;
    }
    
    .metric-value.negative {
      color: #ef4444;
    }
    
    .metric-value.balance {
      color: #3b82f6;
    }
    
    .table-container {
      overflow-x: auto;
      margin-bottom: 25px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    thead {
      background: #f3f4f6;
    }
    
    th {
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #d1d5db;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
      color: #1a1a1a;
      font-size: 13px;
      vertical-align: top;
    }
    
    tbody tr:hover {
      background: #f9fafb;
    }
    
    .amount-positive {
      color: #10b981;
      font-weight: 600;
    }
    
    .amount-negative {
      color: #ef4444;
      font-weight: 600;
    }
    
    .insights-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 25px;
      margin-top: 20px;
    }
    
    .insights-title {
      font-size: 18px;
      font-weight: 600;
      color: #0c4a6e;
      margin-bottom: 15px;
    }
    
    .insights-content {
      font-size: 14px;
      color: #334155;
      line-height: 1.8;
      white-space: pre-line;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Logo -->
    <div class="header">
      <div style="margin-right: 20px;">
        <div class="logo">MONI AI.</div>
        <div class="logo-subtitle">Coach financiero</div>
      </div>
      <div class="header-info">
        <h1>Reporte de Últimos 50 Movimientos</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-MX', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })}</p>
      </div>
    </div>

    <!-- Summary Section -->
    <div class="section">
      <h2 class="section-title">💰 Resumen Financiero</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Ingresos</div>
          <div class="metric-value positive">$${totalIncome.toLocaleString('es-MX', { 
            minimumFractionDigits: 0
          })}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Gastos</div>
          <div class="metric-value negative">$${totalExpense.toLocaleString('es-MX', { 
            minimumFractionDigits: 0
          })}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Balance</div>
          <div class="metric-value ${balance >= 0 ? 'positive' : 'negative'}">$${balance.toLocaleString('es-MX', { 
            minimumFractionDigits: 0
          })}</div>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="section">
      <h2 class="section-title">📋 Detalle de Movimientos</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">Fecha</th>
              <th style="width: 10%;">Tipo</th>
              <th style="width: 35%;">Descripción</th>
              <th style="width: 23%;">Categoría</th>
              <th style="width: 20%; text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map((transaction: Transaction) => {
              const isIncome = transaction.type === 'ingreso';
              const date = new Date(transaction.transaction_date);
              return `
                <tr>
                  <td>${date.toLocaleDateString('es-MX', { 
                    day: '2-digit', 
                    month: 'short'
                  })}</td>
                  <td><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; ${isIncome ? 'background: #d1fae5; color: #065f46;' : 'background: #fee2e2; color: #991b1b;'}">${isIncome ? 'Ingreso' : 'Gasto'}</span></td>
                  <td>${transaction.description || 'Sin descripción'}</td>
                  <td>${transaction.categories?.name || 'General'}</td>
                  <td style="text-align: right;" class="${isIncome ? 'amount-positive' : 'amount-negative'}">
                    ${isIncome ? '+' : '-'}$${Number(transaction.amount).toLocaleString('es-MX', { 
                      minimumFractionDigits: 2
                    })}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Desglose por tipo -->
    <div class="section">
      <h2 class="section-title">📊 Desglose por Tipo</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Cantidad de Ingresos</div>
          <div class="metric-value">${transactions.filter((t: Transaction) => t.type === 'ingreso').length}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Cantidad de Gastos</div>
          <div class="metric-value">${transactions.filter((t: Transaction) => t.type === 'gasto').length}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Movimientos</div>
          <div class="metric-value">${transactions.length}</div>
        </div>
      </div>
    </div>

    <!-- Conclusiones e Insights -->
    ${aiInsights ? `
    <div class="section">
      <h2 class="section-title">📊 Conclusiones e Insights</h2>
      <div class="insights-box">
        <div class="insights-title">Análisis Inteligente</div>
        <div class="insights-content">${aiInsights}</div>
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>Este reporte fue generado automáticamente por MONI AI - Tu asistente financiero inteligente</p>
      <p style="margin-top: 5px;">Para imprimir como PDF: Presiona Ctrl+P (Cmd+P en Mac) y selecciona "Guardar como PDF"</p>
    </div>
  </div>
</body>
</html>
    `;

    const filename = `Ultimos_50_Movimientos_${new Date().toISOString().split('T')[0]}.html`;

    return new Response(
      JSON.stringify({ html, filename }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error generating movements PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
