import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Bell, TrendingUp, Target, Calendar, MessageSquare, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "daily_summary":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "weekly_analysis":
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case "savings_tip":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case "goal_reminder":
        return <Target className="h-5 w-5 text-orange-500" />;
      case "spending_alert":
        return <Bell className="h-5 w-5 text-red-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
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

  const getNotificationColor = (type: string) => {
    const colors: { [key: string]: string } = {
      daily_summary: "bg-blue-50 border-blue-200",
      weekly_analysis: "bg-purple-50 border-purple-200",
      savings_tip: "bg-green-50 border-green-200",
      goal_reminder: "bg-orange-50 border-orange-200",
      spending_alert: "bg-red-50 border-red-200",
    };
    return colors[type] || "bg-gray-50 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Notificaciones</h1>
            <p className="text-xs text-muted-foreground">
              Historial de mensajes y recordatorios
            </p>
          </div>
          <Bell className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-2">No hay notificaciones</h3>
              <p className="text-sm text-muted-foreground">
                Aquí aparecerán tus mensajes, recordatorios e insights
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <Card
                key={notification.id}
                className={`${getNotificationColor(notification.notification_type)} border-l-4 transition-all hover:shadow-md`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm">
                          {getNotificationTitle(notification.notification_type)}
                        </h3>
                        <Badge
                          variant={notification.status === "sent" ? "default" : "secondary"}
                          className="flex-shrink-0 text-[10px]"
                        >
                          {notification.status === "sent" ? "Enviado" : notification.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(notification.sent_at), "d 'de' MMMM 'a las' HH:mm", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
