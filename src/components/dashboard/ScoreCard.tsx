import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ScoreCardProps {
    score: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
    const navigate = useNavigate();

    // SVG Config for the circle
    const radius = 28;
    const stroke = 6;
    const circumference = 2 * Math.PI * radius;
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
            className="bg-white rounded-[1.5rem] px-5 py-1 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.08)] border border-white cursor-pointer hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200"
            onClick={() => navigate('/score-moni')}
        >
            <div className="flex items-center justify-between">
                {/* Left Side: Text Info */}
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score Moni</span>
                    <span className={`text-[11px] font-bold ${status.color} uppercase tracking-wider px-2.5 py-1 ${status.bgColor} rounded-full w-fit`}>
                        {status.label}
                    </span>
                </div>

                {/* Right Side: Circle with Score Inside */}
                <div className="relative flex items-center justify-center">
                    <svg className="transform -rotate-90 w-20 h-20">
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
                    {/* Score Number Inside Circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-gray-800 leading-none">{safeScore}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreCard;