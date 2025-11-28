import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';

interface Insight {
    id: string;
    title: string;
    description: string;
    type: 'warning' | 'success' | 'info' | 'positivo' | 'negativo' | 'neutral' | 'consejo';
}

interface BalanceInsightsProps {
    insights: Insight[];
}

const BalanceInsights: React.FC<BalanceInsightsProps> = ({ insights }) => {
    if (!insights || insights.length === 0) return null;

    return (
        <div className="w-full mt-2">
            {/* Carousel */}
            <div className="flex w-full overflow-x-auto gap-4 pb-2 px-0.5 scrollbar-hide snap-x snap-mandatory">
                {insights.map((insight) => {
                    let bgClass = 'bg-blue-50 border-blue-100';
                    let iconClass = 'text-blue-600 bg-white/80';
                    let textClass = 'text-blue-900';
                    let Icon = Lightbulb;

                    const insightType = insight.type.toLowerCase();

                    if (insightType === 'warning' || insightType === 'negativo') {
                        bgClass = 'bg-red-50 border-red-100';
                        iconClass = 'text-red-500 bg-white/80';
                        textClass = 'text-red-900';
                        Icon = AlertTriangle;
                    } else if (insightType === 'success' || insightType === 'positivo') {
                        bgClass = 'bg-emerald-50 border-emerald-100';
                        iconClass = 'text-emerald-500 bg-white/80';
                        textClass = 'text-emerald-900';
                        Icon = CheckCircle;
                    }

                    return (
                        <div
                            key={insight.id}
                            className={`w-full flex-shrink-0 snap-center rounded-[1.25rem] border ${bgClass} p-4 flex items-center gap-4 shadow-sm`}
                        >
                            <div className={`p-2.5 rounded-xl ${iconClass} shadow-sm shrink-0`}>
                                <Icon className="w-5 h-5" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className={`font-bold text-sm ${textClass} leading-tight`}>{insight.title}</span>
                                <span className={`text-[11px] font-medium ${textClass} opacity-80`}>{insight.description}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BalanceInsights;
