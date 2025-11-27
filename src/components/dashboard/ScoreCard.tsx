import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Banknote, CheckCircle2 } from 'lucide-react';

interface ScoreCardProps {
    score: number;
    userLevel?: number;
    totalBudget?: number;
    currentSpend?: number;
    budgetFrequency?: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({
    score,
    userLevel = 1,
    totalBudget = 0,
    currentSpend = 0,
    budgetFrequency = 'Mensual'
}) => {
    const navigate = useNavigate();

    // SVG Config for the circle
    const radius = 36;
    const stroke = 8;
    const circumference = 2 * Math.PI * radius;
    // Ensure score is between 0 and 100
    const safeScore = Math.min(100, Math.max(0, score || 0));
    const offset = circumference - (safeScore / 100) * circumference;

    const getScoreStatus = (s: number) => {
        if (s >= 80) return { label: "Excelente", color: "text-green-600", stroke: "#10b981" };
        if (s >= 60) return { label: "Bueno", color: "text-blue-600", stroke: "#3b82f6" };
        if (s >= 40) return { label: "Regular", color: "text-yellow-600", stroke: "#eab308" };
        return { label: "Mejorable", color: "text-red-600", stroke: "#ef4444" };
    };

    const status = getScoreStatus(safeScore);

    // Budget calculations
    const budgetProgress = totalBudget > 0 ? Math.min((currentSpend / totalBudget) * 100, 100) : 0;
    const remainingBudget = Math.max(0, totalBudget - currentSpend);
    const isOverBudget = currentSpend > totalBudget;

    return (
        <div className="w-full flex flex-col gap-4">
            {/* Main Card */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">

                <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-8 lg:gap-16">
                    {/* Left Side: Score & Level */}
                    <div className="flex flex-col gap-4 z-10 min-w-fit">
                        {/* Score Section */}
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/score-moni')}>
                            <div className="relative flex items-center justify-center drop-shadow-md">
                                <svg className="transform -rotate-90 w-24 h-24">
                                    {/* Track */}
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r={radius}
                                        stroke="#f3f4f6"
                                        strokeWidth={stroke}
                                        fill="transparent"
                                    />
                                    {/* Progress */}
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r={radius}
                                        stroke={status.stroke}
                                        strokeWidth={stroke}
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-extrabold text-gray-800 leading-none">{safeScore}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[12px] font-bold text-gray-400 uppercase tracking-normal">Score Moni</span>
                                    <span className={`text-[12px] font-bold ${status.color} uppercase tracking-normal`}>{status.label}</span>
                                </div>

                                {/* Level Section - Moved here */}
                                <div
                                    className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 w-fit cursor-pointer hover:bg-yellow-100 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate('/financial-journey');
                                    }}
                                >
                                    <div className="bg-yellow-100 p-0.5 rounded-full">
                                        <Trophy size={12} className="text-yellow-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wide leading-none">Nivel {userLevel}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Budget Section (Integrated) */}
                    <div className="flex-1 w-full sm:w-1/2 lg:w-1/3 bg-gray-50 rounded-2xl p-4 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => navigate('/budgets')}>
                        <div className="flex items-center gap-2 mb-2">
                            <Banknote className="text-[#8D6E63]" size={16} strokeWidth={2.5} />
                            <h3 className="text-gray-800 font-bold text-[11px] sm:text-xs tracking-tight whitespace-nowrap">Presupuesto {budgetFrequency}</h3>
                        </div>

                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] text-gray-500 font-medium">Gastado</span>
                            <span className="text-xs font-bold text-gray-800">${currentSpend.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-gray-200 rounded-full mb-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                                style={{ width: `${budgetProgress}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center gap-1">
                            {isOverBudget ? (
                                <span className="text-[9px] font-bold text-red-500">Excedido por ${Math.abs(remainingBudget).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                    <span className="text-[9px] font-bold text-emerald-600">Quedan ${remainingBudget.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreCard;
