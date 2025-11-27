import { BarChart3, TrendingUp, Target, CreditCard } from 'lucide-react';
import { FinancialStat, ScoreComponent, CardInfo } from './types';

export const DASHBOARD_STATS: FinancialStat[] = [
  { label: 'RESUMEN', value: '$86k', icon: BarChart3 },
  { label: 'PATRIMONIO', value: '$13.5M', icon: TrendingUp },
  { label: 'METAS', value: '3', icon: Target },
  { label: 'PRESUPUESTO', value: '$53k', icon: CreditCard },
];

// Reordered to match visual clockwise distribution: Ahorro (Top) -> Deuda (Right) -> Control (Bottom Right) -> Crecimiento (Bottom Left) -> Hábitos (Left)
// Note: Recharts plots CCW, so we provide data in CCW order to achieve the desired Visual positions:
// Ahorro (Top), Hábitos (Left), Crecimiento (Bottom Left), Control (Bottom Right), Deuda (Right).
export const RADAR_DATA = [
  { subject: 'Ahorro', A: 100, fullMark: 100 },
  { subject: 'Hábitos', A: 85, fullMark: 100 },
  { subject: 'Crecimiento', A: 70, fullMark: 100 },
  { subject: 'Control', A: 40, fullMark: 100 },
  { subject: 'Deuda', A: 60, fullMark: 100 },
];

export const SCORE_COMPONENTS: ScoreComponent[] = [
  {
    id: '1',
    name: 'Ahorro',
    title: 'Ahorro y Liquidez',
    score: 30,
    maxScore: 30,
    description: 'Ahorro y Liquidez (30 pts): Se evalúa tu tasa de ahorro mensual (% de ingreso que ahorras).',
    color: 'bg-emerald-500',
    icon: '💰',
    trend: '+20 pts',
    details: {
      whyImproved: [
        'Aumentaste tu tasa de ahorro mensual',
        'Redujiste gastos innecesarios',
        'Fortaleciste tu fondo de emergencia'
      ],
      howToImprove: [
        'Establece una meta de ahorro del 20% de tus ingresos',
        'Automatiza transferencias a tu cuenta de ahorro',
        'Mantén 3-6 meses de gastos en tu fondo de emergencia'
      ]
    }
  },
  {
    id: '2',
    name: 'Deuda',
    title: 'Nivel de Endeudamiento',
    score: 16,
    maxScore: 25,
    description: 'Nivel de endeudamiento y capacidad de pago mensual.',
    color: 'bg-blue-500',
    icon: '💳',
    trend: '+5 pts',
    details: {
      whyImproved: [
        'Pagaste a tiempo tu tarjeta de crédito',
        'No solicitaste nuevos créditos'
      ],
      howToImprove: [
        'Trata de pagar más del mínimo',
        'Reduce el uso de tarjetas de crédito al 30% del límite'
      ]
    }
  },
  {
    id: '3',
    name: 'Hábitos',
    title: 'Hábitos Financieros',
    score: 18,
    maxScore: 20,
    description: 'Consistencia en el registro de gastos y cumplimiento de presupuesto.',
    color: 'bg-purple-500',
    icon: '📅',
    trend: '+2 pts',
    details: {
      whyImproved: [
        'Registraste todos tus gastos esta semana',
        'Revisaste tu presupuesto diario'
      ],
      howToImprove: [
        'Categoriza mejor tus gastos hormiga',
        'Establece recordatorios para pagar servicios'
      ]
    }
  },
  {
    id: '4',
    name: 'Control',
    title: 'Control de Gastos',
    score: 12,
    maxScore: 15,
    description: 'Capacidad para mantenerse dentro del presupuesto asignado y evitar gastos impulsivos.',
    color: 'bg-orange-500',
    icon: '⚖️',
    trend: '+3 pts',
    details: {
      whyImproved: [
        'No excediste tu presupuesto de entretenimiento',
        'Identificaste y redujiste gastos fugas'
      ],
      howToImprove: [
        'Revisa tus suscripciones mensuales',
        'Planea tus compras grandes con anticipación'
      ]
    }
  },
  {
    id: '5',
    name: 'Crecimiento',
    title: 'Crecimiento Patrimonial',
    score: 8,
    maxScore: 10,
    description: 'Evolución positiva de tu patrimonio neto a través de activos e inversiones.',
    color: 'bg-pink-500',
    icon: '🚀',
    trend: '+1 pts',
    details: {
      whyImproved: [
        'Tu cuenta de inversión creció un 2%',
        'Aumentaste el valor de tus activos'
      ],
      howToImprove: [
        'Comienza a invertir en instrumentos de bajo riesgo',
        'Reinvierte tus rendimientos para interés compuesto'
      ]
    }
  }
];

export const MY_CARD: CardInfo = {
  type: 'Mastercard',
  number: '8842',
  status: 'Al corriente',
  balance: '$4,250.00',
  theme: 'dark'
};
