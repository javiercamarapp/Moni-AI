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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { viewMode, year, month } = await req.json();

    console.log('Generating PDF for:', { viewMode, year, month, userId: user.id });

    // Fetch transactions based on viewMode
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (viewMode === 'mensual') {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query = query
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
    } else {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query = query
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
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
            padding: 20px;
            background: rgba(51, 65, 85, 0.4);
            border-radius: 12px;
            border: 1px solid rgba(71, 85, 105, 0.3);
          }
          .summary-item h3 {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .summary-item p {
            font-size: 28px;
            font-weight: bold;
          }
          .income { color: #10b981; }
          .expense { color: #ef4444; }
          .balance { color: ${balance >= 0 ? '#10b981' : '#ef4444'}; }
          .transactions {
            padding: 30px;
          }
          .transactions h2 {
            font-size: 22px;
            margin-bottom: 20px;
            color: #e0e6ed;
            border-bottom: 2px solid rgba(71, 85, 105, 0.3);
            padding-bottom: 12px;
          }
          .transaction-table {
            width: 100%;
            border-collapse: collapse;
          }
          .transaction-table th {
            background: rgba(51, 65, 85, 0.6);
            padding: 12px;
            text-align: left;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94a3b8;
            border-bottom: 2px solid rgba(71, 85, 105, 0.5);
          }
          .transaction-table td {
            padding: 14px 12px;
            border-bottom: 1px solid rgba(71, 85, 105, 0.2);
            font-size: 14px;
          }
          .transaction-table tr:hover {
            background: rgba(51, 65, 85, 0.3);
          }
          .category-badge {
            display: inline-block;
            padding: 4px 12px;
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 20px;
            font-size: 12px;
            color: #93c5fd;
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
            <h1>Estado de Cuenta - Moni</h1>
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
                    <td>${new Date(t.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>${t.description || 'Sin descripción'}</td>
                    <td><span class="category-badge">${t.category || 'Sin categoría'}</span></td>
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
                    <td>${new Date(t.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>${t.description || 'Sin descripción'}</td>
                    <td><span class="category-badge">${t.category || 'Sin categoría'}</span></td>
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
            <p>Generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })} • Moni - Tu asistente financiero</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use a PDF generation service or library
    // For now, we'll use PDFShift API (you'll need to add the API key as a secret)
    const pdfShiftApiKey = Deno.env.get('PDFSHIFT_API_KEY');
    
    if (!pdfShiftApiKey) {
      throw new Error('PDFSHIFT_API_KEY not configured');
    }

    const pdfResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(pdfShiftApiKey + ':')}`,
      },
      body: JSON.stringify({
        source: html,
        landscape: false,
        use_print: false,
      }),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('PDFShift error:', errorText);
      throw new Error('Failed to generate PDF');
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    const filename = `Estado_Cuenta_${periodText.replace(/ /g, '_')}.pdf`;

    return new Response(
      JSON.stringify({ 
        pdf: pdfBase64,
        filename 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error: any) {
    console.error('Error in generate-statement-pdf:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
