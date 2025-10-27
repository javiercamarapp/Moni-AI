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
  type: string;
  payment_method?: string;
  account?: string;
  category_id?: string;
  categories?: { name: string };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📥 Request body received keys:', Object.keys(body));
    
    let userId = body.userId;
    
    // Si viene con transactions en lugar de userId, extraer el userId de la primera transacción
    if (!userId && body.transactions && body.transactions.length > 0) {
      userId = body.transactions[0].user_id;
      console.log('✅ Extracted userId from transactions:', userId);
    }
    
    if (!userId) {
      console.error('❌ userId not found in body');
      throw new Error('userId is required');
    }

    console.log(`🔍 Analyzing expense patterns for user: ${userId}`);

    // Conectar a Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener TODAS las transacciones de los últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(`
        id,
        description,
        amount,
        transaction_date,
        type,
        payment_method,
        account,
        category_id,
        categories (name)
      `)
      .eq('user_id', userId)
      .eq('type', 'gasto')
      .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('transaction_date', { ascending: true });

    if (txError) {
      console.error('Error fetching transactions:', txError);
      throw txError;
    }

    console.log(`📊 Found ${transactions?.length || 0} expense transactions in last 6 months`);

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({
          fixed: { total: 0, count: 0, percentage: 0, expenses: [] },
          variable: { total: 0, count: 0, percentage: 0, expenses: [] },
          ant: { total: 0, count: 0, percentage: 0, expenses: [] },
          impulsive: { total: 0, count: 0, percentage: 0, expenses: [] }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular totales
    const totalExpenses = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Detectar patrones
    const fixed = detectFixedExpenses(transactions);
    const variable = detectVariableExpenses(transactions);
    const ant = detectAntExpenses(transactions);
    const impulsive = detectImpulsiveExpenses(transactions);

    const fixedTotal = fixed.reduce((sum, e) => sum + e.amount, 0);
    const variableTotal = variable.reduce((sum, e) => sum + e.avgAmount, 0);
    const antTotal = ant.reduce((sum, e) => sum + e.totalSpent, 0);
    const impulsiveTotal = impulsive.reduce((sum, e) => sum + e.amount, 0);

    console.log(`💰 Totals - Fixed: ${fixedTotal}, Variable: ${variableTotal}, Ant: ${antTotal}, Impulsive: ${impulsiveTotal}`);
    console.log(`📊 Counts - Fixed: ${fixed.length}, Variable: ${variable.length}, Ant: ${ant.length}, Impulsive: ${impulsive.length}`);

    const result = {
      fixed: {
        total: fixedTotal,
        count: fixed.length,
        percentage: totalExpenses > 0 ? (fixedTotal / totalExpenses * 100) : 0,
        expenses: fixed
      },
      variable: {
        total: variableTotal,
        count: variable.length,
        percentage: totalExpenses > 0 ? (variableTotal / totalExpenses * 100) : 0,
        expenses: variable
      },
      ant: {
        total: antTotal,
        count: ant.length,
        percentage: totalExpenses > 0 ? (antTotal / totalExpenses * 100) : 0,
        expenses: ant
      },
      impulsive: {
        total: impulsiveTotal,
        count: impulsive.length,
        percentage: totalExpenses > 0 ? (impulsiveTotal / totalExpenses * 100) : 0,
        expenses: impulsive
      }
    };

    console.log('📦 Result structure:', JSON.stringify({
      fixed: { count: result.fixed.count, hasExpenses: result.fixed.expenses.length > 0 },
      variable: { count: result.variable.count, hasExpenses: result.variable.expenses.length > 0 },
      ant: { count: result.ant.count, hasExpenses: result.ant.expenses.length > 0 },
      impulsive: { count: result.impulsive.count, hasExpenses: result.impulsive.expenses.length > 0 }
    }));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error detecting expense patterns:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function detectFixedExpenses(transactions: Transaction[]) {
  // Agrupar transacciones por mes
  const monthlyGroups = new Map<string, Map<string, Transaction[]>>();
  
  transactions.forEach(t => {
    const month = t.transaction_date.substring(0, 7); // YYYY-MM
    const normalizedDesc = normalizeDescription(t.description);
    const amount = Math.round(Number(t.amount));
    const key = `${normalizedDesc}|${amount}`; // Mismo concepto + mismo monto
    
    if (!monthlyGroups.has(month)) {
      monthlyGroups.set(month, new Map());
    }
    
    const monthMap = monthlyGroups.get(month)!;
    if (!monthMap.has(key)) {
      monthMap.set(key, []);
    }
    monthMap.get(key)!.push(t);
  });

  // Contar cuántos meses diferentes tiene cada concepto+monto
  const conceptCounts = new Map<string, { months: Set<string>, transactions: Transaction[] }>();
  
  monthlyGroups.forEach((monthMap, month) => {
    monthMap.forEach((txs, key) => {
      if (!conceptCounts.has(key)) {
        conceptCounts.set(key, { months: new Set(), transactions: [] });
      }
      const data = conceptCounts.get(key)!;
      data.months.add(month);
      data.transactions.push(...txs);
    });
  });

  const fixedExpenses: any[] = [];
  const totalMonths = monthlyGroups.size;

  // Gastos que aparecen en al menos 50% de los meses con el mismo monto
  conceptCounts.forEach((data, key) => {
    const monthCount = data.months.size;
    const appearances = monthCount / totalMonths;
    
    if (appearances >= 0.5 && monthCount >= 2) { // Al menos 2 meses y 50% de frecuencia
      const amounts = data.transactions.map(t => Number(t.amount));
      const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const variance = calculateVariance(amounts);
      const consistency = variance < avgAmount * 0.1; // Variación menor al 10%
      
      if (consistency) {
        const latest = data.transactions[data.transactions.length - 1];
        
        fixedExpenses.push({
          id: `fixed-${key}`,
          name: latest.description,
          amount: avgAmount,
          frequency: 'mensual',
          category: latest.categories?.name || 'Sin categoría',
          paymentMethod: latest.payment_method || 'No especificado',
          account: latest.account || 'Cuenta principal',
          occurrences: data.transactions.length,
          monthsPresent: monthCount,
          lastPaymentDate: latest.transaction_date,
          icon: getExpenseIcon(latest.description),
          consistency: (1 - Math.sqrt(variance) / avgAmount) * 100,
        });
      }
    }
  });

  return fixedExpenses.sort((a, b) => b.amount - a.amount);
}

function detectVariableExpenses(transactions: Transaction[]) {
  // Categorías típicamente variables
  const variableKeywords = [
    'alimentación', 'comida', 'restaurant', 'uber', 'didi', 'gasolina',
    'agua', 'luz', 'gas', 'cfe', 'oxxo', 'walmart', 'soriana',
    'farmacia', 'mercado', 'super', 'tienda', 'delivery', 'rappi'
  ];

  // Agrupar por mes y concepto normalizado
  const monthlyGroups = new Map<string, Map<string, Transaction[]>>();
  
  transactions.forEach(t => {
    const normalizedDesc = normalizeDescription(t.description);
    const category = t.categories?.name || 'Sin categoría';
    
    // Verificar si es una categoría variable
    const isVariable = variableKeywords.some(kw => 
      normalizedDesc.includes(kw.toLowerCase()) || 
      category.toLowerCase().includes(kw.toLowerCase())
    );
    
    if (isVariable) {
      const month = t.transaction_date.substring(0, 7); // YYYY-MM
      
      if (!monthlyGroups.has(normalizedDesc)) {
        monthlyGroups.set(normalizedDesc, new Map());
      }
      
      const conceptMap = monthlyGroups.get(normalizedDesc)!;
      if (!conceptMap.has(month)) {
        conceptMap.set(month, []);
      }
      conceptMap.get(month)!.push(t);
    }
  });

  const variableExpenses: any[] = [];

  // Conceptos que aparecen en múltiples meses con montos diferentes
  monthlyGroups.forEach((monthMap, concept) => {
    const monthCount = monthMap.size;
    
    if (monthCount >= 2) { // Al menos 2 meses diferentes
      const allTxs: Transaction[] = [];
      const monthlyTotals: number[] = [];
      
      monthMap.forEach(txs => {
        allTxs.push(...txs);
        const monthTotal = txs.reduce((sum, t) => sum + Number(t.amount), 0);
        monthlyTotals.push(monthTotal);
      });
      
      const avgMonthly = monthlyTotals.reduce((sum, a) => sum + a, 0) / monthlyTotals.length;
      const variance = calculateVariance(monthlyTotals);
      const hasVariability = variance > avgMonthly * 0.15; // Variación mayor al 15%
      
      if (hasVariability) {
        const latest = allTxs[allTxs.length - 1];
        
        variableExpenses.push({
          id: `var-${concept}`,
          name: latest.description,
          avgAmount: avgMonthly,
          minAmount: Math.min(...monthlyTotals),
          maxAmount: Math.max(...monthlyTotals),
          category: latest.categories?.name || 'Sin categoría',
          occurrences: allTxs.length,
          monthsPresent: monthCount,
          variance: variance,
          icon: getExpenseIcon(latest.description),
          lastTransaction: latest.transaction_date,
        });
      }
    }
  });

  return variableExpenses.sort((a, b) => b.avgAmount - a.avgAmount);
}

function detectAntExpenses(transactions: Transaction[]) {
  // Gastos hormiga: gastos pequeños del ÚLTIMO MES solamente
  // Filtrar solo transacciones del último mes
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const lastMonthTransactions = transactions.filter(t => {
    const txDate = new Date(t.transaction_date);
    return txDate >= oneMonthAgo;
  });
  
  const antExpenses = lastMonthTransactions.filter(t => {
    const amount = Number(t.amount);
    return amount > 0 && amount < 200; // Menos de $200
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
    
    // Incluir el desglose de transacciones para cada categoría
    const breakdown = txs.map(t => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      date: t.transaction_date,
      paymentMethod: t.payment_method || 'No especificado',
      account: t.account || 'Cuenta principal'
    }));
    
    result.push({
      id: `ant-${category}`,
      category: category,
      totalSpent: total,
      avgAmount: avg,
      occurrences: txs.length,
      icon: getCategoryIcon(category),
      lastDate: txs[txs.length - 1].transaction_date,
      breakdown: breakdown // Agregar el desglose
    });
  });

  return result.sort((a, b) => b.totalSpent - a.totalSpent);
}

function detectImpulsiveExpenses(transactions: Transaction[]) {
  // Compras impulsivas: SOLO los gastos MÁS FUERTES y ATÍPICOS del año
  // No deben ser recurrentes, deben ser compras únicas y muy por encima del promedio
  
  const amounts = transactions.map(t => Number(t.amount));
  const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const stdDev = Math.sqrt(calculateVariance(amounts));
  
  // Umbral más estricto: 3 desviaciones estándar por encima del promedio
  // Y debe ser al menos 5 veces el promedio
  const threshold = Math.max(avg + (stdDev * 3), avg * 5);
  
  // Filtrar solo gastos muy por encima del umbral
  const impulsiveCandidates = transactions.filter(t => Number(t.amount) > threshold);
  
  // Agrupar por concepto para eliminar recurrentes
  const conceptGroups = new Map<string, Transaction[]>();
  impulsiveCandidates.forEach(t => {
    const normalizedDesc = normalizeDescription(t.description);
    if (!conceptGroups.has(normalizedDesc)) {
      conceptGroups.set(normalizedDesc, []);
    }
    conceptGroups.get(normalizedDesc)!.push(t);
  });
  
  // Solo incluir conceptos que aparecen 1 o 2 veces (no recurrentes)
  const impulsive: Transaction[] = [];
  conceptGroups.forEach(txs => {
    if (txs.length <= 2) {
      impulsive.push(...txs);
    }
  });
  
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
