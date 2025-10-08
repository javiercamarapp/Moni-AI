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

    const { viewMode, year, month, userId, type } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Si type está definido, validar que sea válido
    if (type && !['ingreso', 'gasto'].includes(type)) {
      throw new Error('Type must be either "ingreso" or "gasto"');
    }

    console.log('Generating PDF for:', { viewMode, year, month, userId, type: type || 'combined' });

    // Logo en base64 (MONI AI logo)
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAEsCAYAAADHm4vGAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSogMADIC4gAACIQCgAACBAAAgEQAOEQAaAAAMYAAgAPAA0AgQCAYA';

    // Fetch transactions based on viewMode
    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'mensual') {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    // Fetch ALL transactions using pagination (Supabase has 1000 record default limit)
    let allTransactions: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: pageError } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', userId)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (pageError) {
        throw new Error(`Error fetching transactions: ${pageError.message}`);
      }

      if (pageData && pageData.length > 0) {
        allTransactions = [...allTransactions, ...pageData];
        hasMore = pageData.length === pageSize;
        page++;
      } else {
        hasMore = false;
      }
    }

    const transactions = allTransactions;
    const transError = null;

    if (transError) {
      throw new Error(`Error fetching transactions: ${transError.message}`);
    }

    console.log('Transactions found:', transactions?.length || 0);

    // Filter by type if specified
    const filteredTransactions = type 
      ? transactions?.filter(t => t.type === type) || []
      : transactions || [];
    
    console.log(`Filtered transactions:`, filteredTransactions.length, type ? `(type: ${type})` : '(all types)');

    // Calculate totals
    const ingresos = filteredTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const gastos = filteredTransactions.filter(t => t.type === 'gasto').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = ingresos - gastos;
    const totalAmount = type === 'ingreso' ? ingresos : type === 'gasto' ? gastos : balance;

    console.log('=== PDF REPORT CALCULATIONS ===');
    console.log('Type:', type || 'combined');
    console.log('Date range:', { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] });
    console.log('Ingresos:', ingresos);
    console.log('Gastos:', gastos);
    console.log('Balance:', balance);
    console.log('================================');

    // Group by category
    const categoryMap = new Map<string, { name: string; total: number; color: string }>();
    const categoryColors = type === 'ingreso' 
      ? ['hsl(210, 55%, 35%)', 'hsl(150, 50%, 32%)', 'hsl(280, 52%, 33%)', 'hsl(30, 58%, 36%)', 'hsl(190, 53%, 34%)', 'hsl(45, 55%, 38%)']
      : ['hsl(25, 60%, 35%)', 'hsl(280, 50%, 32%)', 'hsl(340, 55%, 30%)', 'hsl(200, 55%, 32%)', 'hsl(145, 45%, 30%)', 'hsl(45, 60%, 35%)'];
    
    filteredTransactions.forEach(t => {
      if (t.categories) {
        const existing = categoryMap.get(t.categories.id) || {
          name: t.categories.name,
          total: 0,
          color: categoryColors[categoryMap.size % categoryColors.length]
        };
        existing.total += parseFloat(t.amount);
        categoryMap.set(t.categories.id, existing);
      }
    });

    const byCategory = Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        percentage: totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    // Función para generar SVG de gráfica de pastel
    const generatePieChartSVG = (data: Array<{ name: string; total: number; percentage: number; color: string }>, title: string): string => {
      if (data.length === 0) {
        return `<div style="text-align: center; padding: 40px; color: #9ca3af;">No hay datos para mostrar</div>`;
      }

      let currentAngle = -90; // Empezar desde arriba
      const radius = 80;
      const centerX = 100;
      const centerY = 100;

      const paths = data.map(item => {
        const angle = (item.percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
        const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArc = angle > 180 ? 1 : 0;
        
        const path = `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
        
        currentAngle = endAngle;
        return { path, color: item.color };
      });

      const svgPaths = paths.map(p => `<path d="${p.path}" fill="${p.color}" stroke="white" stroke-width="2"/>`).join('');
      
      return `
        <svg width="200" height="200" viewBox="0 0 200 200" style="margin: 0 auto; display: block;">
          ${svgPaths}
        </svg>
      `;
    };

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let aiInsights = '';

    if (LOVABLE_API_KEY) {
      try {
        const typeLabel = type === 'ingreso' ? 'Ingresos' : 'Gastos';
        const aiPrompt = `Analiza los siguientes datos de ${typeLabel.toLowerCase()} ${viewMode === 'mensual' ? 'mensuales' : 'anuales'} y proporciona conclusiones e insights valiosos:

Período: ${viewMode === 'mensual' ? `${month}/${year}` : year}
Total de ${typeLabel}: $${totalAmount.toFixed(2)}
Número de transacciones: ${filteredTransactions?.length || 0}
Categorías principales: ${byCategory.slice(0, 3).map(c => `${c.name} ($${c.total.toFixed(2)})`).join(', ')}

Proporciona:
1. Un análisis del desempeño de ${typeLabel.toLowerCase()}
2. 3-4 conclusiones clave sobre patrones y tendencias
3. 2-3 recomendaciones específicas y accionables para ${type === 'ingreso' ? 'aumentar ingresos' : 'optimizar gastos'}

Mantén el tono profesional. Limita tu respuesta a 250 palabras.`;

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
        <title>Reporte de Movimientos - Moni</title>
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
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: #f9fafb;
            border-radius: 6px;
            margin-top: 10px;
            font-weight: 600;
          }
          
          .summary-row .label {
            color: #374151;
          }
          
          .summary-row .value {
            color: #1a1a1a;
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
              <h1>Reporte de Movimientos Financieros</h1>
              <p>Período: ${periodText} • Generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <!-- Reporte de movimientos -->
          <div class="section">
            ${!type ? `
              <!-- Reporte Combinado -->
              <h2 class="section-title">💼 Estado de Cuenta Completo</h2>
              
              <!-- Métricas principales -->
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-label">Ingresos</div>
                  <div class="metric-value positive">$${ingresos.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Gastos</div>
                  <div class="metric-value negative">$${gastos.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Balance</div>
                  <div class="metric-value ${balance >= 0 ? 'positive' : 'negative'}">$${balance.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
                </div>
              </div>
              
              ${filteredTransactions.length > 0 ? `
                <div class="table-container" style="margin-top: 25px;">
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 15%;">Fecha</th>
                        <th style="width: 10%;">Tipo</th>
                        <th style="width: 35%;">Descripción</th>
                        <th style="width: 20%;">Categoría</th>
                        <th style="width: 20%; text-align: right;">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredTransactions.map(t => `
                        <tr>
                          <td>${new Date(t.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                          <td><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; ${t.type === 'ingreso' ? 'background: #d1fae5; color: #065f46;' : 'background: #fee2e2; color: #991b1b;'}">${t.type === 'ingreso' ? 'Ingreso' : 'Gasto'}</span></td>
                          <td>${t.description || 'Sin descripción'}</td>
                          <td>${t.categories?.name || 'General'}</td>
                          <td style="text-align: right;" class="${t.type === 'ingreso' ? 'amount-positive' : 'amount-negative'}">
                            ${t.type === 'ingreso' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : `<p style="color: #9ca3af; text-align: center; padding: 20px;">No hay movimientos registrados en este período</p>`}
            ` : `
              <!-- Reporte por tipo específico -->
              <h2 class="section-title">${type === 'ingreso' ? '📈 Ingresos' : '📉 Gastos'}</h2>
              ${filteredTransactions.length > 0 ? `
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 15%;">Fecha</th>
                        <th style="width: 45%;">Descripción</th>
                        <th style="width: 20%;">Categoría</th>
                        <th style="width: 20%; text-align: right;">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredTransactions.map(t => `
                        <tr>
                          <td>${new Date(t.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                          <td>${t.description || 'Sin descripción'}</td>
                          <td>${t.categories?.name || 'General'}</td>
                          <td style="text-align: right;" class="${type === 'ingreso' ? 'amount-positive' : 'amount-negative'}">
                            ${type === 'ingreso' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <div class="summary-row">
                  <span class="label">Total ${type === 'ingreso' ? 'Ingresos' : 'Gastos'}:</span>
                  <span class="value ${type === 'ingreso' ? 'amount-positive' : 'amount-negative'}">$${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <!-- Gráfica por Categoría -->
                ${byCategory.length > 0 ? `
                  <div style="margin-top: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; text-align: center;">${type === 'ingreso' ? 'Ingresos' : 'Gastos'} por Categoría</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center;">
                      <!-- Gráfica -->
                      <div style="display: flex; justify-content: center;">
                        ${generatePieChartSVG(byCategory, type === 'ingreso' ? 'Ingresos' : 'Gastos')}
                      </div>
                      <!-- Leyenda -->
                      <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${byCategory.map(cat => `
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 16px; height: 16px; border-radius: 4px; background: ${cat.color}; flex-shrink: 0;"></div>
                            <div style="flex: 1; min-width: 0;">
                              <div style="font-size: 13px; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cat.name}</div>
                              <div style="font-size: 12px; color: #6b7280;">$${cat.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${cat.percentage.toFixed(1)}%)</div>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                ` : ''}
              ` : `<p style="color: #9ca3af; text-align: center; padding: 20px;">No hay ${type === 'ingreso' ? 'ingresos' : 'gastos'} registrados en este período</p>`}
            `}
          </div>

          <!-- Métricas -->
          ${type ? `
          <div class="section">
            <h2 class="section-title">💰 Métricas</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total ${type === 'ingreso' ? 'Ingresos' : 'Gastos'}</div>
                <div class="metric-value ${type === 'ingreso' ? 'positive' : 'negative'}">$${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Transacciones</div>
                <div class="metric-value">${filteredTransactions?.length || 0}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Promedio por Transacción</div>
                <div class="metric-value">$${filteredTransactions.length > 0 ? (totalAmount / filteredTransactions.length).toLocaleString('es-MX', { minimumFractionDigits: 0 }) : '0'}</div>
              </div>
            </div>
          </div>
          ` : ''}

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

    // Generate downloadable HTML
    const typeLabel = type === 'ingreso' ? 'Ingresos' : 'Gastos';
    const filename = `Reporte_${typeLabel}_${viewMode === 'mensual' ? 'Mensual' : 'Anual'}_${periodText.replace(/ /g, '_')}.html`;

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
