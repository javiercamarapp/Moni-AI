import { Card } from "@/components/ui/card";
import { Calendar, AlertCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface FutureEvent {
  date: Date;
  type: "income" | "expense" | "subscription";
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
        return "text-emerald-300";
      case "subscription":
        return "text-purple-300";
      case "expense":
        return "text-orange-300";
      default:
        return "text-white";
    }
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="p-4 bg-gradient-card card-glow border-white/20 hover:scale-105 transition-transform duration-200">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-400" />
          <p className="text-sm font-medium text-white">📅 Calendario de próximos movimientos</p>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedEvents.map((event, index) => {
            const daysUntil = getDaysUntil(event.date);
            const isUrgent = daysUntil <= 3;
            
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  isUrgent 
                    ? 'bg-red-500/20 border-red-500/30' 
                    : 'bg-white/5 border-white/10'
                } hover:bg-white/10 transition-colors`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{getEventIcon(event.type)}</span>
                      <p className="text-xs font-medium text-white">
                        {event.description}
                      </p>
                      {isUrgent && <AlertCircle className="h-3 w-3 text-red-400" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-white/60">
                      <span>{format(event.date, "d 'de' MMMM", { locale: es })}</span>
                      <span>•</span>
                      <span>
                        {daysUntil === 0 
                          ? "Hoy" 
                          : daysUntil === 1 
                          ? "Mañana" 
                          : `En ${daysUntil} días`
                        }
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs font-bold ${getEventColor(event.type)} break-words`}>
                    {event.type === "income" ? "+" : "-"}${event.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {sortedEvents.filter(e => getDaysUntil(e.date) <= 3).length > 0 && (
          <div className="bg-yellow-500/20 rounded px-3 py-2 border border-yellow-500/30">
            <p className="text-[10px] text-yellow-200 leading-snug">
              ⚠️ <span className="font-medium">
                {sortedEvents.filter(e => getDaysUntil(e.date) <= 3).length} movimientos próximos
              </span> en los siguientes 3 días
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
