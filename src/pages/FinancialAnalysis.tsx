
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Share, Loader2, Table, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";
import BottomNav from "@/components/BottomNav";
import { useDashboardData } from "@/hooks/useDashboardData";
import { BalanceSummaryCard } from "@/components/analysis/BalanceSummaryCard";
import { FinancialRatiosCarousel } from "@/components/analysis/FinancialRatiosCarousel";
import { EmergencyFundCard } from "@/components/analysis/EmergencyFundCard";
import { DebtListCard } from "@/components/analysis/DebtListCard";
import { ExpenseControlCarousel } from "@/components/analysis/ExpenseControlCarousel";
import { FinancialChartsCarousel } from "@/components/analysis/FinancialChartsCarousel";
import { AdvancedMetricsGrid } from "@/components/analysis/AdvancedMetricsGrid";
import { ProjectionsSection } from "@/components/analysis/ProjectionsSection";
import { LifestyleRadarChart } from "@/components/analysis/LifestyleRadarChart";
import {
  calculateFinancialRatios,
  categorizeExpenses,
  calculateEmergencyFund,
  aggregateDebts,
  generateHistoricalChartData,
  calculateAvgMonthlySavings,
  findTopExpensePerCategory,
  calculateLifestyleRadar,
  calculateLifestyleScore,
  calculateBudgetAdherence,
  generateNetWorthEvolution,
  generateSavingsAccumulation,
  generateRatioBenchmark,
} from "@/utils/analysisDataMappers";

export default function FinancialAnalysis() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const dashboardData = useDashboardData(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load transactions from last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      setTransactions(txData || []);

      // Load liabilities (pasivos) as debts
      const { data: pasivosData } = await supabase
        .from('pasivos')
        .select('*')
        .eq('user_id', user.id);

      setDebts(pasivosData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting('csv');
    await new Promise(resolve => setTimeout(resolve, 800));

    const csvData = [
      ['Reporte Financiero Moni', new Date().toLocaleDateString()],
      [''],
      ['Concepto', 'Valor'],
      ['Ingresos Mensuales', dashboardData.monthlyIncome],
      ['Gastos Mensuales', dashboardData.monthlyExpenses],
      ['Balance Disponible', dashboardData.monthlyIncome - dashboardData.monthlyExpenses],
      ['Score', dashboardData.scoreMoni],
    ];

    const csvContent = csvData.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `moni_finanzas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(null);
    setShowExportMenu(false);
  };

  const handleExportPDF = async () => {
    setIsExporting('pdf');
    await new Promise(resolve => setTimeout(resolve, 800));

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(41, 37, 36);
    doc.text("Moni Finance", 20, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108);
    doc.text("Reporte Mensual de Finanzas Personales", 20, 32);
    doc.text(`Generado el: ${new Date().toLocaleDateString()} `, 190, 25, { align: "right" });

    doc.setDrawColor(231, 229, 228);
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    let y = 55;
    const addRow = (label: string, value: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(28, 25, 23);
      doc.text(label, 20, y);
      doc.text(value, 190, y, { align: "right" });
      y += 12;
    };

    addRow("Ingresos Mensuales", `$${dashboardData.monthlyIncome.toLocaleString()} `);
    addRow("Gastos Mensuales", `$${dashboardData.monthlyExpenses.toLocaleString()} `);
    addRow("Balance", `$${(dashboardData.monthlyIncome - dashboardData.monthlyExpenses).toLocaleString()} `);
    addRow("Score Moni", `${dashboardData.scoreMoni} `);

    doc.setFontSize(8);
    doc.setTextColor(168, 162, 158);
    doc.text("Este documento es generado automáticamente por Moni Finance.", 105, 280, { align: "center" });

    doc.save(`moni_reporte_${new Date().toISOString().split('T')[0]}.pdf`);

    setIsExporting(null);
    setShowExportMenu(false);
  };

  // Calculate derived data
  const balance = dashboardData.monthlyIncome - dashboardData.monthlyExpenses;

  const financialRatios = calculateFinancialRatios({
    monthlyIncome: dashboardData.monthlyIncome,
    monthlyExpenses: dashboardData.monthlyExpenses,
    fixedExpenses: dashboardData.fixedExpenses,
    netWorth: dashboardData.netWorth,
    totalDebt: debts.reduce((sum, d) => sum + (Number(d.current_balance) || 0), 0),
    monthlyDebtPayment: 0, // TODO: Calculate from transactions
    totalInvestments: 0, // TODO: Query investments table
  });

  const expenseCategories = categorizeExpenses(
    transactions,
    dashboardData.fixedExpenses
  );

  const emergencyFund = calculateEmergencyFund(
    balance > 0 ? balance * 3 : 0, // Simple estimate: 3x monthly savings
    dashboardData.monthlyExpenses
  );

  const debtSummary = aggregateDebts(
    debts.filter(d => d.credit_limit !== undefined), // Credit cards have credit_limit
    debts.filter(d => d.original_amount !== undefined) // Loans have original_amount
  );

  const historicalChartData = generateHistoricalChartData(transactions, 6);

  // Count transactions by category
  const expenseTransactions = transactions.filter(t => t.type === 'expense' || t.type === 'gasto');
  const fixedCount = Math.floor(expenseTransactions.length * 0.3);
  const variableCount = Math.floor(expenseTransactions.length * 0.4);
  const antCount = expenseTransactions.filter(t => Number(t.amount) < 50).length;
  const impulsiveCount = expenseTransactions.filter(t => Number(t.amount) > 500).length;

  // Calculate average monthly savings for projections
  const avgMonthlySavings = calculateAvgMonthlySavings(transactions, 6);

  // Find top expense per category
  const topExpenses = {
    fixed: findTopExpensePerCategory(transactions as any, 'fixed'),
    variable: findTopExpensePerCategory(transactions as any, 'variable'),
    ant: findTopExpensePerCategory(transactions as any, 'ant'),
    impulsive: findTopExpensePerCategory(transactions as any, 'impulsive'),
  };

  // Calculate lifestyle radar data
  const debtToIncomeRatio = dashboardData.monthlyIncome > 0
    ? (debtSummary.totalDebt / 12) / dashboardData.monthlyIncome
    : 0;

  const budgetAdherence = calculateBudgetAdherence(
    transactions as any,
    dashboardData.monthlyIncome || 50000 // Use income as budget if no explicit budget
  );

  const lifestyleRadarData = calculateLifestyleRadar({
    savingsRate: financialRatios.savingsRate,
    debtToIncome: debtToIncomeRatio,
    investmentRate: financialRatios.investmentRate,
    budgetAdherence,
    emergencyMonths: emergencyFund.monthsCoverage,
  });

  const lifestyleScore = calculateLifestyleScore(lifestyleRadarData);

  // Generate additional chart data
  const netWorthEvolution = generateNetWorthEvolution(transactions, dashboardData.netWorth, 6);
  const savingsAccumulationData = generateSavingsAccumulation(transactions, 6);
  const ratioBenchmarkData = generateRatioBenchmark(financialRatios);

  // Expense breakdown for pie chart
  const expenseBreakdownData = {
    fixed: expenseCategories.fixed,
    variable: expenseCategories.variable,
    savings: balance > 0 ? balance : 0,
  };

  if (loading || dashboardData.isLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8D6E63]" />
      </div>
    );
  }

  return (
    <div className="page-standard min-h-screen pb-20">
      <div className="page-container">

        {/* Header */}
        <div className="sticky top-0 z-20 bg-transparent backdrop-blur-sm py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#5D4037] tracking-tight">
              Análisis de tus finanzas
            </h1>
            <p className="text-[#78716C] font-bold text-xs mt-1">
              Entiende tus finanzas con ayuda de la AI
            </p>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting !== null}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-md border transition-all duration-200 active:scale-95 ${
                showExportMenu || isExporting
                  ? 'bg-[#292524] text-white border-[#292524]'
                  : 'bg-white text-[#57534E] border-stone-200 hover:bg-[#F5F5F4] hover:text-[#292524] hover:shadow-lg'
              }`}
              aria-label="Opciones de exportación"
            >
              {isExporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} strokeWidth={2} />
              )}
              <span className="hidden sm:inline text-sm font-semibold">Exportar</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-stone-100 p-1.5 min-w-[170px] z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <p className="px-3 py-1.5 text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider">Exportar reporte</p>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F5F5F4] rounded-xl text-sm font-bold text-[#57534E] transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Table size={16} className="text-[#78716C] group-hover:text-[#292524] transition-colors" />
                    <span>CSV</span>
                  </div>
                  {isExporting === 'csv' && <Loader2 size={14} className="animate-spin text-[#292524]" />}
                </button>
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#F5F5F4] rounded-xl text-sm font-bold text-[#57534E] transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-[#78716C] group-hover:text-[#292524] transition-colors" />
                    <span>PDF</span>
                  </div>
                  {isExporting === 'pdf' && <Loader2 size={14} className="animate-spin text-[#292524]" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 mt-6">

          {/* Balance Summary */}
          <BalanceSummaryCard
            monthlyIncome={dashboardData.monthlyIncome}
            monthlyExpenses={dashboardData.monthlyExpenses}
            availableBalance={balance}
          />

          {/* Financial Ratios Carousel */}
          <FinancialRatiosCarousel
            investmentRate={financialRatios.investmentRate}
            savingsRate={financialRatios.savingsRate}
            stability={financialRatios.stability}
            debtCoverage={financialRatios.debtCoverage}
            moneyAge={financialRatios.moneyAge}
            fixedCostOfLiving={financialRatios.fixedCostOfLiving}
          />

          {/* Emergency Fund Card */}
          <EmergencyFundCard
            liquidAssets={emergencyFund.liquidAssets}
            monthlyExpenses={emergencyFund.monthlyExpenses}
            monthsCoverage={emergencyFund.monthsCoverage}
          />

          {/* Debt List (Endeudamiento) */}
          <DebtListCard
            debts={debtSummary.items}
            totalDebt={debtSummary.totalDebt}
          />

          {/* Expense Control Carousel */}
          <ExpenseControlCarousel
            fixed={expenseCategories.fixed}
            variable={expenseCategories.variable}
            ant={expenseCategories.ant}
            impulsive={expenseCategories.impulsive}
            totalExpenses={dashboardData.monthlyExpenses}
            fixedCount={fixedCount}
            variableCount={variableCount}
            antCount={antCount}
            impulsiveCount={impulsiveCount}
            topExpenses={topExpenses}
          />

          {/* Financial Charts Carousel */}
          <FinancialChartsCarousel
            historicalData={historicalChartData}
            expenseBreakdown={expenseBreakdownData}
            netWorthData={netWorthEvolution}
            savingsAccumulation={savingsAccumulationData}
            financialRatios={ratioBenchmarkData}
          />

          {/* Advanced Metrics Grid - Independencia y Patrimonio */}
          <AdvancedMetricsGrid filterCategory="Independencia y Patrimonio" />

          {/* Projections Section */}
          <ProjectionsSection
            currentBalance={dashboardData.netWorth}
            avgMonthlySavings={avgMonthlySavings}
          />

          {/* Advanced Metrics Grid - Desempeño de Inversiones */}
          <AdvancedMetricsGrid filterCategory="Desempeño de Inversiones" />

          {/* Lifestyle Radar Chart */}
          <LifestyleRadarChart
            radarData={lifestyleRadarData}
            overallScore={lifestyleScore}
          />

          {/* Advanced Metrics Grid - Hábitos y Estilo de Vida */}
          <AdvancedMetricsGrid filterCategory="Hábitos y Estilo de Vida" />

        </div>
      </div>

      <BottomNav />
    </div>
  );
}