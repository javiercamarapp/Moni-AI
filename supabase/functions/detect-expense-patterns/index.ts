import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  payment_method?: string;
  account?: string;
  categories?: { name: string };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions, type } = await req.json();
    
    console.log(`Analyzing ${transactions?.length || 0} transactions for type: ${type}`);

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ expenses: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any[] = [];

    switch (type) {
      case 'fixed':
        result = detectFixedExpenses(transactions);
        break;
      case 'variable':
        result = detectVariableExpenses(transactions);
        break;
      case 'ant':
        result = detectAntExpenses(transactions);
        break;
      case 'impulsive':
        result = detectImpulsiveExpenses(transactions);
        break;
      default:
        throw new Error(`Invalid type: ${type}`);
    }

    console.log(`Detected ${result.length} ${type} expenses`);

    return new Response(
      JSON.stringify({ expenses: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error detecting expense patterns:', error);
    return new Response(
      JSON.stringify({ error: error.message, expenses: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function detectFixedExpenses(transactions: Transaction[]) {
  // Agrupar por descripción similar y monto
  const groups = new Map<string, Transaction[]>();
  
  transactions.forEach(t => {
    const normalizedDesc = normalizeDescription(t.description);
    const key = `${normalizedDesc}-${Math.round(Number(t.amount))}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(t);
  });

  const fixedExpenses: any[] = [];

  // Identificar gastos que se repiten mensualmente con el mismo monto
  groups.forEach((txs, key) => {
    if (txs.length >= 3) { // Al menos 3 ocurrencias
      // Verificar si son mensuales
      const dates = txs.map(t => new Date(t.transaction_date)).sort((a, b) => a.getTime() - b.getTime());
      const isMonthly = checkIfMonthly(dates);
      
      if (isMonthly) {
        const avgAmount = txs.reduce((sum, t) => sum + Number(t.amount), 0) / txs.length;
        const latest = txs[txs.length - 1];
        
        fixedExpenses.push({
          id: `fixed-${key}`,
          name: latest.description,
          amount: avgAmount,
          frequency: 'mensual',
          category: latest.categories?.name || 'Sin categoría',
          paymentMethod: latest.payment_method || 'No especificado',
          account: latest.account || 'Cuenta principal',
          occurrences: txs.length,
          lastPaymentDate: latest.transaction_date,
          icon: getExpenseIcon(latest.description),
          consistency: calculateConsistency(txs.map(t => Number(t.amount))),
        });
      }
    }
  });

  return fixedExpenses.sort((a, b) => b.amount - a.amount);
}

function detectVariableExpenses(transactions: Transaction[]) {
  // Agrupar por categoría
  const categoryGroups = new Map<string, Transaction[]>();
  
  transactions.forEach(t => {
    const category = t.categories?.name || 'Sin categoría';
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, []);
    }
    categoryGroups.get(category)!.push(t);
  });

  const variableExpenses: any[] = [];

  categoryGroups.forEach((txs, category) => {
    if (txs.length >= 2) {
      const amounts = txs.map(t => Number(t.amount));
      const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const variance = calculateVariance(amounts);
      
      // Solo incluir si hay variabilidad significativa
      if (variance > avgAmount * 0.2) {
        variableExpenses.push({
          id: `var-${category}`,
          name: category,
          avgAmount: avgAmount,
          minAmount: Math.min(...amounts),
          maxAmount: Math.max(...amounts),
          occurrences: txs.length,
          variance: variance,
          icon: getCategoryIcon(category),
          lastTransaction: txs[txs.length - 1].transaction_date,
        });
      }
    }
  });

  return variableExpenses.sort((a, b) => b.avgAmount - a.avgAmount);
}

function detectAntExpenses(transactions: Transaction[]) {
  // Gastos hormiga: gastos pequeños y frecuentes
  const antExpenses = transactions.filter(t => {
    const amount = Number(t.amount);
    return amount > 0 && amount <= 100; // Menos de $100
  });

  const groups = new Map<string, Transaction[]>();
  
  antExpenses.forEach(t => {
    const category = t.categories?.name || 'Varios';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(t);
  });

  const result: any[] = [];

  groups.forEach((txs, category) => {
    const total = txs.reduce((sum, t) => sum + Number(t.amount), 0);
    const avg = total / txs.length;
    
    result.push({
      id: `ant-${category}`,
      category: category,
      totalSpent: total,
      avgAmount: avg,
      occurrences: txs.length,
      icon: getCategoryIcon(category),
      lastDate: txs[txs.length - 1].transaction_date,
    });
  });

  return result.sort((a, b) => b.totalSpent - a.totalSpent);
}

function detectImpulsiveExpenses(transactions: Transaction[]) {
  // Compras impulsivas: montos grandes e inusuales
  const amounts = transactions.map(t => Number(t.amount));
  const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const stdDev = Math.sqrt(calculateVariance(amounts));
  
  const threshold = avg + (stdDev * 2); // 2 desviaciones estándar por encima del promedio
  
  const impulsive = transactions.filter(t => Number(t.amount) > threshold);
  
  return impulsive.map(t => ({
    id: t.id,
    name: t.description,
    amount: Number(t.amount),
    date: t.transaction_date,
    category: t.categories?.name || 'Sin categoría',
    paymentMethod: t.payment_method || 'No especificado',
    icon: getExpenseIcon(t.description),
    deviationFromAvg: ((Number(t.amount) - avg) / avg * 100).toFixed(1),
  })).sort((a, b) => b.amount - a.amount);
}

function normalizeDescription(desc: string): string {
  return desc.toLowerCase()
    .replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '')
    .replace(/\s*\d{4}$/g, '')
    .replace(/\d+/g, '')
    .trim();
}

function checkIfMonthly(dates: Date[]): boolean {
  if (dates.length < 2) return false;
  
  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
    // Permitir entre 25-35 días para considerar mensual
    if (diff < 25 || diff > 35) {
      return false;
    }
  }
  return true;
}

function calculateConsistency(amounts: number[]): number {
  const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const variance = calculateVariance(amounts);
  const coefficientOfVariation = Math.sqrt(variance) / avg;
  
  // Devolver porcentaje de consistencia (100% = monto siempre igual)
  return Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));
}

function calculateVariance(amounts: number[]): number {
  const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  return amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
}

function getExpenseIcon(desc: string): string {
  const lowerDesc = desc.toLowerCase();
  if (lowerDesc.includes('netflix')) return '🎬';
  if (lowerDesc.includes('spotify')) return '🎵';
  if (lowerDesc.includes('disney')) return '🏰';
  if (lowerDesc.includes('gym') || lowerDesc.includes('gimnasio')) return '💪';
  if (lowerDesc.includes('internet') || lowerDesc.includes('telmex')) return '📡';
  if (lowerDesc.includes('luz') || lowerDesc.includes('cfe')) return '💡';
  if (lowerDesc.includes('agua')) return '💧';
  if (lowerDesc.includes('gas')) return '🔥';
  if (lowerDesc.includes('renta') || lowerDesc.includes('alquiler')) return '🏠';
  if (lowerDesc.includes('teléfono') || lowerDesc.includes('telcel')) return '📱';
  return '💳';
}

function getCategoryIcon(category: string): string {
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes('comida') || lowerCat.includes('alimentos')) return '🍔';
  if (lowerCat.includes('transporte')) return '🚗';
  if (lowerCat.includes('entretenimiento')) return '🎮';
  if (lowerCat.includes('salud')) return '🏥';
  if (lowerCat.includes('educación')) return '📚';
  if (lowerCat.includes('ropa') || lowerCat.includes('vestimenta')) return '👔';
  if (lowerCat.includes('hogar') || lowerCat.includes('casa')) return '🏠';
  if (lowerCat.includes('café') || lowerCat.includes('cafetería')) return '☕';
  if (lowerCat.includes('snack')) return '🍿';
  return '📋';
}
