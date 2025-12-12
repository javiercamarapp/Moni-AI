import React from 'react';

export interface FinancialStat {
  label: string;
  value: string;
  icon: React.ElementType;
}

export interface ScoreComponent {
  id: string;
  name: string;
  title?: string;
  score: number;
  maxScore: number;
  description: string;
  color: string;
  trend?: string;
  icon?: string;
  IconComponent?: React.ElementType;
  details?: {
    whyImproved: string[];
    howToImprove: string[];
  };
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
}

export interface CardInfo {
  type: string;
  number: string;
  status: string;
  balance: string;
  theme: 'dark' | 'light';
}
