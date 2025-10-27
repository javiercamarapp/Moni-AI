import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Calendar, AlertCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  
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
        <div className="flex items-center justify-between">
          <p className="text-sm sm:text-xs font-bold text-foreground drop-shadow-sm">📅 Próximos Movimientos</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] sm:text-[9px] text-foreground hover:bg-gray-100 hover:scale-105 transition-transform duration-200 h-6 px-2"
            onClick={() => navigate('/proximos-movimientos')}
          >
            Ver todos
          </Button>
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
                className="flex items-center gap-2 py-1.5 transition-colors hover:bg-gray-50/50"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
                  isIncome
                    ? 'bg-green-500'
                    : 'bg-red-500'
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
                    {isUrgent && <AlertCircle className="h-3 w-3 text-red-600 ml-auto" />}
                  </div>
                </div>
                <p className={`text-xs font-black shrink-0 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome ? '+' : '-'}${Number(event.amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>
            );
          })}
        </div>

        {sortedEvents.filter(e => getDaysUntil(e.date) <= 3).length > 0 && (
          <div className="bg-red-50/80 rounded-lg px-2 py-1.5 border border-red-200">
            <p className="text-[9px] text-red-700 leading-snug">
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
