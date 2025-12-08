import { useEffect, useState } from 'react';
import { CheckCircle2, Droplets } from 'lucide-react';

interface EmergencyFundCardProps {
    liquidAssets: number;
    monthlyExpenses: number;
    monthsCoverage: number;
}

export const EmergencyFundCard = ({
    liquidAssets,
    monthlyExpenses,
    monthsCoverage
}: EmergencyFundCardProps) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 300);
        return () => clearTimeout(timer);
    }, []);

    // Gauge Configuration - Micro Size
    const width = 100;
    const height = 50;
    const radius = 42;
    const cx = width / 2;
    const cy = height;
    const strokeWidth = 6;

    const trackPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
    const arcLength = Math.PI * radius;
    const maxValue = 12;
    const percentage = Math.min(monthsCoverage / maxValue, 1);
    const strokeDashoffset = animate ? arcLength * (1 - percentage) : arcLength;

    // Determine status
    const status = monthsCoverage >= 6 ? 'Saludable' : monthsCoverage >= 3 ? 'Aceptable' : 'Bajo';
    const statusColor = monthsCoverage >= 6
        ? { bg: 'bg-[#ecfccb]', text: 'text-[#3f6212]', icon: 'text-[#65a30d]' }
        : monthsCoverage >= 3
            ? { bg: 'bg-[#fef08a]', text: 'text-[#854d0e]', icon: 'text-[#ca8a04]' }
            : { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]', icon: 'text-[#dc2626]' };

    return (
        <div className="bg-white rounded-2xl p-3 shadow-sm border-b-4 border-stone-100">

            {/* Compact Header */}
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-[#292524] text-xs tracking-tight flex items-center gap-1.5">
                    <Droplets className="text-[#A8A29E]" size={12} fill="currentColor" fillOpacity={0.1} />
                    Liquidez de Emergencia
                </h3>
                <div className={`flex items-center gap-1 ${statusColor.bg} px-1.5 py-0.5 rounded-full`}>
                    <CheckCircle2 size={8} className={statusColor.icon} strokeWidth={3} />
                    <span className={`text-[8px] font-extrabold ${statusColor.text} uppercase tracking-wide`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Content Row: Gauge Left | Stats Right */}
            <div className="flex items-end gap-3">

                {/* Left: Gauge & Main Number */}
                <div className="relative flex flex-col items-center justify-end h-[55px] mb-1">
                    <svg width={width} height={height + 3} className="overflow-visible">
                        <defs>
                            <linearGradient id="gaugeGradientSmall" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                        </defs>
                        <path d={trackPath} fill="none" stroke="#E7E5E4" strokeWidth={strokeWidth} strokeLinecap="round" />
                        <path
                            d={trackPath}
                            fill="none"
                            stroke="url(#gaugeGradientSmall)"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={arcLength}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-[1500ms] cubic-bezier(0.34, 1.56, 0.64, 1)"
                        />
                    </svg>
                    <div className="absolute bottom-0 flex flex-col items-center">
                        <span className="text-xl font-black text-[#292524] leading-none tracking-tight">
                            {monthsCoverage.toFixed(1)}
                        </span>
                        <span className="text-[8px] font-bold text-[#A8A29E] uppercase tracking-wide">meses</span>
                    </div>
                </div>

                {/* Right: Compact Metric Boxes Stacked */}
                <div className="flex-1 flex flex-col gap-1.5 w-full">
                    {/* Liquidity */}
                    <div className="bg-[#FAFAF9] rounded-lg px-2 py-1.5 border border-[#E7E5E4] flex justify-between items-center">
                        <span className="text-[#78716C] text-[8px] font-bold uppercase">Liquidez</span>
                        <span className="text-[#292524] font-extrabold text-xs">
                            ${(liquidAssets / 1000).toFixed(1)}k
                        </span>
                    </div>

                    {/* Expense */}
                    <div className="bg-[#FFF7ED] rounded-lg px-2 py-1.5 border border-[#FFEDD5] flex justify-between items-center">
                        <span className="text-[#C2410C] text-[8px] font-bold uppercase">Gasto</span>
                        <span className="text-[#7C2D12] font-extrabold text-xs">
                            ${(monthlyExpenses / 1000).toFixed(1)}k
                        </span>
                    </div>
                </div>

            </div>

            {/* Footer message */}
            <p className="text-[#A8A29E] text-[9px] font-medium text-center mt-2 border-t border-stone-50 pt-1">
                {monthsCoverage >= 6 ? (
                    <>Fondo saludable <span className="text-[#166534] opacity-80">(meta: 3-6m)</span></>
                ) : monthsCoverage >= 3 ? (
                    <>En camino <span className="text-[#854d0e] opacity-80">(meta: 6m)</span></>
                ) : (
                    <>Construye tu fondo <span className="text-[#991b1b] opacity-80">(meta: 6m)</span></>
                )}
            </p>

        </div>
    );
};
