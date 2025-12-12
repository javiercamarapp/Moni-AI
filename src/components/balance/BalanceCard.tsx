import React, { useState } from 'react';
import { Download, Info, X } from 'lucide-react';

interface BalanceCardProps {
    amount: number;
    rate: number;
    label?: string;
    statusLabel?: string;
    onDownloadPDF?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
    amount,
    rate,
    label = 'Ahorro Mensual',
    statusLabel = 'EXCELENTE',
    onDownloadPDF
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Config for a compact circle
    const size = 80;
    const center = size / 2;
    const strokeWidth = 6;
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (rate / 100) * circumference;

    // Determine period for button text
    const periodText = label.toLowerCase().includes('anual') ? 'del año' : 'del mes';

    // Helper for dynamic badge styling
    const getStatusStyle = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'excelente') return 'bg-emerald-100 text-emerald-600';
        if (s === 'negativo') return 'bg-red-100 text-red-600';
        if (s === 'medio') return 'bg-yellow-100 text-yellow-700';
        if (s.includes('medio malo')) return 'bg-orange-100 text-orange-700';
        return 'bg-emerald-100 text-emerald-600';
    };

    const statusStyle = getStatusStyle(statusLabel);

    return (
        <div className="bg-white rounded-[2rem] p-4 shadow-sm relative border border-white/50 flex flex-col gap-3">
            {/* Tooltip Popup */}
            {showTooltip && (
                <div className="absolute top-16 right-4 z-20 w-56 bg-white shadow-xl rounded-xl p-4 border border-gray-100 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-[#5D4037] text-xs">Tasa de Ahorro</h3>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                            className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1 p-1"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mb-3 leading-relaxed">
                        Porcentaje de tus ingresos que logras ahorrar en este periodo.
                    </p>

                    {/* Formula Display */}
                    <div className="bg-gradient-to-br from-[#F5F0EE] to-[#EBE5E2] p-3 rounded-lg border border-[#8D6E63]/20">
                        <div className="flex items-center justify-center gap-2">
                            {/* Fraction */}
                            <div className="flex flex-col items-center">
                                {/* Numerator */}
                                <div className="text-center">
                                    <span className="text-[10px] font-semibold text-[#5D4037]">Ingresos - Gastos</span>
                                </div>
                                {/* Divider */}
                                <div className="w-[80%] h-[1.5px] bg-[#8D6E63]"></div>
                                {/* Denominator */}
                                <div className="text-center">
                                    <span className="text-[10px] font-semibold text-[#5D4037]">Ingresos</span>
                                </div>
                            </div>

                            {/* Calculation */}
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] text-gray-500">×</span>
                                <span className="text-[10px] font-bold text-[#8D6E63]">100</span>
                                <span className="text-[9px] text-gray-500">=</span>
                                <span className="text-[11px] font-black text-[#5D4037]">{Math.round(rate)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Section: Info + Chart */}
            <div className="flex justify-between items-center">
                {/* Left Content */}
                <div className="flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-[10px] font-bold tracking-widest uppercase">{label}</span>
                        <span className={`${statusStyle} text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase`}>
                            {statusLabel}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-0.5 -mt-0.5">
                        <span className="text-[26px] font-black text-[#5D4037] tracking-tighter leading-none">
                            ${Math.floor(amount).toLocaleString('en-US')}
                        </span>
                        <span className="text-gray-500 text-xs font-bold opacity-60">.{(amount % 1).toFixed(2).split('.')[1]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8D6E63]"></div>
                        <span className="text-[10px] font-medium text-gray-500">Disponible en cuenta</span>
                    </div>
                </div>

                {/* Right Visual: Circular Progress */}
                <div className="relative flex items-center justify-center shrink-0">
                    <button
                        onClick={() => setShowTooltip(!showTooltip)}
                        className="relative outline-none transition-transform active:scale-95 group"
                        aria-label="Ver detalles de tasa de ahorro"
                    >
                        <svg
                            width={size}
                            height={size}
                            className="transform -rotate-90"
                        >
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke="#F5F0EE"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            {/* Progress Circle */}
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke="#8D6E63"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        {/* Centered Percentage */}
                        <div className="absolute inset-0 flex items-center justify-center pt-0.5">
                            <span className="text-sm font-bold text-[#5D4037] tracking-tight">{Math.round(rate)}%</span>
                        </div>

                        {/* Info Hint Icon */}
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Info className="w-2.5 h-2.5 text-gray-500" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Bottom Section: Download Button */}
            <button
                onClick={onDownloadPDF}
                className="w-full py-2 rounded-xl bg-[#F5F0EE] border border-[#EBE5E2] flex items-center justify-center gap-1.5 text-[#5D4037] hover:bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 group"
            >
                <Download className="w-3.5 h-3.5 text-[#8D6E63] group-hover:text-[#5D4037]" strokeWidth={2} />
                <span className="text-[10px] font-bold text-[#5D4037]/90">Descargar en PDF</span>
            </button>
        </div>
    );
};

export default BalanceCard;
