/**
 * Data transformation utilities for Analysis page components
 * Maps Supabase data structures to component-ready formats
 */

export interface FinancialRatioData {
    investmentRate: number;
    savingsRate: number;
    stability: number;
    debtCoverage: number;
    moneyAge: number;
    fixedCostOfLiving: number;
}

export interface ExpenseCategories {
    fixed: number;
    variable: number;
    ant: number; // Small expenses < $50
    impulsive: number; // Large one-time > $500
}

export interface EmergencyFundMetrics {
    liquidAssets: number;
    monthlyExpenses: number;
    monthsCoverage: number;
}

export interface DebtSummary {
    totalDebt: number;
    items: Array<{
        id: string;
        name: string;
        type: 'card' | 'loan' | 'mortgage';
        bank: string;
        balance: number;
        limit: number;
        apr?: string;
    }>;
}

/**
 * Calculate key financial ratios from user data
 */
export const calculateFinancialRatios = (data: {
    monthlyIncome: number;
    monthlyExpenses: number;
    fixedExpenses: number;
    netWorth: number;
    totalDebt: number;
    monthlyDebtPayment?: number;
    totalInvestments?: number;
}): FinancialRatioData => {
    const {
        monthlyIncome,
        monthlyExpenses,
        fixedExpenses,
        netWorth,
        totalDebt,
        monthlyDebtPayment = 0,
        totalInvestments = 0,
    } = data;

    // Investment Rate: (Investments / Income) * 100
    const investmentRate = monthlyIncome > 0
        ? (totalInvestments / monthlyIncome) * 100
        : 0;

    // Savings Rate: ((Income - Expenses) / Income) * 100
    const savingsRate = monthlyIncome > 0
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
        : 0;

    // Stability: Net Worth / Total Debt
    const stability = totalDebt > 0
        ? netWorth / totalDebt
        : netWorth > 0 ? 10 : 1;

    // Debt Coverage: Income / Monthly Debt Payments
    const debtCoverage = monthlyDebtPayment > 0
        ? monthlyIncome / monthlyDebtPayment
        : monthlyIncome > 0 ? 10 : 1;

    // Money Age: Placeholder calculation (days between income and expense)
    // This would require transaction-level timestamps in a real implementation
    const moneyAge = savingsRate > 50 ? 60 : savingsRate > 30 ? 45 : savingsRate > 10 ? 30 : 15;

    // Fixed Cost of Living: (Fixed Expenses / Income) * 100
    const fixedCostOfLiving = monthlyIncome > 0
        ? (fixedExpenses / monthlyIncome) * 100
        : 0;

    return {
        investmentRate: Math.round(investmentRate * 10) / 10,
        savingsRate: Math.round(savingsRate * 10) / 10,
        stability: Math.round(stability * 10) / 10,
        debtCoverage: Math.round(debtCoverage * 10) / 10,
        moneyAge: Math.round(moneyAge),
        fixedCostOfLiving: Math.round(fixedCostOfLiving * 10) / 10,
    };
};

/**
 * Categorize expenses into fixed, variable, ant, and impulsive
 */
export const categorizeExpenses = (
    transactions: Array<{ amount: number; type: string; frequency?: string }>,
    fixedExpenses: number
): ExpenseCategories => {
    const expenseTransactions = transactions.filter(
        (t) => t.type === 'expense' || t.type === 'gasto'
    );

    const variable = expenseTransactions
        .filter((t) => Number(t.amount) >= 50)
        .reduce((sum, t) => sum + Number(t.amount), 0) - fixedExpenses;

    const ant = expenseTransactions
        .filter((t) => Number(t.amount) < 50)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const impulsive = expenseTransactions
        .filter((t) => Number(t.amount) > 500 && (!t.frequency || t.frequency === 'once'))
        .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
        fixed: Math.round(fixedExpenses),
        variable: Math.round(Math.max(0, variable)),
        ant: Math.round(ant),
        impulsive: Math.round(impulsive),
    };
};

/**
 * Calculate emergency fund metrics
 */
export const calculateEmergencyFund = (
    liquidAssets: number,
    monthlyExpenses: number
): EmergencyFundMetrics => {
    const monthsCoverage = monthlyExpenses > 0
        ? liquidAssets / monthlyExpenses
        : 0;

    return {
        liquidAssets: Math.round(liquidAssets),
        monthlyExpenses: Math.round(monthlyExpenses),
        monthsCoverage: Math.round(monthsCoverage * 10) / 10,
    };
};

/**
 * Aggregate debt information from multiple sources
 */
export const aggregateDebts = (
    creditCards: Array<any> = [],
    loans: Array<any> = []
): DebtSummary => {
    const items: DebtSummary['items'] = [];

    // Map credit cards
    creditCards.forEach((card) => {
        items.push({
            id: card.id,
            name: card.name || 'Tarjeta',
            type: 'card',
            bank: card.bank || 'Banco',
            balance: Number(card.current_balance || 0),
            limit: Number(card.credit_limit || 0),
            apr: card.apr ? `CAT ${card.apr}%` : undefined,
        });
    });

    // Map loans
    loans.forEach((loan) => {
        items.push({
            id: loan.id,
            name: loan.name || 'Préstamo',
            type: loan.type === 'mortgage' ? 'mortgage' : 'loan',
            bank: loan.lender || 'Prestamista',
            balance: Number(loan.remaining_balance || 0),
            limit: Number(loan.original_amount || 0),
        });
    });

    const totalDebt = items.reduce((sum, item) => sum + item.balance, 0);

    return {
        totalDebt: Math.round(totalDebt),
        items,
    };
};

/**
 * Generate chart data for historical comparison
 */
export const generateHistoricalChartData = (
    transactions: Array<{ transaction_date: string; amount: number; type: string }>,
    months: number = 6
): Array<{ name: string; inc: number; exp: number; sav: number }> => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach((tx) => {
        const monthKey = tx.transaction_date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }

        if (tx.type === 'income' || tx.type === 'ingreso') {
            monthlyData[monthKey].income += Number(tx.amount);
        } else if (tx.type === 'expense' || tx.type === 'gasto') {
            monthlyData[monthKey].expenses += Number(tx.amount);
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const lastMonths = sortedMonths.slice(-months);

    return lastMonths.map((monthKey) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        const data = monthlyData[monthKey];

        return {
            name: monthNames[monthIndex],
            inc: Math.round(data.income / 1000), // In thousands
            exp: Math.round(data.expenses / 1000),
            sav: Math.round((data.income - data.expenses) / 1000),
        };
    });
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, decimals: boolean = false): string => {
    if (decimals) {
        return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${Math.round(amount).toLocaleString()}`;
};

/**
 * Get status label for a financial ratio
 */
export const getRatioStatus = (
    metric: 'investment' | 'savings' | 'stability' | 'coverage' | 'fixed',
    value: number
): 'Excelente' | 'Bueno' | 'Alerta' => {
    switch (metric) {
        case 'investment':
            return value >= 20 ? 'Excelente' : value >= 10 ? 'Bueno' : 'Alerta';
        case 'savings':
            return value >= 30 ? 'Excelente' : value >= 20 ? 'Bueno' : 'Alerta';
        case 'stability':
            return value >= 5 ? 'Excelente' : value >= 2 ? 'Bueno' : 'Alerta';
        case 'coverage':
            return value >= 3 ? 'Excelente' : value >= 2 ? 'Bueno' : 'Alerta';
        case 'fixed':
            return value <= 40 ? 'Excelente' : value <= 50 ? 'Bueno' : 'Alerta';
        default:
            return 'Bueno';
    }
};

/**
 * Calculate average monthly savings from historical transactions
 */
export const calculateAvgMonthlySavings = (
    transactions: Array<{ transaction_date: string; amount: number; type: string }>,
    months: number = 6
): number => {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach((tx) => {
        const monthKey = tx.transaction_date.substring(0, 7);
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }

        if (tx.type === 'income' || tx.type === 'ingreso') {
            monthlyData[monthKey].income += Number(tx.amount);
        } else if (tx.type === 'expense' || tx.type === 'gasto') {
            monthlyData[monthKey].expenses += Number(tx.amount);
        }
    });

    const monthlySavings = Object.values(monthlyData).map((d) => d.income - d.expenses);
    const validSavings = monthlySavings.filter((s) => !isNaN(s));

    if (validSavings.length === 0) return 0;

    const avgSavings = validSavings.reduce((sum, val) => sum + val, 0) / validSavings.length;
    return Math.round(avgSavings);
};

/**
 * Calculate financial projections for different scenarios
 */
export interface ProjectionData {
    currentBalance: number;
    avgMonthlySavings: number;
    months: number;
}

export const calculateProjections = (data: ProjectionData) => {
    const { currentBalance, avgMonthlySavings, months } = data;
    const projections = [];

    for (let i = 0; i <= months; i++) {
        const monthLabel = i === 0 ? 'Hoy' : `Mes ${i}`;

        // Conservative: 75% of average savings
        const conservative = currentBalance + (avgMonthlySavings * 0.75 * i);

        // Realistic: exactly average savings
        const realistic = currentBalance + (avgMonthlySavings * i);

        // Optimal: 120% of average + small compound growth
        const optimal = currentBalance + (avgMonthlySavings * 1.2 * i) + (i * 500);

        projections.push({
            name: monthLabel,
            conservative: Math.round(conservative),
            realistic: Math.round(realistic),
            optimal: Math.round(optimal),
        });
    }

    return projections;
};

/**
 * Find top expense transaction per category
 */
export const findTopExpensePerCategory = (
    transactions: Array<{ amount: number; description?: string; type: string }>,
    category: 'fixed' | 'variable' | 'ant' | 'impulsive'
): string => {
    let filtered = transactions.filter((t) => t.type === 'expense' || t.type === 'gasto');

    // Filter by category criteria
    switch (category) {
        case 'fixed':
            // Approximate: recurring expenses, would need tags in real implementation
            filtered = filtered.filter((t) => Number(t.amount) >= 1000);
            break;
        case 'variable':
            filtered = filtered.filter((t) => Number(t.amount) >= 50 && Number(t.amount) <= 5000);
            break;
        case 'ant':
            filtered = filtered.filter((t) => Number(t.amount) < 50);
            break;
        case 'impulsive':
            filtered = filtered.filter((t) => Number(t.amount) > 500);
            break;
    }

    if (filtered.length === 0) {
        return 'Sin datos: $0';
    }

    // Find highest amount
    const top = filtered.reduce((max, tx) =>
        Number(tx.amount) > Number(max.amount) ? tx : max
    );

    const description = top.description || 'Gasto';
    const amount = Math.round(Number(top.amount));

    return `${description}: $${amount.toLocaleString()}`;
};

/**
 * Calculate lifestyle radar chart dimensions
 */
export interface LifestyleRadarData {
    subject: string;
    A: number; // User score
    B: number; // Ideal benchmark
    fullMark: number;
}

export const calculateLifestyleRadar = (data: {
    savingsRate: number;
    debtToIncome: number;
    investmentRate: number;
    budgetAdherence: number;
    emergencyMonths: number;
}): LifestyleRadarData[] => {
    const { savingsRate, debtToIncome, investmentRate, budgetAdherence, emergencyMonths } = data;

    // Convert all metrics to 0-100 scale
    const ahorroScore = Math.min(100, Math.max(0, savingsRate));
    const disciplinaScore = Math.min(100, Math.max(0, budgetAdherence * 100));
    const deudaScore = Math.min(100, Math.max(0, 100 - (debtToIncome * 2))); // Lower debt = higher score
    const inversionScore = Math.min(100, Math.max(0, investmentRate * 5)); // 20% = 100
    const controlScore = Math.min(100, Math.max(0, savingsRate)); // Same as savings for now
    const previsionScore = Math.min(100, Math.max(0, emergencyMonths * 16.67)); // 6 months = 100

    return [
        { subject: 'Ahorro', A: Math.round(ahorroScore), B: 80, fullMark: 100 },
        { subject: 'Disciplina', A: Math.round(disciplinaScore), B: 90, fullMark: 100 },
        { subject: 'Deuda', A: Math.round(deudaScore), B: 100, fullMark: 100 },
        { subject: 'Inversión', A: Math.round(inversionScore), B: 85, fullMark: 100 },
        { subject: 'Control', A: Math.round(controlScore), B: 90, fullMark: 100 },
        { subject: 'Previsión', A: Math.round(previsionScore), B: 95, fullMark: 100 },
    ];
};

/**
 * Calculate overall lifestyle score
 */
export const calculateLifestyleScore = (radarData: LifestyleRadarData[]): number => {
    const avgScore = radarData.reduce((sum, d) => sum + d.A, 0) / radarData.length;
    return Math.round(avgScore);
};

/**
 * Calculate net worth growth from snapshots
 */
export const calculateNetWorthGrowth = (
    snapshots: Array<{ month: string; net_worth: number }>
): number => {
    if (snapshots.length < 2) return 0;

    // Sort by month
    const sorted = [...snapshots].sort((a, b) => a.month.localeCompare(b.month));
    const latest = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    if (previous.net_worth === 0) return 0;

    const growth = ((latest.net_worth - previous.net_worth) / previous.net_worth) * 100;
    return Math.round(growth * 10) / 10;
};

/**
 * Calculate budget adherence percentage
 */
export const calculateBudgetAdherence = (
    transactions: Array<{ transaction_date: string; amount: number; type: string }>,
    monthlyBudget: number
): number => {
    // Get last 12 months
    const monthlyData: Record<string, number> = {};

    transactions.forEach((tx) => {
        if (tx.type === 'expense' || tx.type === 'gasto') {
            const monthKey = tx.transaction_date.substring(0, 7);
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(tx.amount);
        }
    });

    const months = Object.values(monthlyData);
    if (months.length === 0) return 1; // Perfect adherence if no data

    const underBudgetMonths = months.filter((exp) => exp <= monthlyBudget).length;
    return underBudgetMonths / months.length;
};

/**
 * Generate net worth evolution data for chart
 */
export const generateNetWorthEvolution = (
    transactions: Array<{ transaction_date: string; amount: number; type: string }>,
    currentNetWorth: number,
    months: number = 6
): Array<{ name: string; assets: number; liabilities: number; net: number }> => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyBalances: Record<string, number> = {};

    // Calculate monthly balance changes
    transactions.forEach((tx) => {
        const monthKey = tx.transaction_date.substring(0, 7);
        if (!monthlyBalances[monthKey]) {
            monthlyBalances[monthKey] = 0;
        }

        if (tx.type === 'income' || tx.type === 'ingreso') {
            monthlyBalances[monthKey] += Number(tx.amount);
        } else if (tx.type === 'expense' || tx.type === 'gasto') {
            monthlyBalances[monthKey] -= Number(tx.amount);
        }
    });

    const sortedMonths = Object.keys(monthlyBalances).sort();
    const lastMonths = sortedMonths.slice(-months);

    let runningNetWorth = currentNetWorth;
    const result = [];

    // Work backwards from current month
    for (let i = lastMonths.length - 1; i >= 0; i--) {
        const monthKey = lastMonths[i];
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;

        result.unshift({
            name: monthNames[monthIndex],
            assets: runningNetWorth > 0 ? runningNetWorth * 0.9 : 0, // Estimate
            liabilities: runningNetWorth > 0 ? runningNetWorth * 0.1 : 0, // Estimate
            net: Math.round(runningNetWorth / 1000) / 1000, // In thousands
        });

        runningNetWorth -= monthlyBalances[monthKey];
    }

    return result;
};

/**
 * Generate savings accumulation data for chart
 */
export const generateSavingsAccumulation = (
    transactions: Array<{ transaction_date: string; amount: number; type: string }>,
    months: number = 6
): Array<{ name: string; monthly: number; accumulated: number }> => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach((tx) => {
        const monthKey = tx.transaction_date.substring(0, 7);
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }

        if (tx.type === 'income' || tx.type === 'ingreso') {
            monthlyData[monthKey].income += Number(tx.amount);
        } else if (tx.type === 'expense' || tx.type === 'gasto') {
            monthlyData[monthKey].expenses += Number(tx.amount);
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const lastMonths = sortedMonths.slice(-months);

    let accumulated = 0;
    return lastMonths.map((monthKey) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        const data = monthlyData[monthKey];
        const monthly = data.income - data.expenses;
        accumulated += monthly;

        return {
            name: monthNames[monthIndex],
            monthly: Math.round(monthly / 1000), // In thousands
            accumulated: Math.round(accumulated / 1000),
        };
    });
};

/**
 * Generate ratio benchmark data for chart
 */
export const generateRatioBenchmark = (
    financialRatios: FinancialRatioData
): Array<{ name: string; user: number; ideal: number; unit: string }> => {
    return [
        {
            name: 'Ahorro',
            user: Math.round(financialRatios.savingsRate),
            ideal: 20,
            unit: '%',
        },
        {
            name: 'Inversión',
            user: Math.round(financialRatios.investmentRate),
            ideal: 15,
            unit: '%',
        },
        {
            name: 'Deuda/Ing',
            user: Math.round(financialRatios.fixedCostOfLiving),
            ideal: 30,
            unit: '%',
        },
        {
            name: 'Cobertura',
            user: Math.min(Math.round(financialRatios.debtCoverage * 10) / 10, 10),
            ideal: 3,
            unit: 'x',
        },
    ];
};
