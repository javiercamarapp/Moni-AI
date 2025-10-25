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

    // Generar HTML del documento
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movimientos - MONI AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #e5e7eb;
        }
        .logo {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #374151;
            margin-bottom: 5px;
        }
        .date {
            color: #6b7280;
            font-size: 14px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 12px;
            border: 2px solid #e5e7eb;
        }
        .summary-card.income {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-color: #6ee7b7;
        }
        .summary-card.expense {
            background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
            border-color: #f87171;
        }
        .summary-card.balance {
            background: linear-gradient(135deg, #f0f9ff 0%, #bfdbfe 100%);
            border-color: #60a5fa;
        }
        .summary-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 8px;
        }
        .summary-amount {
            font-size: 24px;
            font-weight: 800;
        }
        .summary-card.income .summary-amount { color: #059669; }
        .summary-card.expense .summary-amount { color: #dc2626; }
        .summary-card.balance .summary-amount { color: #2563eb; }
        
        .section-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #1f2937;
        }
        .transaction {
            display: flex;
            align-items: center;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .transaction.income {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-color: #86efac;
        }
        .transaction.expense {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-color: #fca5a5;
        }
        .transaction-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 16px;
        }
        .transaction.income .transaction-icon {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        .transaction.expense .transaction-icon {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }
        .transaction-details {
            flex: 1;
        }
        .transaction-description {
            font-weight: 600;
            font-size: 14px;
            color: #1f2937;
        }
        .transaction-meta {
            font-size: 11px;
            color: #6b7280;
            margin-top: 2px;
        }
        .transaction-amount {
            font-weight: 800;
            font-size: 14px;
        }
        .transaction.income .transaction-amount { color: #059669; }
        .transaction.expense .transaction-amount { color: #dc2626; }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MONI AI</div>
            <h1 class="title">Últimos 50 Movimientos</h1>
            <p class="date">Generado el ${new Date().toLocaleDateString('es-MX', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}</p>
        </div>

        <div class="summary">
            <div class="summary-card income">
                <div class="summary-label">Total Ingresos</div>
                <div class="summary-amount">$${totalIncome.toLocaleString('es-MX', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</div>
            </div>
            <div class="summary-card expense">
                <div class="summary-label">Total Gastos</div>
                <div class="summary-amount">$${totalExpense.toLocaleString('es-MX', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</div>
            </div>
            <div class="summary-card balance">
                <div class="summary-label">Balance</div>
                <div class="summary-amount">$${balance.toLocaleString('es-MX', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</div>
            </div>
        </div>

        <h2 class="section-title">Detalle de Movimientos</h2>
        ${transactions.map((transaction: Transaction) => {
          const isIncome = transaction.type === 'ingreso';
          const date = new Date(transaction.transaction_date);
          return `
            <div class="transaction ${isIncome ? 'income' : 'expense'}">
                <div class="transaction-icon">${isIncome ? '💰' : '💳'}</div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-meta">
                        ${date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        ${transaction.categories?.name ? ` • ${transaction.categories.name}` : ''}
                    </div>
                </div>
                <div class="transaction-amount">
                    ${isIncome ? '+' : '-'}$${Number(transaction.amount).toLocaleString('es-MX', { 
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                </div>
            </div>
          `;
        }).join('')}

        <div class="footer">
            <p><strong>MONI AI</strong> - Tu coach financiero personal</p>
            <p>Este documento es un resumen de tus movimientos registrados</p>
        </div>
    </div>
</body>
</html>
    `;

    const filename = `Movimientos_${new Date().toISOString().split('T')[0]}.html`;

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
