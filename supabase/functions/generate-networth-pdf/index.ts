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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error al obtener perfil:', profileError);
    }

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
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (snapshotsError) {
      console.error('❌ Error al obtener snapshots:', snapshotsError);
      throw snapshotsError;
    }

    // Obtener activos actuales
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .order('value', { ascending: false });

    if (assetsError) {
      console.error('❌ Error al obtener activos:', assetsError);
      throw assetsError;
    }

    // Obtener pasivos actuales
    const { data: liabilities, error: liabilitiesError } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', userId)
      .order('value', { ascending: false });

    if (liabilitiesError) {
      console.error('❌ Error al obtener pasivos:', liabilitiesError);
      throw liabilitiesError;
    }

    // Calcular totales
    const totalAssets = assets?.reduce((sum, asset) => sum + Number(asset.value), 0) || 0;
    const totalLiabilities = liabilities?.reduce((sum, liability) => sum + Number(liability.value), 0) || 0;
    const netWorth = totalAssets - totalLiabilities;

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

    // Generar HTML
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Patrimonio Neto</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      color: #1a202c;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
    }
    
    .header h1 {
      color: #667eea;
      font-size: 32px;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #718096;
      font-size: 14px;
    }
    
    .user-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .user-info h2 {
      font-size: 20px;
      margin-bottom: 5px;
    }
    
    .user-info p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .summary-card {
      background: #f7fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .summary-card.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }
    
    .summary-card h3 {
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 10px;
      opacity: 0.8;
    }
    
    .summary-card .amount {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .summary-card .change {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section h2 {
      font-size: 20px;
      color: #667eea;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .items-grid {
      display: grid;
      gap: 15px;
    }
    
    .item {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .item-info {
      flex: 1;
    }
    
    .item-name {
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 5px;
    }
    
    .item-category {
      font-size: 12px;
      color: #718096;
    }
    
    .item-value {
      font-size: 18px;
      font-weight: bold;
      color: #2d3748;
    }
    
    .item-value.positive {
      color: #10b981;
    }
    
    .item-value.negative {
      color: #ef4444;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #718096;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Reporte de Patrimonio Neto</h1>
      <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
    </div>

    ${profile ? `
    <div class="user-info">
      <h2>${profile.full_name || 'Usuario'}</h2>
      <p>${profile.email}</p>
      <p>Período: ${timeRangeLabel}</p>
    </div>
    ` : ''}

    <div class="summary">
      <div class="summary-card primary">
        <h3>Patrimonio Neto</h3>
        <div class="amount">$${netWorth.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
        <div class="change">${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}% ${timeRangeLabel}</div>
      </div>
      
      <div class="summary-card">
        <h3>Total Activos</h3>
        <div class="amount">$${totalAssets.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
      </div>
      
      <div class="summary-card">
        <h3>Total Pasivos</h3>
        <div class="amount">$${totalLiabilities.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
      </div>
    </div>

    ${assets && assets.length > 0 ? `
    <div class="section">
      <h2>💰 Activos</h2>
      <div class="items-grid">
        ${assets.map(asset => `
          <div class="item">
            <div class="item-info">
              <div class="item-name">${asset.name}</div>
              <div class="item-category">${asset.category}</div>
            </div>
            <div class="item-value positive">$${Number(asset.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${liabilities && liabilities.length > 0 ? `
    <div class="section">
      <h2>💳 Pasivos</h2>
      <div class="items-grid">
        ${liabilities.map(liability => `
          <div class="item">
            <div class="item-info">
              <div class="item-name">${liability.name}</div>
              <div class="item-category">${liability.category}</div>
            </div>
            <div class="item-value negative">$${Number(liability.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p>Este reporte es confidencial y solo para uso personal</p>
      <p>Moni - Tu asistente financiero personal</p>
    </div>
  </div>
</body>
</html>
    `;

    const filename = `reporte-patrimonio-${new Date().toISOString().split('T')[0]}.pdf`;

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
