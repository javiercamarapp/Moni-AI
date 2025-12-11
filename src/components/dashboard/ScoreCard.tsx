import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ScoreCardProps {
    score: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
    const navigate = useNavigate();

    // SVG Config for the circle - use percentage for responsive sizing
    const radiusPercent = 42; // 35% of SVG viewBox (reduced from 50%)
    const strokePercent = 6; // 6% of SVG viewBox (reduced from 8%)
    const circumference = 2 * Math.PI * radiusPercent;
    // Ensure score is between 0 and 100
    const safeScore = Math.min(100, Math.max(0, score || 0));
    const offset = circumference - (safeScore / 100) * circumference;

    const getScoreStatus = (s: number) => {
        if (s >= 80) return { label: "EXCELENTE", color: "text-green-600", bgColor: "bg-green-50", stroke: "#10b981" };
        if (s >= 60) return { label: "BUENO", color: "text-blue-600", bgColor: "bg-blue-50", stroke: "#3b82f6" };
        if (s >= 40) return { label: "REGULAR", color: "text-yellow-600", bgColor: "bg-yellow-50", stroke: "#eab308" };
        return { label: "MEJORABLE", color: "text-red-600", bgColor: "bg-red-50", stroke: "#ef4444" };
    };

    const status = getScoreStatus(safeScore);

    return (
        <div
            className="bg-white rounded-[1.5rem] px-2 sm:px-5 py-2 sm:py-1 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08)] border border-white cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200"
            onClick={() => navigate('/score-moni')}
        >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2">
                {/* Left Side: Text Info */}
                <div className="flex flex-col gap-1 items-center sm:items-start">
                    <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Moni</span>
                    <span className={`text-[9px] sm:text-[11px] font-bold ${status.color} uppercase tracking-wider px-2 py-0.5 sm:px-2.5 sm:py-1 ${status.bgColor} rounded-full w-fit`}>
                        {status.label}
                    </span>
                </div>

                {/* Right Side: Circle with Score Inside */}
                <div className="relative flex items-center justify-center flex-shrink-0 overflow-visible">
                    <svg className="transform -rotate-90 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 overflow-visible" viewBox="0 0 100 100">
                        {/* Track */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radiusPercent}
                            stroke="#f3f4f6"
                            strokeWidth={strokePercent}
                            fill="transparent"
                        />
                        {/* Progress */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radiusPercent}
                            stroke={status.stroke}
                            strokeWidth={strokePercent}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                        />
                    </svg>
                    {/* Score Number Inside Circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base sm:text-base md:text-lg font-black text-gray-800 leading-none">{safeScore}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreCard;