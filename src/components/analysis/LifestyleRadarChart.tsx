
import React from 'react';
import {
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Tooltip
} from 'recharts';
import { Target, Zap, ShieldCheck } from 'lucide-react';

// --- Data ---

const DATA_LIFESTYLE = [
    { subject: 'Ahorro', A: 90, B: 80, fullMark: 100 },
    { subject: 'Disciplina', A: 85, B: 90, fullMark: 100 },
    { subject: 'Deuda', A: 95, B: 100, fullMark: 100 },
    { subject: 'Inversión', A: 60, B: 85, fullMark: 100 }, // Gap here
    { subject: 'Control', A: 80, B: 90, fullMark: 100 },
    { subject: 'Previsión', A: 70, B: 95, fullMark: 100 }, // Gap here
];

// --- Sub Components ---

export const LifestyleRadarChart = ({
    radarData,
    overallScore
}: {
    radarData: Array<{ subject: string; A: number; B: number; fullMark: number }>;
    overallScore: number;
}) => {
    return (
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border-b-4 border-stone-100 relative overflow-hidden mb-6">
            <div className="flex justify-between items-start mb-2 z-10 relative">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 rounded-lg">
                        <Target size={16} className="text-[#f97316]" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-[#292524] text-sm tracking-tight">Rueda de Vida Financiera</h3>
                        <p className="text-[9px] font-bold text-[#A8A29E] uppercase tracking-wide">Actual vs Ideal</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-[#292524] leading-none">{overallScore}/100</div>
                    <div className="text-[9px] font-bold text-[#A8A29E]">Score Global</div>
                </div>
            </div>

            <div className="h-64 w-full -ml-2 relative z-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#E7E5E4" strokeDasharray="3 3" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#78716C', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                        {/* Ideal Benchmark */}
                        <Radar
                            name="Ideal"
                            dataKey="B"
                            stroke="#E7E5E4"
                            strokeWidth={2}
                            fill="#E7E5E4"
                            fillOpacity={0.3}
                            strokeDasharray="4 4"
                        />

                        {/* User Stats */}
                        <Radar
                            name="Tú"
                            dataKey="A"
                            stroke="#f97316"
                            strokeWidth={3}
                            fill="#f97316"
                            fillOpacity={0.5}
                        />

                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const userVal = payload.find(p => p.name === 'Tú')?.value;
                                    const idealVal = payload.find(p => p.name === 'Ideal')?.value;
                                    const diff = Number(idealVal) - Number(userVal);

                                    return (
                                        <div className="bg-[#292524] px-3 py-2 rounded-lg text-white shadow-lg">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">{payload[0].payload.subject}</p>
                                            <div className="flex gap-3 text-xs">
                                                <span>Tú: <span className="font-bold text-[#f97316]">{userVal}</span></span>
                                                <span className="text-stone-400">|</span>
                                                <span className="text-stone-300">Meta: {idealVal}</span>
                                            </div>
                                            {diff > 10 && (
                                                <div className="mt-1 text-[9px] text-[#fca5a5] font-bold flex items-center gap-1">
                                                    <Zap size={8} /> Brecha importante
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Insight Footer */}
            <div className="bg-[#FFF7ED] p-3 rounded-xl border border-[#FFEDD5] flex items-start gap-3">
                <div className="p-1 bg-white rounded-full shadow-sm">
                    <ShieldCheck size={14} className="text-[#ea580c]" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-[#9a3412] uppercase mb-0.5">Diagnóstico</p>
                    <p className="text-xs font-medium text-[#7c2d12] leading-tight">
                        Tienes una base sólida en <strong>Ahorro y Deuda</strong>, pero tu nivel de <strong>Previsión</strong> está por debajo del ideal. Considera revisar tus seguros.
                    </p>
                </div>
            </div>

        </div>
    );
};
