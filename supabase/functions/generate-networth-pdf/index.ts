import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, timeRange } = await req.json();
    console.log('🔵 Generando reporte de patrimonio para usuario:', userId, 'con rango:', timeRange);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener datos del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Calcular fecha de inicio según timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'All':
        startDate = new Date('2000-01-01');
        break;
    }

    // Obtener snapshots de patrimonio
    const { data: snapshots } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    // Obtener activos actuales
    const { data: assets } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .order('value', { ascending: false });

    // Obtener pasivos actuales
    const { data: liabilities } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', userId)
      .order('value', { ascending: false });

    // Función para determinar si un activo es líquido
    const isLiquidAsset = (category: string, name?: string) => {
      const cat = category.toLowerCase();
      const accountName = name?.toLowerCase() || '';
      
      const illiquidKeywords = [
        'retirement', 'pension', 'retiro', 'pensión', '401k', 'ira', 'roth',
        'property', 'real estate', 'propiedad', 'inmueble', 'edificio',
        'machinery', 'maquinaria', 'equipment', 'equipo',
        'certificate', 'certificado', 'cd',
        'annuity', 'anualidad', 'plan', 'jubilación', 'jubilacion'
      ];
      
      const hasIlliquidKeyword = illiquidKeywords.some(keyword => 
        cat.includes(keyword) || accountName.includes(keyword)
      );
      
      if (hasIlliquidKeyword) return false;
      
      const liquidKeywords = [
        'cash', 'efectivo', 'dinero',
        'checking', 'corriente', 'cuenta corriente',
        'saving', 'ahorro', 'cuenta de ahorro',
        'money market', 'mercado de dinero',
        'deposit', 'depósito', 'depósito a la vista'
      ];
      
      return liquidKeywords.some(keyword => cat.includes(keyword));
    };

    // Categorizar activos por liquidez
    const liquidAssets = assets?.filter(a => isLiquidAsset(a.category, a.name)) || [];
    const illiquidAssets = assets?.filter(a => !isLiquidAsset(a.category, a.name)) || [];

    // Agrupar activos por categoría
    const assetsByCategory = new Map<string, { name: string; total: number; items: any[] }>();
    assets?.forEach(asset => {
      const existing = assetsByCategory.get(asset.category) || {
        name: asset.category,
        total: 0,
        items: []
      };
      existing.total += Number(asset.value);
      existing.items.push(asset);
      assetsByCategory.set(asset.category, existing);
    });

    // Agrupar pasivos por categoría
    const liabilitiesByCategory = new Map<string, { name: string; total: number; items: any[] }>();
    liabilities?.forEach(liability => {
      const existing = liabilitiesByCategory.get(liability.category) || {
        name: liability.category,
        total: 0,
        items: []
      };
      existing.total += Number(liability.value);
      existing.items.push(liability);
      liabilitiesByCategory.set(liability.category, existing);
    });

    const assetCategories = Array.from(assetsByCategory.values()).sort((a, b) => b.total - a.total);
    const liabilityCategories = Array.from(liabilitiesByCategory.values()).sort((a, b) => b.total - a.total);

    // Calcular totales
    const totalAssets = assets?.reduce((sum, asset) => sum + Number(asset.value), 0) || 0;
    const totalLiabilities = liabilities?.reduce((sum, liability) => sum + Number(liability.value), 0) || 0;
    const netWorth = totalAssets - totalLiabilities;
    const liquidTotal = liquidAssets.reduce((sum, a) => sum + Number(a.value), 0);

    // Calcular cambio porcentual
    let percentageChange = 0;
    if (snapshots && snapshots.length > 1) {
      const firstValue = Number(snapshots[0].net_worth);
      const lastValue = Number(snapshots[snapshots.length - 1].net_worth);
      if (firstValue !== 0) {
        percentageChange = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
      }
    }

    const timeRangeLabel = timeRange === '1M' ? 'último mes' :
                           timeRange === '3M' ? 'últimos 3 meses' :
                           timeRange === '6M' ? 'últimos 6 meses' :
                           timeRange === '1Y' ? 'último año' : 'total';

    // Función para generar gráfica de pastel SVG
    const generatePieChartSVG = (categories: Array<{ name: string; total: number }>, colors: string[]): string => {
      if (categories.length === 0) {
        return `<div style="text-align: center; padding: 40px; color: #9ca3af;">No hay datos para mostrar</div>`;
      }

      const total = categories.reduce((sum, cat) => sum + cat.total, 0);
      let currentAngle = -90;
      const radius = 80;
      const centerX = 100;
      const centerY = 100;

      const paths = categories.map((cat, index) => {
        const percentage = (cat.total / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
        const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
        const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
        const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArc = angle > 180 ? 1 : 0;
        const path = `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
        
        currentAngle = endAngle;
        return { path, color: colors[index % colors.length], percentage };
      });

      const svgPaths = paths.map(p => `<path d="${p.path}" fill="${p.color}" stroke="white" stroke-width="2"/>`).join('');
      
      return `<svg width="200" height="200" viewBox="0 0 200 200" style="margin: 0 auto; display: block;">${svgPaths}</svg>`;
    };

    // Generar insights con IA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    let aiInsights = '';

    if (LOVABLE_API_KEY) {
      try {
        const aiPrompt = `Analiza los siguientes datos financieros de patrimonio neto y proporciona conclusiones, insights valiosos y predicciones:

Período: ${timeRangeLabel}
Patrimonio Neto: $${netWorth.toFixed(2)}
Total Activos: $${totalAssets.toFixed(2)}
Total Pasivos: $${totalLiabilities.toFixed(2)}
Activos Líquidos: $${liquidTotal.toFixed(2)} (${((liquidTotal / totalAssets) * 100).toFixed(1)}% de activos)
Cambio de Patrimonio: ${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}% en ${timeRangeLabel}
Ratio Activos/Pasivos: ${totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : 'N/A'}

Principales categorías de activos:
${assetCategories.slice(0, 3).map(c => `- ${c.name}: $${c.total.toFixed(2)}`).join('\n')}

Principales categorías de pasivos:
${liabilityCategories.slice(0, 3).map(c => `- ${c.name}: $${c.total.toFixed(2)}`).join('\n')}

Proporciona:
1. Un análisis detallado de la salud financiera actual
2. 3-4 conclusiones clave sobre la estructura del patrimonio
3. Evaluación de liquidez y capacidad de respuesta a emergencias
4. 2-3 predicciones sobre tendencias futuras basadas en los datos actuales
5. 2-3 recomendaciones específicas y accionables para mejorar el patrimonio

Mantén el tono profesional pero accesible. Limita tu respuesta a 300 palabras.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un asesor financiero experto que proporciona análisis claros, predicciones fundamentadas y recomendaciones prácticas en español.' },
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

    const assetColors = ['hsl(150, 50%, 32%)', 'hsl(210, 55%, 35%)', 'hsl(280, 52%, 33%)', 'hsl(30, 58%, 36%)', 'hsl(190, 53%, 34%)', 'hsl(45, 55%, 38%)'];
    const liabilityColors = ['hsl(340, 55%, 30%)', 'hsl(25, 60%, 35%)', 'hsl(280, 50%, 32%)', 'hsl(200, 55%, 32%)', 'hsl(45, 60%, 35%)'];

    // Generar HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Patrimonio Neto - Moni</title>
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
            grid-template-columns: repeat(4, 1fr);
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
            font-size: 22px;
            font-weight: bold;
            color: #1a1a1a;
          }
          
          .metric-value.positive {
            color: #10b981;
          }
          
          .metric-value.negative {
            color: #ef4444;
          }
          
          .subsection {
            margin: 25px 0;
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
          }
          
          .subsection-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 15px;
          }
          
          .item-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .item-info {
            flex: 1;
          }
          
          .item-name {
            font-size: 14px;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          .item-category {
            font-size: 12px;
            color: #6b7280;
          }
          
          .item-value {
            font-size: 16px;
            font-weight: bold;
          }
          
          .category-section {
            margin: 20px 0;
            page-break-inside: avoid;
          }
          
          .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #1a1a1a;
            color: white;
            border-radius: 6px;
            margin-bottom: 10px;
          }
          
          .category-name {
            font-size: 15px;
            font-weight: 600;
          }
          
          .category-total {
            font-size: 16px;
            font-weight: bold;
          }
          
          .chart-section {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          
          .chart-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            align-items: center;
          }
          
          .legend {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            flex-shrink: 0;
          }
          
          .legend-label {
            flex: 1;
          }
          
          .legend-name {
            font-size: 13px;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          .legend-amount {
            font-size: 12px;
            color: #6b7280;
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
          <!-- Header con Logo -->
          <div class="header">
            <div style="margin-right: 20px;">
              <div class="logo">MONI AI.</div>
              <div class="logo-subtitle">Coach financiero</div>
            </div>
            <div class="header-info">
              <h1>Reporte de Patrimonio Neto</h1>
              <p>Período: ${timeRangeLabel} • Generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          ${profile ? `
          <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <div style="font-weight: 600; color: #1a1a1a;">${profile.full_name || 'Usuario'}</div>
            <div style="font-size: 13px; color: #6b7280;">${profile.email}</div>
          </div>
          ` : ''}

          <!-- Métricas Principales -->
          <div class="section">
            <h2 class="section-title">💼 Resumen Financiero</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Patrimonio Neto</div>
                <div class="metric-value ${netWorth >= 0 ? 'positive' : 'negative'}">$${netWorth.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Activos</div>
                <div class="metric-value positive">$${totalAssets.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total Pasivos</div>
                <div class="metric-value negative">$${totalLiabilities.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Cambio</div>
                <div class="metric-value ${percentageChange >= 0 ? 'positive' : 'negative'}">${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <!-- Activos -->
          <div class="section">
            <h2 class="section-title">💰 Activos Detallados</h2>
            
            <!-- Activos Líquidos -->
            ${liquidAssets.length > 0 ? `
            <div class="subsection">
              <div class="subsection-title">Activos Líquidos (${((liquidTotal / totalAssets) * 100).toFixed(1)}% del total)</div>
              <div class="item-list">
                ${liquidAssets.map(asset => `
                  <div class="item-row">
                    <div class="item-info">
                      <div class="item-name">${asset.name}</div>
                      <div class="item-category">${asset.category}</div>
                    </div>
                    <div class="item-value positive">$${Number(asset.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                  </div>
                `).join('')}
              </div>
              <div style="text-align: right; margin-top: 10px; font-weight: bold; color: #10b981;">
                Total Líquido: $${liquidTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>
            ` : ''}

            <!-- Activos por Categoría -->
            ${assetCategories.map(category => `
              <div class="category-section">
                <div class="category-header">
                  <span class="category-name">${category.name}</span>
                  <span class="category-total">$${category.total.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</span>
                </div>
                <div class="item-list">
                  ${category.items.map(asset => `
                    <div class="item-row">
                      <div class="item-info">
                        <div class="item-name">${asset.name}</div>
                      </div>
                      <div class="item-value positive">$${Number(asset.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}

            <!-- Gráfica de Activos -->
            ${assetCategories.length > 0 ? `
            <div class="chart-section">
              <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; text-align: center;">Distribución de Activos por Categoría</h3>
              <div class="chart-grid">
                <div style="display: flex; justify-content: center;">
                  ${generatePieChartSVG(assetCategories, assetColors)}
                </div>
                <div class="legend">
                  ${assetCategories.map((cat, index) => `
                    <div class="legend-item">
                      <div class="legend-color" style="background: ${assetColors[index % assetColors.length]};"></div>
                      <div class="legend-label">
                        <div class="legend-name">${cat.name}</div>
                        <div class="legend-amount">$${cat.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${((cat.total / totalAssets) * 100).toFixed(1)}%)</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Pasivos -->
          ${liabilities && liabilities.length > 0 ? `
          <div class="section">
            <h2 class="section-title">💳 Pasivos Detallados</h2>
            
            ${liabilityCategories.map(category => `
              <div class="category-section">
                <div class="category-header">
                  <span class="category-name">${category.name}</span>
                  <span class="category-total">$${category.total.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</span>
                </div>
                <div class="item-list">
                  ${category.items.map(liability => `
                    <div class="item-row">
                      <div class="item-info">
                        <div class="item-name">${liability.name}</div>
                      </div>
                      <div class="item-value negative">$${Number(liability.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}

            <!-- Gráfica de Pasivos -->
            ${liabilityCategories.length > 0 ? `
            <div class="chart-section">
              <h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; text-align: center;">Distribución de Pasivos por Categoría</h3>
              <div class="chart-grid">
                <div style="display: flex; justify-content: center;">
                  ${generatePieChartSVG(liabilityCategories, liabilityColors)}
                </div>
                <div class="legend">
                  ${liabilityCategories.map((cat, index) => `
                    <div class="legend-item">
                      <div class="legend-color" style="background: ${liabilityColors[index % liabilityColors.length]};"></div>
                      <div class="legend-label">
                        <div class="legend-name">${cat.name}</div>
                        <div class="legend-amount">$${cat.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${((cat.total / totalLiabilities) * 100).toFixed(1)}%)</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Conclusiones e Insights -->
          ${aiInsights ? `
          <div class="section">
            <h2 class="section-title">📊 Conclusiones, Insights y Predicciones</h2>
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

    const filename = `Reporte_Patrimonio_${timeRangeLabel.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    console.log('✅ Reporte generado exitosamente');

    return new Response(
      JSON.stringify({ html, filename }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error en generate-networth-pdf:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
