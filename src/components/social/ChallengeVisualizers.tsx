import { useState, useEffect } from 'react';

// --- Visualizers ---

export const StreakVisualizer = ({ target, current, theme, isLarge = false }: { target: number, current: number, theme: any, isLarge?: boolean }) => {
    const [animCurrent, setAnimCurrent] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimCurrent(current), 100);
        return () => clearTimeout(timer);
    }, [current]);

    const displayBars = target > 15 ? 15 : target; // Cap bars for UI

    return (
        <div className={`flex gap-1 items-end w-full ${isLarge ? 'h-24 gap-2' : 'h-10'}`}>
            {Array.from({ length: displayBars }).map((_, i) => {
                const isActive = i < animCurrent;
                const delay = i * 150;

                return (
                    <div key={i} className="flex-1 h-full flex items-end">
                        <div
                            className={`w-full rounded-sm transition-all duration-500 ease-out relative overflow-hidden ${isActive ? theme.bg : theme.track || 'bg-stone-200'
                                }`}
                            style={{
                                height: isActive ? '100%' : (i === current ? '30%' : '10%'),
                                transitionDelay: `${delay}ms`
                            }}
                        >
                            {i === current && !isActive && (
                                <div className="absolute inset-0 bg-[#5D4037]/10 animate-pulse"></div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const BarVisualizer = ({ target, current, theme, isLarge = false, type = 'budget' }: { target: number, current: number, theme: any, isLarge?: boolean, type?: string }) => {
    const [animCurrent, setAnimCurrent] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimCurrent(current), 100);
        return () => clearTimeout(timer);
    }, [current]);

    const percentage = Math.min((animCurrent / target) * 100, 100);
    const isDanger = type === 'budget' && percentage > 85;

    // Fix visibility on modal (isLarge)
    const textColorClass = isLarge ? 'text-[#433431]' : theme.dark;
    const barColorClass = isLarge && theme.bar === 'bg-white' ? 'bg-[#433431]' : theme.bar;
    const trackColorClass = isLarge ? 'bg-[#E8DED8]' : theme.track;

    const labelText = type === 'saving' || type === 'investment' ? 'Ahorrado' : type === 'debt' ? 'Pagado' : 'Consumo';

    return (
        <div className="w-full">
            <div className={`flex justify-between items-end ${isLarge ? 'mb-3' : 'mb-1.5'}`}>
                {isLarge && <span className="text-xs font-bold text-[#A1887F] uppercase">{labelText}</span>}
                <div className="flex items-baseline gap-1">
                    <span className={`font-black ${isLarge ? 'text-4xl' : 'text-sm'} ${textColorClass}`}>
                        ${animCurrent.toLocaleString()}
                    </span>
                    {isLarge && <span className="text-sm font-bold text-[#A1887F]">/ ${target.toLocaleString()}</span>}
                </div>
                {!isLarge && <span className="text-[9px] font-bold text-[#A1887F]">${target}</span>}
            </div>

            <div className={`${isLarge ? 'h-8 border-4' : 'h-2.5 border'} w-full ${trackColorClass} rounded-full overflow-hidden relative border-white/40 shadow-inner`}>
                <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-[2000ms] cubic-bezier(0.22, 1, 0.36, 1) ${isDanger ? 'bg-red-500' : barColorClass
                        }`}
                    style={{ width: `${percentage}%` }}
                >
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent"></div>
                </div>
            </div>

            {isLarge && (
                <p className="text-xs text-center mt-3 text-[#8D6E63] font-medium">
                    {type === 'budget' && (isDanger ? '⚠️ Cerca del límite' : '✅ Gasto bajo control')}
                    {type === 'saving' && `🎯 ${(target - current).toLocaleString()} para la meta`}
                    {type === 'debt' && `🔥 ¡Sigue así!`}
                </p>
            )}
        </div>
    );
};

export const RatioVisualizer = ({ target, current, theme, isLarge = false }: { target: number, current: number, theme: any, isLarge?: boolean }) => {
    const [animCurrent, setAnimCurrent] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimCurrent(current), 100);
        return () => clearTimeout(timer);
    }, [current]);

    const fillPercentage = Math.min((animCurrent / target) * 100, 100);
    const size = isLarge ? 180 : 64;
    const strokeWidth = isLarge ? 16 : 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (fillPercentage / 100) * circumference;

    // Fix visibility on modal (isLarge)
    const textColorClass = isLarge ? 'text-[#433431]' : theme.dark;
    // If theme is espresso (light text stroke), change it to dark for modal visibility
    const strokeColorClass = isLarge && theme.bg === 'bg-[#3E2723]' ? 'text-[#433431]' : theme.text;
    const trackColor = isLarge ? '#E8DED8' : (theme.track?.includes('[') ? theme.track.match(/\[(.*?)\]/)[1] : '#E8DED8');

    return (
        <div className={`flex items-center ${isLarge ? 'flex-col justify-center py-4' : 'justify-between px-1 gap-2'}`}>
            <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 overflow-visible">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={trackColor}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeLinecap="round"
                        className="text-stone-200"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={`${strokeColorClass || 'text-stone-500'} transition-all duration-[2000ms] cubic-bezier(0.22, 1, 0.36, 1)`}
                    />
                </svg>
                <div className="absolute flex flex-col items-center justify-center inset-0">
                    <span className={`${isLarge ? 'text-5xl' : 'text-sm'} font-black ${textColorClass}`}>
                        {animCurrent}%
                    </span>
                    {isLarge && <span className="text-xs font-bold text-[#A1887F] uppercase">Actual</span>}
                </div>
            </div>

            {isLarge ? (
                <div className="text-center mt-4">
                    <div className="inline-block bg-[#F5F5F4] px-3 py-1 rounded-full text-xs font-bold text-[#8D6E63]">
                        Meta: {target}%
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center">
                    <div className="text-[8px] text-[#A1887F] font-bold uppercase mb-0.5">Meta</div>
                    <div className={`text-xl font-black leading-none ${theme.dark}`}>{target}%</div>
                </div>
            )}
        </div>
    );
};
