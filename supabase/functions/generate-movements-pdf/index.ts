import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Logo en base64 (MONI AI logo)
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAEsCAYAAADHm4vGAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSogMADIC4gAACIQCgAACBAAAgEQAOEQAaAAAMYAAgAPAA0AgQCAYA';

    // Generar HTML del documento
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
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="logo">MONI</div>
        <div class="logo-subtitle">FINANCE</div>
      </div>
      <div class="header-info">
        <h1>Últimos 50 Movimientos</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-MX', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}</p>
      </div>
    </div>

    <!-- Summary Section -->
    <div class="section">
      <h2 class="section-title">Resumen Financiero</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Ingresos</div>
          <div class="metric-value positive">$${totalIncome.toLocaleString('es-MX', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Gastos</div>
          <div class="metric-value negative">$${totalExpense.toLocaleString('es-MX', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Balance</div>
          <div class="metric-value balance">$${balance.toLocaleString('es-MX', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</div>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="section">
      <h2 class="section-title">Detalle de Movimientos</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th style="text-align: right;">Monto</th>
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
                    month: 'short', 
                    year: 'numeric' 
                  })}</td>
                  <td><strong>${transaction.description}</strong></td>
                  <td>${transaction.categories?.name || 'Sin categoría'}</td>
                  <td style="text-align: right;" class="${isIncome ? 'amount-positive' : 'amount-negative'}">
                    ${isIncome ? '+' : '-'}$${Number(transaction.amount).toLocaleString('es-MX', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>MONI</strong> - Tu coach financiero personal</p>
      <p>Este documento es un resumen de tus últimos 50 movimientos registrados</p>
      <p>© ${new Date().getFullYear()} MONI. Todos los derechos reservados.</p>
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
