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

    // Calculate totals - CRITICAL: usar 'ingreso' y 'gasto', no 'income' y 'expense'
    const ingresos = transactions?.filter(t => t.type === 'ingreso') || [];
    const gastos = transactions?.filter(t => t.type === 'gasto') || [];
    
    console.log('Ingresos count:', ingresos.length);
    console.log('Gastos count:', gastos.length);
    
    const totalIngresos = ingresos.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalGastos = gastos.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = totalIngresos - totalGastos;
    const tasaAhorro = totalIngresos > 0 ? ((balance / totalIngresos) * 100) : 0;

    console.log('=== PDF REPORT CALCULATIONS ===');
    console.log('Date range:', { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] });
    console.log('Total Ingresos:', totalIngresos);
    console.log('Total Gastos:', totalGastos);
    console.log('Balance:', balance);
    console.log('Tasa Ahorro:', tasaAhorro);
    console.log('================================');

    // Agrupar ingresos por categoría
    const ingresosMap = new Map<string, { name: string; total: number; color: string }>();
    const incomeCategoryColors = [
      'hsl(210, 55%, 35%)', 'hsl(150, 50%, 32%)', 'hsl(280, 52%, 33%)',
      'hsl(30, 58%, 36%)', 'hsl(190, 53%, 34%)', 'hsl(45, 55%, 38%)'
    ];
    
    ingresos.forEach(t => {
      if (t.categories) {
        const existing = ingresosMap.get(t.categories.id) || {
          name: t.categories.name,
          total: 0,
          color: incomeCategoryColors[ingresosMap.size % incomeCategoryColors.length]
        };
        existing.total += parseFloat(t.amount);
        ingresosMap.set(t.categories.id, existing);
      }
    });

    const ingresosByCategory = Array.from(ingresosMap.values())
      .map(cat => ({
        ...cat,
        percentage: totalIngresos > 0 ? (cat.total / totalIngresos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    // Mapeo de categorías a grupos para gastos
    const categoryGroupMapping: Record<string, string> = {
      'restaurante': 'Comidas', 'restaurantes': 'Comidas', 'comida': 'Comidas',
      'alimentos': 'Comidas', 'supermercado': 'Comidas', 'despensa': 'Comidas',
      'entretenimiento': 'Entretenimiento', 'cine': 'Entretenimiento',
      'bar': 'Salidas Nocturnas', 'bares': 'Salidas Nocturnas', 'antro': 'Salidas Nocturnas',
      'servicios': 'Servicios', 'electricidad': 'Servicios', 'internet': 'Servicios',
      'streaming': 'Streaming', 'netflix': 'Streaming', 'spotify': 'Streaming',
      'auto': 'Auto', 'gasolina': 'Auto', 'uber': 'Auto', 'taxi': 'Auto'
    };

    const groupColors: Record<string, string> = {
      'Comidas': 'hsl(25, 60%, 35%)',
      'Entretenimiento': 'hsl(280, 50%, 32%)',
      'Salidas Nocturnas': 'hsl(340, 55%, 30%)',
      'Servicios': 'hsl(200, 55%, 32%)',
      'Streaming': 'hsl(145, 45%, 30%)',
      'Auto': 'hsl(45, 60%, 35%)',
      'Otros': 'hsl(220, 45%, 28%)'
    };

    const getCategoryGroup = (categoryName: string): string => {
      const lowerName = categoryName.toLowerCase();
      for (const [key, group] of Object.entries(categoryGroupMapping)) {
        if (lowerName.includes(key)) return group;
      }
      return 'Otros';
    };

    const gastosGroupMap = new Map<string, { name: string; total: number; color: string }>();
    gastos.forEach(t => {
      if (t.categories) {
        const groupName = getCategoryGroup(t.categories.name);
        const groupColor = groupColors[groupName] || groupColors['Otros'];
        const existing = gastosGroupMap.get(groupName) || {
          name: groupName,
          total: 0,
          color: groupColor
        };
        existing.total += parseFloat(t.amount);
        gastosGroupMap.set(groupName, existing);
      }
    });

    const gastosByCategory = Array.from(gastosGroupMap.values())
      .map(cat => ({
        ...cat,
        percentage: totalGastos > 0 ? (cat.total / totalGastos) * 100 : 0
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
        const aiPrompt = `Analiza los siguientes datos financieros ${viewMode === 'mensual' ? 'mensuales' : 'anuales'} y proporciona conclusiones e insights valiosos:

Período: ${viewMode === 'mensual' ? `${month}/${year}` : year}
Total de Ingresos: $${totalIngresos.toFixed(2)}
Total de Gastos: $${totalGastos.toFixed(2)}
Balance: $${balance.toFixed(2)}
Tasa de Ahorro: ${tasaAhorro.toFixed(1)}%
Número de transacciones: ${transactions?.length || 0}

Proporciona:
1. Un análisis del desempeño financiero
2. 3-4 conclusiones clave sobre patrones de gasto e ingreso
3. 2-3 recomendaciones específicas y accionables

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
          // Limpiar asteriscos del contenido
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

          <!-- Sección de Ingresos -->
          <div class="section">
            <h2 class="section-title">📈 Ingresos</h2>
            ${ingresos.length > 0 ? `
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
                    ${ingresos.map(t => `
                      <tr>
                        <td>${new Date(t.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                        <td>${t.description || 'Sin descripción'}</td>
                        <td>${t.categories?.name || 'General'}</td>
                        <td style="text-align: right;" class="amount-positive">
                          +$${parseFloat(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="summary-row">
                <span class="label">Total Ingresos:</span>
                <span class="value amount-positive">$${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <!-- Gráfica de Ingresos por Categoría -->
              ${ingresosByCategory.length > 0 ? `
                <div style="margin-top: 30px; page-break-inside: avoid;">
                  <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; text-align: center;">Ingresos por Categoría</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center;">
                    <!-- Gráfica -->
                    <div style="display: flex; justify-content: center;">
                      ${generatePieChartSVG(ingresosByCategory, 'Ingresos')}
                    </div>
                    <!-- Leyenda -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                      ${ingresosByCategory.map(cat => `
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
            ` : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No hay ingresos registrados en este período</p>'}
          </div>

          <!-- Sección de Egresos -->
          <div class="section">
            <h2 class="section-title">📉 Egresos (Gastos)</h2>
            ${gastos.length > 0 ? `
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
                    ${gastos.map(t => `
                      <tr>
                        <td>${new Date(t.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                        <td>${t.description || 'Sin descripción'}</td>
                        <td>${t.categories?.name || 'General'}</td>
                        <td style="text-align: right;" class="amount-negative">
                          -$${parseFloat(t.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              <div class="summary-row">
                <span class="label">Total Gastos:</span>
                <span class="value amount-negative">$${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <!-- Gráfica de Gastos por Categoría -->
              ${gastosByCategory.length > 0 ? `
                <div style="margin-top: 30px; page-break-inside: avoid;">
                  <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; text-align: center;">Gastos por Categoría</h3>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; align-items: center;">
                    <!-- Gráfica -->
                    <div style="display: flex; justify-content: center;">
                      ${generatePieChartSVG(gastosByCategory, 'Gastos')}
                    </div>
                    <!-- Leyenda -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                      ${gastosByCategory.map(cat => `
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
            ` : '<p style="color: #9ca3af; text-align: center; padding: 20px;">No hay gastos registrados en este período</p>'}
          </div>
          </div>

          <!-- Métricas de Ahorro -->
          <div class="section">
            <h2 class="section-title">💰 Métricas de Ahorro</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total Ingresos</div>
                <div class="metric-value positive">$${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Gastos</div>
                <div class="metric-value negative">$${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Balance Final</div>
                <div class="metric-value ${balance >= 0 ? 'positive' : 'negative'}">$${balance.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
              </div>
            </div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Tasa de Ahorro</div>
                <div class="metric-value">${tasaAhorro.toFixed(1)}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Transacciones</div>
                <div class="metric-value">${transactions?.length || 0}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Promedio Diario</div>
                <div class="metric-value">$${(totalGastos / 30).toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
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

    // Generate downloadable HTML
    const filename = `Reporte_Movimientos_${viewMode === 'mensual' ? 'Mensual' : 'Anual'}_${periodText.replace(/ /g, '_')}.html`;

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
