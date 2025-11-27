import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, TrendingUp, Target, Calendar, MessageSquare, DollarSign, Sparkles, UserPlus, Check, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
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
  const [unreadCount, setUnreadCount] = useState(0);

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
      
      // Contar notificaciones sin leer
      const unread = data?.filter(n => n.status === "sent").length || 0;
      setUnreadCount(unread);
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

      const { data, error } = await supabase.functions.invoke('respond-friend-request', {
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
      fetchNotifications(); // Refrescar lista
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

      const { data, error } = await supabase.functions.invoke('respond-friend-request', {
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
      fetchNotifications(); // Refrescar lista
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      toast.error('Error al rechazar solicitud');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));

      const { error } = await supabase
        .from("notification_history")
        .update({ status: "read" })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error dismissing notification:", error);
      toast.error("No se pudo descartar la notificación");
      fetchNotifications(); // Revert on error
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-gradient-to-b from-[#efe6dc] via-[#efe6dc] via-10% to-[#f5f0ee]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-1">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="bg-[#fafaf9] rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-white hover:bg-white transition-all h-10 w-10 p-0 text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Notificaciones</h1>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#fafaf9] flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-white text-gray-600">
                <Bell className="h-5 w-5" />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#8D6E63] border-2 border-[#fafaf9] flex items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto px-4 py-6 space-y-4" style={{ maxWidth: '600px' }}>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-[#f3eeea] rounded-[1.75rem] shadow-sm border border-white animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-white/50 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/50 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="bg-[#fafaf9] rounded-[1.75rem] shadow-sm border border-white p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                <Bell className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Todo al día</h3>
              <p className="text-sm text-gray-500">
                No tienes notificaciones pendientes
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
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="bg-[#f7f3ed] rounded-[1.75rem] p-4 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-[#e7dbcb] hover:scale-[1.02] transition-all duration-300 overflow-hidden relative group"
                  >
                    {/* Gradient overlay basado en el tipo - More subtle */}
                    <div 
                      className={`absolute inset-0 opacity-[0.03] pointer-events-none bg-gradient-to-br ${
                        notification.notification_type === "daily_summary" ? "from-blue-400 to-cyan-500" :
                        notification.notification_type === "weekly_analysis" ? "from-slate-400 to-slate-600" :
                        notification.notification_type === "savings_tip" ? "from-emerald-400 to-teal-600" :
                        notification.notification_type === "goal_reminder" ? "from-amber-400 to-orange-500" :
                        notification.notification_type === "spending_alert" ? "from-rose-400 to-red-500" :
                        notification.notification_type === "friend_request" ? "from-purple-400 to-pink-500" :
                        "from-gray-400 to-gray-600"
                      }`}
                    />
                    
                    <div className="relative z-10">
                      <div className="flex gap-3">
                        {/* Icono con gradiente */}
                        <div className={`
                          flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm bg-gradient-to-br
                          ${notification.notification_type === "daily_summary" ? "from-blue-100 to-blue-50 text-blue-600" :
                            notification.notification_type === "weekly_analysis" ? "from-slate-100 to-slate-50 text-slate-600" :
                            notification.notification_type === "savings_tip" ? "from-emerald-100 to-emerald-50 text-emerald-600" :
                            notification.notification_type === "goal_reminder" ? "from-amber-100 to-amber-50 text-amber-600" :
                            notification.notification_type === "spending_alert" ? "from-rose-100 to-rose-50 text-rose-600" :
                            notification.notification_type === "friend_request" ? "from-purple-100 to-purple-50 text-purple-600" :
                            "from-gray-100 to-gray-50 text-gray-600"}
                        `}>
                          {notification.notification_type === "daily_summary" ? (
                            <Calendar className="h-5 w-5" />
                          ) : notification.notification_type === "weekly_analysis" ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : notification.notification_type === "savings_tip" ? (
                            <DollarSign className="h-5 w-5" />
                          ) : notification.notification_type === "goal_reminder" ? (
                            <Target className="h-5 w-5" />
                          ) : notification.notification_type === "spending_alert" ? (
                            <Bell className="h-5 w-5" />
                          ) : notification.notification_type === "friend_request" ? (
                            <UserPlus className="h-5 w-5" />
                          ) : (
                            <MessageSquare className="h-5 w-5" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* Título, badge y dismiss */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <h3 className={`font-bold text-sm truncate ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                                {getNotificationTitle(notification.notification_type)}
                              </h3>
                              {isUnread && (
                                <Badge className="bg-[#EBE5E2] text-[#5D4037] hover:bg-[#e3ddd9] border-[#e3ddd9] text-[9px] px-2 py-0.5 font-bold shadow-none shrink-0">
                                  NUEVO
                                </Badge>
                              )}
                            </div>
                            
                            {/* Dismiss Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(notification.id);
                              }}
                              className="text-gray-400 hover:text-gray-500 transition-colors opacity-90 group-hover:opacity-100 shrink-0 p-1"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          
                          {/* Mensaje */}
                          <p className="text-xs text-gray-500 leading-relaxed mb-3">
                            {notification.message}
                          </p>
                          
                          {/* Botones para solicitudes de amistad */}
                          {notification.notification_type === "friend_request" && notification.status === "sent" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={() => handleAcceptFriendRequest(notification)}
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl shadow-md"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button
                                onClick={() => handleRejectFriendRequest(notification)}
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-white hover:bg-gray-50 rounded-2xl border-2"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          )}
                          
                          {/* Footer con fecha */}
                          <div className="flex items-center gap-2 mt-3">
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
                    </div>
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
