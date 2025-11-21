import { useMemo } from 'react';

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';
export type TimePeriod = '1M' | '3M' | '6M' | '1A' | '5A';

interface SimulationParams {
  dailySavings: number;
  riskLevel: RiskLevel;
  timePeriod: TimePeriod;
  extraContributions?: { month: number; amount: number }[];
  events?: { month: number; amount: number; description: string }[];
}

interface SimulationResult {
  data: {
    month: string;
    savings: number;
    investment: number;
    total: number;
  }[];
  totalSaved: number;
  totalInvested: number;
  totalReturns: number;
  averageMonthlyGrowth: number;
  bestMonth: { month: string; growth: number };
}

const RISK_RATES = {
  conservative: { min: 0.04, max: 0.06, avg: 0.05 },
  moderate: { min: 0.07, max: 0.10, avg: 0.085 },
  aggressive: { min: 0.12, max: 0.18, avg: 0.15 },
};

const PERIOD_MONTHS = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1A': 12,
  '5A': 60,
};

export const useSavingsSimulation = ({
  dailySavings,
  riskLevel,
  timePeriod,
  extraContributions = [],
  events = [],
}: SimulationParams): SimulationResult => {
  return useMemo(() => {
    const months = PERIOD_MONTHS[timePeriod];
    const annualRate = RISK_RATES[riskLevel].avg;
    const monthlyRate = annualRate / 12;
    const dailyRate = annualRate / 365;

    const data = [];
    let cumulativeSavings = 0;
    let cumulativeInvestment = 0;
    let bestMonth = { month: '', growth: 0 };

    for (let month = 1; month <= months; month++) {
      const daysInMonth = 30;
      const monthlySavings = dailySavings * daysInMonth;
      
      // Add extra contributions
      const extraAmount = extraContributions.find(c => c.month === month)?.amount || 0;
      
      // Subtract events
      const eventAmount = events.find(e => e.month === month)?.amount || 0;
      
      const totalMonthlyContribution = monthlySavings + extraAmount - eventAmount;
      
      cumulativeSavings += totalMonthlyContribution;
      
      // Calculate compound investment
      cumulativeInvestment = (cumulativeInvestment + totalMonthlyContribution) * (1 + monthlyRate);
      
      const monthGrowth = cumulativeInvestment - cumulativeSavings;
      if (monthGrowth > bestMonth.growth) {
        bestMonth = { month: `Mes ${month}`, growth: monthGrowth };
      }

      data.push({
        month: month <= 12 ? `${month}M` : `${Math.floor(month / 12)}A ${month % 12}M`,
        savings: Math.round(cumulativeSavings),
        investment: Math.round(cumulativeInvestment),
        total: Math.round(cumulativeInvestment),
      });
    }

    const totalReturns = cumulativeInvestment - cumulativeSavings;
    const averageMonthlyGrowth = totalReturns / months;

    return {
      data,
      totalSaved: Math.round(cumulativeSavings),
      totalInvested: Math.round(cumulativeInvestment),
      totalReturns: Math.round(totalReturns),
      averageMonthlyGrowth: Math.round(averageMonthlyGrowth),
      bestMonth,
    };
  }, [dailySavings, riskLevel, timePeriod, extraContributions, events]);
};
