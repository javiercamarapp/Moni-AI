import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, TrendingUp, Target, Calendar, MessageSquare, DollarSign, Sparkles, UserPlus, Check, X } from "lucide-react";
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
    const iconClass = "h-5 w-5";
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
      goal_reminder: "Recordatorio de Meta",
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
      // Remove from local state immediately
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
      // Remove from local state immediately
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error al rechazar solicitud');
    }
  };

  const handleDismiss = async (id: string) => {
    // Optimistic update - remove immediately
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      // Delete from database instead of just marking as read
      const { error } = await supabase
        .from("notification_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("No se pudo eliminar la notificación");
      fetchNotifications(); // Revert on error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#5D4037] via-[#6D4C41] to-[#4E342E]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#5D4037] to-transparent pb-4">
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="bg-white/20 backdrop-blur-sm rounded-full shadow-lg border border-white/10 hover:bg-white/30 transition-all h-10 w-10 p-0"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
              <p className="text-white/60 text-sm">
                {notifications.length > 0 
                  ? `${notifications.length} pendiente${notifications.length > 1 ? 's' : ''}`
                  : 'Todo al día'}
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Bell className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-32 -mt-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-sm rounded-3xl border-white/10 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8"
          >
            <Card className="bg-white/10 backdrop-blur-sm rounded-3xl border-white/10 p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#A1887F]/30 mb-4">
                  <Sparkles className="h-10 w-10 text-[#D7CCC8]" />
                </div>
                <h3 className="font-bold text-xl text-white mb-2">¡Todo al día!</h3>
                <p className="text-white/60 text-sm">
                  No tienes notificaciones pendientes
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.9 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                  layout
                >
                  <Card className="bg-white/95 backdrop-blur-sm rounded-3xl border-0 shadow-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8D6E63] to-[#5D4037] flex items-center justify-center shadow-lg">
                          <div className="text-white">
                            {getNotificationIcon(notification.notification_type)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-[#3E2723] text-sm">
                                {getNotificationTitle(notification.notification_type)}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-[#8D6E63]">
                                  {format(new Date(notification.sent_at), "d MMM, HH:mm", { locale: es })}
                                </span>
                              </div>
                            </div>

                            {/* Dismiss Button */}
                            <button
                              onClick={() => handleDismiss(notification.id)}
                              className="p-1.5 rounded-full hover:bg-[#EFEBE9] transition-colors text-[#A1887F] hover:text-[#5D4037]"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Message */}
                          <p className="text-xs text-[#5D4037]/80 leading-relaxed mt-2">
                            {notification.message}
                          </p>

                          {/* Friend request actions */}
                          {notification.notification_type === "friend_request" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={() => handleAcceptFriendRequest(notification)}
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-[#5D4037] to-[#8D6E63] hover:from-[#4E342E] hover:to-[#6D4C41] text-white rounded-xl shadow-md h-9"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                onClick={() => handleRejectFriendRequest(notification)}
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-white hover:bg-[#EFEBE9] rounded-xl border-[#D7CCC8] text-[#5D4037] h-9"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
