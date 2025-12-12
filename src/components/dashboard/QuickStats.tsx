import React from 'react';
import { BarChart3, TrendingUp, Target, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface QuickStatsProps {
  summaryValue?: string;
  netWorthValue?: string;
  goalsCount?: number;
  journeyLevel?: number;
}
const QuickStats: React.FC<QuickStatsProps> = ({
  summaryValue = "$0",
  netWorthValue = "$0",
  goalsCount = 0,
  journeyLevel = 0
}) => {
  const navigate = useNavigate();

  // Format journey level with K for thousands
  const formatJourneyLevel = (level: number) => {
    if (level >= 1000) {
      return `Nv.${(level / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return `Nv.${level}`;
  };
  const stats = [{
    id: '1',
    label: 'GASTOS/INGRESOS',
    value: summaryValue,
    icon: 'chart',
    route: '/balance'
  }, {
    id: '2',
    label: 'PATRIMONIO',
    value: netWorthValue,
    icon: 'trend',
    route: '/net-worth'
  }, {
    id: '3',
    label: 'METAS',
    value: goalsCount.toString(),
    icon: 'target',
    route: '/goals'
  }, {
    id: '4',
    label: 'JOURNEY',
    value: formatJourneyLevel(journeyLevel),
    icon: 'rocket',
    route: '/financial-journey'
  }];
  const getIcon = (type: string) => {
    const cls = "text-[#8D6E63]";
    const size = 20;
    const strokeWidth = 2;
    switch (type) {
      case 'chart':
        return <BarChart3 size={size} strokeWidth={strokeWidth} className={cls} />;
      case 'trend':
        return <TrendingUp size={size} strokeWidth={strokeWidth} className={cls} />;
      case 'target':
        return <Target size={size} strokeWidth={strokeWidth} className={cls} />;
      case 'rocket':
        return <Rocket size={size} strokeWidth={strokeWidth} className={cls} />;
      default:
        return <BarChart3 size={size} strokeWidth={strokeWidth} className={cls} />;
    }
  };
  return (
    <div className="px-6 mb-4">
      <div className="grid grid-cols-4 gap-2 lg:gap-4">
        {stats.map(stat => (
          <button
            key={stat.id}
            onClick={() => navigate(stat.route)}
            className="flex flex-col items-center justify-center bg-card rounded-2xl p-3 shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="mb-1">{getIcon(stat.icon)}</div>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wide">{stat.label}</span>
            <span className="text-sm font-bold text-foreground">{stat.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default QuickStats;