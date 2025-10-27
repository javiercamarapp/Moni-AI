import { Card } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Calendar, AlertCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface FutureEvent {
  date: Date;
  type: "income" | "expense" | "subscription" | "ingreso" | "gasto";
  description: string;
  amount: number;
  risk?: "high" | "medium" | "low";
}

interface FutureCalendarProps {
  events: FutureEvent[];
}

export default function FutureCalendarWidget({ events }: FutureCalendarProps) {
  // Convertir fechas a objetos Date si son strings y ordenar
  const sortedEvents = [...events]
    .map(event => ({
      ...event,
      date: typeof event.date === 'string' ? new Date(event.date) : event.date
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case "income":
        return "💰";
      case "subscription":
        return "🔄";
      case "expense":
        return "💳";
      default:
        return "📅";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "income":
        return "text-primary";
      case "subscription":
        return "text-secondary";
      case "expense":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="p-3 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden animate-fade-in">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-2">
          <p className="text-sm sm:text-xs font-bold text-foreground drop-shadow-sm">📅 Próximos Movimientos</p>
        </div>

        <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .space-y-1.max-h-\\[240px\\]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {sortedEvents.map((event, index) => {
            const daysUntil = getDaysUntil(event.date);
            const isUrgent = daysUntil <= 3;
            const isIncome = event.type === "income" || event.type === "ingreso";
            
            return (
              <div 
                key={index}
                className={`flex items-center gap-2 py-2 px-2 rounded backdrop-blur-sm border-2 transition-all ${
                  isUrgent 
                    ? 'bg-yellow-100/90 border-yellow-400 hover:bg-yellow-200/90' 
                    : isIncome 
                    ? 'bg-green-100/90 border-green-500 hover:bg-green-200/90' 
                    : 'bg-red-100/90 border-red-500 hover:bg-red-200/90'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-lg shrink-0 ${
                  isUrgent
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-700'
                    : isIncome
                    ? 'bg-gradient-to-br from-green-500 to-green-700'
                    : 'bg-gradient-to-br from-red-500 to-red-700'
                }`}>
                  <span className="text-white">{getEventIcon(event.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-muted-foreground">
                      {format(event.date, "d MMM", { locale: es })}
                    </span>
                    <span className="text-[9px] text-muted-foreground">•</span>
                    <span className="text-[9px] text-muted-foreground truncate">
                      {daysUntil === 0 
                        ? "Hoy" 
                        : daysUntil === 1 
                        ? "Mañana" 
                        : `En ${daysUntil}d`
                      }
                    </span>
                    {isUrgent && <AlertCircle className="h-3 w-3 text-yellow-600 ml-auto" />}
                  </div>
                </div>
                <p className={`text-xs font-black shrink-0 ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                  {isIncome ? '+' : '-'}${Number(event.amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            );
          })}
        </div>

        {sortedEvents.filter(e => getDaysUntil(e.date) <= 3).length > 0 && (
          <div className="bg-yellow-50/80 rounded-lg px-2 py-1.5 border border-yellow-200">
            <p className="text-[9px] text-yellow-700 leading-snug">
              ⚠️ <span className="font-medium">
                {sortedEvents.filter(e => getDaysUntil(e.date) <= 3).length} próximos
              </span> en 3 días
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
