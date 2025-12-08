import { useState, useEffect } from 'react';
import { ShieldCheck, TrendingUp, Hourglass, Anchor, X, Info, Activity, PiggyBank } from 'lucide-react';
import { getRatioStatus } from '@/utils/analysisDataMappers';

// --- Types ---
interface RatioDetail {
    formula: string;
    explanation: string;
    benchmark: string;
    advice: string;
}

interface RatioItem {
    id: string;
    title: string;
    value: string;
    status: 'Excelente' | 'Bueno' | 'Alerta';
    icon: React.ElementType;
    theme: 'sage' | 'clay' | 'stone' | 'amber' | 'latte' | 'blue';
    details: RatioDetail;
}

interface FinancialRatiosCarouselProps {
    investmentRate: number;
    savingsRate: number;
    stability: number;
    debtCoverage: number;
    moneyAge: number;
    fixedCostOfLiving: number;
}

const calculateProgress = (valueStr: string): number => {
    const num = parseFloat(valueStr.replace(/[^0-9.]/g, ''));
    if (valueStr.includes('%')) return Math.min(num, 100);
    if (valueStr.includes('x')) return Math.min((num / 6) * 100, 100);
    if (valueStr.includes('días')) return Math.min((num / 60) * 100, 100);
    return 50;
};

const RatioCard = ({ item, onClick }: { item: RatioItem; onClick: () => void }) => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const styles = {
        sage: { bg: 'bg-[#d2f9da]', border: 'border-[#b9f9cf]', text: 'text-[#166534]', icon: 'text-[#15803d]', bar: 'bg-[#15803d]' },
        clay: { bg: 'bg-[#FEF2F2]', border: 'border-[#FEE2E2]', text: 'text-[#991B1B]', icon: 'text-[#b91c1c]', bar: 'bg-[#b91c1c]' },
        stone: { bg: 'bg-[#FAFAF9]', border: 'border-[#E7E5E4]', text: 'text-[#57534E]', icon: 'text-[#57534E]', bar: 'bg-[#57534E]' },
        amber: { bg: 'bg-[#FEFCE8]', border: 'border-[#FEF08A]', text: 'text-[#854d0e]', icon: 'text-[#a16207]', bar: 'bg-[#a16207]' },
        latte: { bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]', text: 'text-[#9A3412]', icon: 'text-[#c2410c]', bar: 'bg-[#c2410c]' },
        blue: { bg: 'bg-[#EFF6FF]', border: 'border-[#DBEAFE]', text: 'text-[#1E40AF]', icon: 'text-[#2563EB]', bar: 'bg-[#2563EB]' },
    };

    const style = styles[item.theme];
    const progressWidth = calculateProgress(item.value);

    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 w-[154px] h-[170px] rounded-[1.5rem] p-4 flex flex-col justify-between text-left relative transition-transform active:scale-95 border-b-4 ${style.bg} ${style.border}`}
        >
            <div className="mb-2">
                <div className={`w-8 h-8 rounded-full bg-white/60 flex items-center justify-center mb-2 shadow-sm`}>
                    <item.icon size={16} className={style.icon} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider opacity-80 ${style.text} leading-tight`}>{item.title}</span>
            </div>

            <div className="w-full">
                <div className={`text-xl font-black ${style.text} tracking-tight mb-1`}>
                    {item.value}
                </div>

                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${style.bar}`}
                        style={{ width: animate ? `${progressWidth}%` : '0%' }}
                    ></div>
                </div>

                <div className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/50 border border-white/50">
                    <span className={`text-[9px] font-bold ${style.text}`}>{item.status}</span>
                </div>
            </div>
        </button>
    );
};

const RatioModal = ({ item, onClose }: { item: RatioItem | null; onClose: () => void }) => {
    if (!item) return null;

    const styles = {
        sage: { bg: 'bg-[#F0FDF4]', text: 'text-[#166534]', accent: 'bg-[#DCFCE7]' },
        clay: { bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]', accent: 'bg-[#FEE2E2]' },
        stone: { bg: 'bg-[#FAFAF9]', text: 'text-[#57534E]', accent: 'bg-[#E7E5E4]' },
        amber: { bg: 'bg-[#FEFCE8]', text: 'text-[#854d0e]', accent: 'bg-[#FEF08A]' },
        latte: { bg: 'bg-[#FFF7ED]', text: 'text-[#9A3412]', accent: 'bg-[#FFEDD5]' },
        blue: { bg: 'bg-[#EFF6FF]', text: 'text-[#1E40AF]', accent: 'bg-[#DBEAFE]' },
    };

    const style = styles[item.theme];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#292524]/30 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-[320px] rounded-[2rem] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">

                <div className="flex justify-between items-start mb-5">
                    <div className={`flex items-center gap-3 pr-4`}>
                        <div className={`p-2 rounded-xl ${style.accent}`}>
                            <item.icon size={20} className={style.text} />
                        </div>
                        <h3 className="text-lg font-extrabold text-[#292524] leading-tight">{item.title}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-[#F5F5F4] rounded-full text-[#78716C]">
                        <X size={18} />
                    </button>
                </div>

                <div className={`rounded-2xl p-4 text-center mb-6 ${style.bg}`}>
                    <p className={`text-4xl font-black ${style.text}`}>{item.value}</p>
                    <p className={`text-xs font-bold uppercase mt-1 opacity-70 ${style.text}`}>{item.status}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-1 mb-1">
                            <Info size={12} className="text-[#A8A29E]" />
                            <span className="text-[10px] font-bold text-[#A8A29E] uppercase">Fórmula</span>
                        </div>
                        <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2 text-center">
                            <code className="text-[10px] text-[#57534E] font-medium">{item.details.formula}</code>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-[#A8A29E] uppercase mb-1">¿Qué significa?</p>
                        <p className="text-xs text-[#57534E] leading-relaxed">
                            {item.details.explanation}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#F5F5F4] p-2 rounded-lg">
                        <div className="w-1 h-8 bg-[#A8A29E] rounded-full"></div>
                        <div>
                            <p className="text-[9px] font-bold text-[#A8A29E] uppercase">Benchmark</p>
                            <p className="text-xs font-bold text-[#292524]">{item.details.benchmark}</p>
                        </div>
                    </div>

                    <div className={`p-3 rounded-xl border border-dashed ${style.bg} ${style.text.replace('text', 'border')}`}>
                        <p className={`text-xs font-bold italic ${style.text}`}>
                            " {item.details.advice} "
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FinancialRatiosCarousel = ({
    investmentRate,
    savingsRate,
    stability,
    debtCoverage,
    moneyAge,
    fixedCostOfLiving,
}: FinancialRatiosCarouselProps) => {
    const [selectedRatio, setSelectedRatio] = useState<RatioItem | null>(null);

    const ratios: RatioItem[] = [
        {
            id: 'investment',
            title: 'Tasa de Inversión',
            value: `${investmentRate.toFixed(1)}%`,
            status: getRatioStatus('investment', investmentRate),
            icon: TrendingUp,
            theme: 'latte',
            details: {
                formula: '(Monto Invertido ÷ Ingreso Neto) × 100',
                explanation: 'Porcentaje de tu ingreso destinado específicamente a comprar activos (acciones, bienes raíces, etc.), distinto al ahorro líquido.',
                benchmark: 'Ideal: >15% | FIRE: >40%',
                advice: investmentRate >= 20
                    ? 'Estás construyendo patrimonio agresivamente. Mantén este ritmo para retirarte joven.'
                    : investmentRate >= 10
                        ? 'Buen inicio. Considera aumentar tu tasa de inversión para acelerar tu libertad financiera.'
                        : 'Empieza a invertir una parte de tus ingresos en activos que generen valor a largo plazo.'
            }
        },
        {
            id: 'savings',
            title: 'Tasa de Ahorro',
            value: `${savingsRate.toFixed(1)}%`,
            status: getRatioStatus('savings', savingsRate),
            icon: PiggyBank,
            theme: 'blue',
            details: {
                formula: '(Ahorro Total ÷ Ingresos) × 100',
                explanation: 'Porcentaje total de tus ingresos que no gastas (incluye fondo de emergencia, inversiones y ahorro líquido).',
                benchmark: 'Ideal: >20%',
                advice: savingsRate >= 30
                    ? 'Tu capacidad de retención de dinero es excepcional. Asegúrate de que ese ahorro no se quede estático.'
                    : savingsRate >= 20
                        ? 'Muy bien. Mantén este hábito y considera optimizar tus gastos variables.'
                        : 'Intenta reducir gastos innecesarios para aumentar tu capacidad de ahorro.'
            }
        },
        {
            id: 'stability',
            title: 'Estabilidad',
            value: `${stability.toFixed(1)}x`,
            status: getRatioStatus('stability', stability),
            icon: ShieldCheck,
            theme: 'stone',
            details: {
                formula: 'Patrimonio Neto ÷ Deuda Total',
                explanation: 'Indica cuántas veces tus activos cubren tus deudas totales. Mide tu solvencia a largo plazo.',
                benchmark: 'Sano: >1.0x',
                advice: stability >= 5
                    ? `Tienes $${stability.toFixed(2)} en activos por cada $1.00 de deuda. Tu posición financiera es extremadamente sólida.`
                    : stability >= 2
                        ? 'Buena relación activos/deudas. Sigue reduciendo deudas y aumentando activos.'
                        : 'Enfócate en reducir deudas y aumentar tus activos para mejorar tu estabilidad financiera.'
            }
        },
        {
            id: 'debt-coverage',
            title: 'Cobertura de Deuda',
            value: debtCoverage === Infinity ? '∞' : `${debtCoverage.toFixed(1)}x`,
            status: getRatioStatus('coverage', debtCoverage),
            icon: Activity,
            theme: 'sage',
            details: {
                formula: 'Ingreso Neto ÷ Pagos de Deuda Mensual',
                explanation: 'Indica cuántas veces podrías pagar tus obligaciones mensuales de deuda con tu ingreso actual.',
                benchmark: 'Peligro: <1.5x | Saludable: >2.5x',
                advice: debtCoverage >= 3
                    ? 'Tienes una capacidad de pago muy sólida. Los bancos te verán como un cliente de bajo riesgo.'
                    : debtCoverage >= 2
                        ? 'Capacidad de pago aceptable. Evita adquirir nuevas deudas.'
                        : 'Tus pagos de deuda están consumiendo mucho de tus ingresos. Considera refinanciar o consolidar.'
            }
        },
        {
            id: 'money-age',
            title: 'Edad Dinero',
            value: `${Math.round(moneyAge)} días`,
            status: moneyAge >= 30 ? 'Excelente' : moneyAge >= 15 ? 'Bueno' : 'Alerta',
            icon: Hourglass,
            theme: moneyAge >= 30 ? 'sage' : moneyAge >= 15 ? 'amber' : 'clay',
            details: {
                formula: 'Promedio de días desde que ganaste el dinero hasta que lo gastas.',
                explanation: 'Mide tu "buffer" financiero. Si es alto, estás gastando dinero que ganaste hace meses, rompiendo el ciclo de cheque a cheque.',
                benchmark: 'Meta: >30 días',
                advice: moneyAge >= 30
                    ? '¡Felicidades! Estás viviendo con el ingreso del mes pasado, lo que elimina el estrés financiero.'
                    : 'Trabaja en aumentar tu fondo de emergencia para crear un buffer financiero más amplio.'
            }
        },
        {
            id: 'fixed-cost',
            title: 'Costo Fijo de vida',
            value: `${fixedCostOfLiving.toFixed(1)}%`,
            status: fixedCostOfLiving <= 50 ? 'Excelente' : fixedCostOfLiving <= 70 ? 'Bueno' : 'Alerta',
            icon: Anchor,
            theme: fixedCostOfLiving <= 50 ? 'sage' : fixedCostOfLiving <= 70 ? 'amber' : 'clay',
            details: {
                formula: '(Gastos Fijos ÷ Ingreso Neto) × 100',
                explanation: 'Qué parte de tu ingreso está comprometida en "necesidades" (renta, luz, despensa básica).',
                benchmark: 'Regla 50/30/20: Máximo 50%',
                advice: fixedCostOfLiving <= 40
                    ? 'Tus costos fijos son bajos, lo que te da mucha flexibilidad para ahorrar o disfrutar (gastos variables).'
                    : fixedCostOfLiving <= 50
                        ? 'Nivel aceptable. Busca oportunidades para reducir gastos fijos (cambiar de plan, renegociar).'
                        : 'Tus gastos fijos son altos. Considera mudarte, cambiar servicios o buscar formas de reducir estos costos.'
            }
        }
    ];

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
                <ShieldCheck size={14} className="text-[#A8A29E]" />
                <h3 className="text-[#A8A29E] font-bold text-[10px] uppercase tracking-wider">Ratios Clave</h3>
            </div>

            <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar snap-x snap-mandatory">
                {ratios.map((ratio) => (
                    <div key={ratio.id} className="snap-start">
                        <RatioCard item={ratio} onClick={() => setSelectedRatio(ratio)} />
                    </div>
                ))}
            </div>

            {selectedRatio && (
                <RatioModal item={selectedRatio} onClose={() => setSelectedRatio(null)} />
            )}
        </div>
    );
};
