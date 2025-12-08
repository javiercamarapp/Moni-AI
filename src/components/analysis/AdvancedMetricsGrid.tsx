
import React, { useState } from 'react';
import { 
  Sprout, 
  TrendingUp, 
  Activity, 
  PieChart, 
  Briefcase, 
  Percent, 
  Target, 
  Repeat, 
  Home, 
  ShoppingBag,
  LayoutGrid,
  X,
  CheckCircle2,
  Lightbulb,
  Info
} from 'lucide-react';

interface MetricDetail {
  description: string;
  calculation: string;
  calcValues: string;
  tip: string;
  statusText: string;
}

interface MetricItem {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  status: 'Excelente' | 'Bueno' | 'Regular' | 'Riesgo' | 'Alerta' | 'Proyección';
  theme: 'sand' | 'coffee' | 'sage' | 'clay' | 'amber';
  insight: string;
  icon: React.ElementType;
  details: MetricDetail;
  category?: string;
}

const METRICS_DATA: { category: string; items: MetricItem[] }[] = [
  {
    category: "Independencia y Patrimonio",
    items: [
      {
        id: 'freedom',
        title: 'Libertad Financiera',
        subtitle: 'Cobertura pasiva',
        value: '18.5%',
        status: 'Bueno',
        theme: 'sage',
        insight: 'Tus inversiones ya pagan tu supermercado mensual.',
        icon: Sprout,
        details: {
          description: 'Porcentaje de tus gastos mensuales cubiertos por ingresos pasivos (dividendos, rentas, intereses).',
          calculation: '(Ingreso Pasivo / Gasto Mensual) * 100',
          calcValues: '($7,250 / $39,163) * 100',
          statusText: 'En camino',
          tip: 'Reinvierte todos los dividendos para acelerar el efecto compuesto.'
        }
      },
      {
        id: 'networth',
        title: 'Crecimiento Neto',
        subtitle: 'vs mes anterior',
        value: '+2.1%',
        status: 'Excelente',
        theme: 'coffee',
        insight: 'Tu dinero crece más rápido que la inflación actual.',
        icon: TrendingUp,
        details: {
            description: 'Tasa de crecimiento mensual de tu patrimonio neto (Activos - Pasivos).',
            calculation: '((Patrimonio Actual - Anterior) / Anterior) * 100',
            calcValues: '(($13.5M - $13.2M) / $13.2M) * 100',
            statusText: 'Superando inflación',
            tip: 'Un crecimiento constante del 2% mensual duplica tu patrimonio en ~3 años.'
        }
      },
      {
        id: 'savings_power',
        title: 'Poder de Ahorro',
        subtitle: 'Proyección 12M',
        value: '$145k',
        status: 'Proyección',
        theme: 'sage',
        insight: 'Mantén el ritmo actual para lograr tu viaje.',
        icon: Target,
        details: {
            description: 'Estimación de capital disponible en 1 año basado en tu flujo de efectivo libre promedio actual.',
            calculation: 'Promedio Ahorro Mensual * 12',
            calcValues: '$12,083 * 12',
            statusText: 'Muy alto',
            tip: 'Automatiza este ahorro enviándolo a una cuenta de inversión el día que recibes tu nómina.'
        }
      },
      {
        id: 'dependency',
        title: 'Dependencia',
        subtitle: '% Salario',
        value: '81.5%',
        status: 'Riesgo',
        theme: 'clay',
        insight: 'Tu salario sigue siendo el motor principal único.',
        icon: Briefcase,
        details: {
            description: 'Proporción de tus ingresos totales que provienen de tu trabajo principal (sueldo activo).',
            calculation: '(Salario / Ingreso Total) * 100',
            calcValues: '($115,000 / $141,000) * 100',
            statusText: 'Alta dependencia',
            tip: 'Diversifica fuentes de ingreso (freelance, inversiones) para reducir este riesgo por debajo del 70%.'
        }
      }
    ]
  },
  {
    category: "Desempeño de Inversiones",
    items: [
       {
        id: 'sharpe',
        title: 'Rentabilidad',
        subtitle: 'Ratio Sharpe',
        value: '1.24',
        status: 'Bueno',
        theme: 'sand',
        insight: 'Asumes el riesgo correcto para tus ganancias.',
        icon: Activity,
        details: {
            description: 'Medida del rendimiento de tu inversión ajustado por el riesgo asumido. >1 es bueno.',
            calculation: '(Retorno Portafolio - Tasa Libre Riesgo) / Desviación Std',
            calcValues: '(12% - 11%) / 0.8',
            statusText: 'Eficiente',
            tip: 'Tu portafolio es eficiente. No tomes más riesgo innecesario si no buscas retornos agresivos.'
        }
      },
      {
        id: 'diversification',
        title: 'Diversificación',
        subtitle: 'Score de equilibrio',
        value: '7.5',
        status: 'Regular',
        theme: 'amber',
        insight: 'Considera agregar Renta Fija para mayor estabilidad.',
        icon: PieChart,
        details: {
            description: 'Puntuación basada en la correlación entre tus activos. Un score bajo indica activos que se mueven igual.',
            calculation: 'Índice de correlación ponderado (0-10)',
            calcValues: '7.5 / 10',
            statusText: 'Mejorable',
            tip: 'Agrega activos descorrelacionados como Bonos o Bienes Raíces para subir este score.'
        }
      }
    ]
  },
  {
    category: "Hábitos y Estilo de Vida",
    items: [
      {
        id: 'inflation',
        title: 'Inflación Personal',
        subtitle: 'Aumento gastos',
        value: '4.2%',
        status: 'Excelente',
        theme: 'coffee',
        insight: 'Tu estilo de vida se encarece menos que el mercado.',
        icon: Percent,
        details: {
            description: 'Tasa a la que aumentan tus gastos personales año con año comparado con tu historial.',
            calculation: '((Gastos Año Actual - Año Anterior) / Anterior) * 100',
            calcValues: '4.2% vs 4.8% (INPC)',
            statusText: 'Controlada',
            tip: 'Mantener tu inflación personal por debajo del aumento de tus ingresos es clave para generar riqueza.'
        }
      },
      {
        id: 'consistency',
        title: 'Consistencia',
        subtitle: 'Apegamiento ppt',
        value: '92%',
        status: 'Excelente',
        theme: 'sage',
        insight: 'Rara vez fallas en tu límite de gastos mensual.',
        icon: Repeat,
        details: {
            description: 'Porcentaje de meses en el último año donde cumpliste tu presupuesto sin excedentes.',
            calculation: '(Meses en Presupuesto / 12) * 100',
            calcValues: '(11 / 12) * 100',
            statusText: 'Disciplinado',
            tip: 'La consistencia es más importante que la intensidad. Sigue monitoreando semanalmente.'
        }
      },
      {
        id: 'col',
        title: 'Costo de Vida',
        subtitle: 'Real vs Ideal',
        value: '1.1x',
        status: 'Alerta',
        theme: 'amber',
        insight: 'Gastas un 10% más de lo planeado en tu modelo ideal.',
        icon: Home,
        details: {
            description: 'Comparación entre tus gastos actuales y tu modelo de presupuesto ideal (ej. 50/30/20).',
            calculation: 'Gasto Real / Gasto Presupuestado Ideal',
            calcValues: '$39,163 / $35,500',
            statusText: 'Ligero Desvío',
            tip: 'Revisa tus gastos hormiga y suscripciones, ahí suele estar ese 10% extra.'
        }
      },
      {
        id: 'habits',
        title: 'Hábitos Sanos',
        subtitle: 'Score consumo',
        value: '8.5',
        status: 'Bueno',
        theme: 'sand',
        insight: 'Compras impulsivas bajo control total este mes.',
        icon: ShoppingBag,
        details: {
            description: 'Calificación algorítmica basada en la frecuencia de compras impulsivas y gastos en categorías de ocio.',
            calculation: 'Score propietario (0-10)',
            calcValues: '8.5 / 10',
            statusText: 'Saludable',
            tip: 'Mantén las compras discrecionales (deseos) debajo del 30% de tus ingresos netos.'
        }
      }
    ]
  }
];

const MetricCard = ({ item, onClick }: { item: MetricItem; onClick: () => void }) => {
  const themeStyles = {
    sand:   'bg-[#FAFAF9] border-[#E7E5E4] text-[#57534E]', 
    coffee: 'bg-[#FFF7ED] border-[#FFEDD5] text-[#9A3412]', 
    sage:   'bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]', 
    clay:   'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]',
    amber:  'bg-[#FEFCE8] border-[#FEF08A] text-[#854d0e]',
  };
  
  const iconColors = {
    sand:   'text-[#57534E]',
    coffee: 'text-[#9A3412]',
    sage:   'text-[#166534]',
    clay:   'text-[#991B1B]',
    amber:  'text-[#854d0e]',
  };

  const statusColors = {
      'Excelente': 'bg-emerald-100 text-emerald-700',
      'Bueno': 'bg-stone-100 text-stone-600',
      'Regular': 'bg-amber-100 text-amber-700',
      'Riesgo': 'bg-rose-100 text-rose-700',
      'Alerta': 'bg-orange-100 text-orange-700',
      'Proyección': 'bg-blue-100 text-blue-700',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex-shrink-0 w-[150px] h-[160px] rounded-[1.5rem] p-4 flex flex-col justify-between text-left relative transition-transform active:scale-95 border-b-4 ${themeStyles[item.theme].split(' ')[1]} ${themeStyles[item.theme].split(' ')[0]}`}
    >
      <div className="flex justify-between items-start w-full">
        <div className={`p-1.5 rounded-full bg-white/60`}>
           <item.icon size={14} className={iconColors[item.theme]} />
        </div>
        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${statusColors[item.status]}`}>
            {item.status}
        </span>
      </div>
      
      <div>
        <span className="text-[10px] font-bold text-[#78716C] block mb-0.5 leading-tight">{item.title}</span>
        <div className={`text-2xl font-black ${themeStyles[item.theme].split(' ')[2]} tracking-tight mb-1`}>
          {item.value}
        </div>
        <p className="text-[9px] font-medium leading-tight opacity-80 line-clamp-2">
            {item.insight}
        </p>
      </div>
    </button>
  );
};

const Modal = ({ item, onClose }: { item: MetricItem | null; onClose: () => void }) => {
  if (!item) return null;

  const themeColors = {
    sand:   { bg: 'bg-[#FAFAF9]', text: 'text-[#57534E]', accent: 'bg-[#E7E5E4]' },
    coffee: { bg: 'bg-[#FFF7ED]', text: 'text-[#9A3412]', accent: 'bg-[#FFEDD5]' },
    sage:   { bg: 'bg-[#F0FDF4]', text: 'text-[#166534]', accent: 'bg-[#DCFCE7]' },
    clay:   { bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]', accent: 'bg-[#FEE2E2]' },
    amber:  { bg: 'bg-[#FEFCE8]', text: 'text-[#854d0e]', accent: 'bg-[#FEF08A]' },
  };
  
  const style = themeColors[item.theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#292524]/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[320px] rounded-[2rem] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
            <div className={`flex items-center gap-3 pr-4`}>
                <div className={`p-2 rounded-xl ${style.accent}`}>
                    <item.icon size={20} className={style.text} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider">{item.category}</p>
                    <h3 className="text-lg font-extrabold text-[#292524] leading-tight">{item.title}</h3>
                </div>
            </div>
            <button onClick={onClose} className="p-1.5 bg-[#F5F5F4] rounded-full text-[#78716C]">
                <X size={18} />
            </button>
        </div>

        {/* Big Value */}
        <div className={`rounded-2xl p-5 text-center mb-6 ${style.bg} border border-dashed ${style.accent.replace('bg-', 'border-')}`}>
            <p className="text-[10px] font-bold uppercase opacity-60 mb-1">{item.subtitle}</p>
            <p className={`text-4xl font-black ${style.text} mb-2`}>{item.value}</p>
            <div className="inline-flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm">
                <CheckCircle2 size={10} className={style.text} />
                <span className={`text-[9px] font-bold uppercase ${style.text}`}>{item.details.statusText}</span>
            </div>
        </div>

        {/* Details List */}
        <div className="space-y-4">
            {/* Description */}
            <div>
                <p className="text-[10px] font-bold text-[#A8A29E] uppercase mb-1">Análisis</p>
                <p className="text-xs text-[#57534E] leading-relaxed">
                    {item.details.description}
                </p>
            </div>

            {/* Calculation */}
            <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-3">
                 <div className="flex items-center gap-1 mb-2">
                    <Info size={12} className="text-[#A8A29E]" />
                    <span className="text-[9px] font-bold text-[#A8A29E] uppercase">Cálculo</span>
                </div>
                <code className="text-[10px] text-[#57534E] font-medium block mb-1.5">{item.details.calculation}</code>
                <div className="h-px bg-[#E7E5E4] w-full mb-1.5"></div>
                <p className="text-[10px] text-[#292524] font-bold font-mono text-center">{item.details.calcValues}</p>
            </div>

             {/* Tip */}
             <div className={`p-3 rounded-xl flex gap-2 items-start ${style.bg}`}>
                <Lightbulb size={14} className={`flex-shrink-0 mt-0.5 ${style.text}`} />
                <p className={`text-[10px] font-bold leading-tight ${style.text}`}>
                    {item.details.tip}
                </p>
             </div>
        </div>
      </div>
    </div>
  );
};

export const AdvancedMetricsGrid = ({ filterCategory }: { filterCategory?: string }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricItem | null>(null);

  // Filter categories if prop is present
  const groupsToRender = filterCategory 
    ? METRICS_DATA.filter(g => g.category === filterCategory) 
    : METRICS_DATA;

  if (groupsToRender.length === 0) return null;

  return (
    <div className="space-y-6 mb-6">
      {groupsToRender.map((group, index) => (
        <div key={index}>
            <div className="flex items-center gap-2 mb-3 px-1">
                <LayoutGrid size={14} className="text-[#A8A29E]" />
                <h3 className="text-[#A8A29E] font-bold text-[10px] uppercase tracking-wider">{group.category}</h3>
            </div>
            
            <div className="flex overflow-x-auto gap-3 pb-4 -mx-6 px-6 no-scrollbar snap-x snap-mandatory">
                {group.items.map((metric) => (
                    <div key={metric.id} className="snap-start">
                        <MetricCard item={metric} onClick={() => setSelectedMetric({ ...metric, category: group.category })} />
                    </div>
                ))}
            </div>
        </div>
      ))}

      {selectedMetric && (
        <Modal item={selectedMetric} onClose={() => setSelectedMetric(null)} />
      )}
    </div>
  );
};
