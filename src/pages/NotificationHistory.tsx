import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, TrendingUp, Target, Calendar, MessageSquare, DollarSign, UserPlus, Check, X, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

      // Only fetch unread notifications (status = 'sent')
      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "sent")
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
    const iconClass = "h-4 w-4";
    switch (type) {
      case "daily_summary":
        return <Calendar className={iconClass} />;
      case "weekly_analysis":
        return <TrendingUp className={iconClass} />;
      case "savings_tip":
        return <DollarSign className={iconClass} />;
      case "goal_reminder":
        return <Target className={iconClass} />;
      case "spending_alert":
        return <Bell className={iconClass} />;
      case "friend_request":
        return <UserPlus className={iconClass} />;
      default:
        return <MessageSquare className={iconClass} />;
    }
  };

  const getNotificationTitle = (type: string) => {
    const titles: { [key: string]: string } = {
      daily_summary: "Resumen Diario",
      weekly_analysis: "Análisis Semanal",
      savings_tip: "Consejo de Ahorro",
      goal_reminder: "Recordatorio",
      spending_alert: "Alerta de Gasto",
      friend_request: "Solicitud de Amistad",
    };
    return titles[type] || "Notificación";
  };

  const handleAcceptFriendRequest = async (notification: Notification) => {
    try {
      const fromUserId = notification.metadata?.from_user_id;
      if (!fromUserId) {
        toast.error("Error: datos de solicitud inválidos");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { error } = await supabase.functions.invoke('respond-friend-request', {
        body: {
          notification_id: notification.id,
          action: 'accept',
          from_user_id: fromUserId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success("Solicitud aceptada");
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast.error('Error al aceptar solicitud');
    }
  };

  const handleRejectFriendRequest = async (notification: Notification) => {
    try {
      const fromUserId = notification.metadata?.from_user_id;
      if (!fromUserId) {
        toast.error("Error: datos de solicitud inválidos");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { error } = await supabase.functions.invoke('respond-friend-request', {
        body: {
          notification_id: notification.id,
          action: 'reject',
          from_user_id: fromUserId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success("Solicitud rechazada");
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error al rechazar solicitud');
    }
  };

  const handleDismiss = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      const { error } = await supabase
        .from("notification_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("No se pudo eliminar la notificación");
      fetchNotifications();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#5D4037] via-[#6D4C41] to-[#4E342E]">
      {/* Header */}
      <div className="sticky top-0 z-40 pt-4 pb-6 px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="bg-white/15 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/25 transition-all h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Notificaciones</h1>
            <p className="text-white/50 text-xs">
              {notifications.length > 0 
                ? `${notifications.length} pendiente${notifications.length > 1 ? 's' : ''}`
                : 'Sin pendientes'}
            </p>
          </div>
          
          <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Bell className="h-4 w-4 text-white/80" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 animate-pulse">
                <div className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-2.5 bg-white/10 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#A1887F]/20 mb-3">
                <Sparkles className="h-7 w-7 text-[#D7CCC8]" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">¡Todo al día!</h3>
              <p className="text-white/50 text-xs">
                No tienes notificaciones pendientes
              </p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 400, damping: 30 }}
                  layout
                >
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-3">
                      <div className="flex gap-2.5">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#8D6E63] to-[#5D4037] flex items-center justify-center">
                          <div className="text-white/90">
                            {getNotificationIcon(notification.notification_type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-medium text-[#3E2723] text-xs">
                                {getNotificationTitle(notification.notification_type)}
                              </h3>
                              <span className="text-[10px] text-[#A1887F]">
                                · {format(new Date(notification.sent_at), "d MMM", { locale: es })}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDismiss(notification.id)}
                              className="p-1 rounded-full hover:bg-[#EFEBE9] transition-colors text-[#BCAAA4] hover:text-[#5D4037]"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Message */}
                          <p className="text-[11px] text-[#5D4037]/70 leading-relaxed mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>

                          {/* Friend request actions */}
                          {notification.notification_type === "friend_request" && (
                            <div className="flex gap-1.5 mt-2">
                              <Button
                                onClick={() => handleAcceptFriendRequest(notification)}
                                size="sm"
                                className="flex-1 bg-[#5D4037] hover:bg-[#4E342E] text-white rounded-lg h-7 text-[10px] font-medium"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                onClick={() => handleRejectFriendRequest(notification)}
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-transparent hover:bg-[#EFEBE9] rounded-lg border-[#D7CCC8] text-[#5D4037] h-7 text-[10px] font-medium"
                              >
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
