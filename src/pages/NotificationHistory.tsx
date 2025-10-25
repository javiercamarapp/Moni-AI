import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, TrendingUp, Target, Calendar, MessageSquare, DollarSign, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  notification_type: string;
  message: string;
  sent_at: string;
  status: string;
  metadata: any;
}

export default function NotificationHistory() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTitle = (type: string) => {
    const titles: { [key: string]: string } = {
      daily_summary: "Resumen Diario",
      weekly_analysis: "Análisis Semanal",
      savings_tip: "Consejo de Ahorro",
      goal_reminder: "Recordatorio de Meta",
      spending_alert: "Alerta de Gasto",
    };
    return titles[type] || "Notificación";
  };

  return (
    <div className="min-h-screen animated-wave-bg pb-32">
      {/* Header */}
      <div className="mb-6 px-4 pt-6">
        <Button
          type="button"
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          size="icon"
          className="mb-4 bg-white/80 backdrop-blur-md rounded-[20px] shadow-lg hover:bg-white text-foreground h-10 w-10 hover:scale-105 transition-all border border-gray-200/50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card className="bg-white/60 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200/50 p-3">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 mb-2 shadow-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Notificaciones</h1>
            <p className="text-xs text-muted-foreground">
              Mensajes, recordatorios e insights
            </p>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-2xl">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white/40 backdrop-blur-md rounded-[16px] shadow-md border border-gray-300/30 animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="bg-white/50 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200/50 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-bold text-foreground mb-2">No hay notificaciones</h3>
              <p className="text-sm text-muted-foreground">
                Aquí aparecerán tus mensajes, recordatorios e insights
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const isUnread = notification.status === "sent";
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="bg-white/70 backdrop-blur-xl rounded-[16px] shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden relative cursor-pointer"
                  >
                    {/* Gradient overlay basado en el tipo */}
                    <div 
                      className={`absolute inset-0 opacity-5 pointer-events-none bg-gradient-to-br ${
                        notification.notification_type === "daily_summary" ? "from-blue-400 to-cyan-500" :
                        notification.notification_type === "weekly_analysis" ? "from-slate-400 to-slate-600" :
                        notification.notification_type === "savings_tip" ? "from-emerald-400 to-teal-600" :
                        notification.notification_type === "goal_reminder" ? "from-amber-400 to-orange-500" :
                        notification.notification_type === "spending_alert" ? "from-rose-400 to-red-500" :
                        "from-gray-400 to-gray-600"
                      }`}
                    />
                    
                    <CardContent className="p-4 relative z-10">
                      <div className="flex gap-3">
                        {/* Icono con gradiente */}
                        <div className={`
                          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gradient-to-br
                          ${notification.notification_type === "daily_summary" ? "from-blue-400 to-cyan-500" :
                            notification.notification_type === "weekly_analysis" ? "from-slate-400 to-slate-600" :
                            notification.notification_type === "savings_tip" ? "from-emerald-400 to-teal-600" :
                            notification.notification_type === "goal_reminder" ? "from-amber-400 to-orange-500" :
                            notification.notification_type === "spending_alert" ? "from-rose-400 to-red-500" :
                            "from-gray-400 to-gray-600"}
                        `}>
                          {notification.notification_type === "daily_summary" ? (
                            <Calendar className="h-5 w-5 text-white" />
                          ) : notification.notification_type === "weekly_analysis" ? (
                            <TrendingUp className="h-5 w-5 text-white" />
                          ) : notification.notification_type === "savings_tip" ? (
                            <DollarSign className="h-5 w-5 text-white" />
                          ) : notification.notification_type === "goal_reminder" ? (
                            <Target className="h-5 w-5 text-white" />
                          ) : notification.notification_type === "spending_alert" ? (
                            <Bell className="h-5 w-5 text-white" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Título y badge */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-sm text-foreground">
                              {getNotificationTitle(notification.notification_type)}
                            </h3>
                            {isUnread && (
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 animate-pulse" />
                            )}
                          </div>
                          
                          {/* Mensaje */}
                          <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                            {notification.message}
                          </p>
                          
                          {/* Footer con fecha */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Sparkles className="h-3 w-3" />
                              <span>
                                {format(new Date(notification.sent_at), "d MMM, HH:mm", {
                                  locale: es,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
