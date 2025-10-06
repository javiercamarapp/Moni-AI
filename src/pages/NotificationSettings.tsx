import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Clock, DollarSign, Check, Home, Target, BarChart3, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const [settings, setSettings] = useState({
    daily_summary: true,
    weekly_analysis: true,
    spending_alerts: true,
    savings_tips: true,
    goal_reminders: true,
    daily_spending_limit: 1000,
    transaction_alert_threshold: 500,
    preferred_notification_time: "21:00",
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00"
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    loadSettings(user.id);
  };

  const loadSettings = async (userId: string) => {
    const { data } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setSettings({
        daily_summary: data.daily_summary,
        weekly_analysis: data.weekly_analysis,
        spending_alerts: data.spending_alerts,
        savings_tips: data.savings_tips,
        goal_reminders: data.goal_reminders,
        daily_spending_limit: Number(data.daily_spending_limit),
        transaction_alert_threshold: Number(data.transaction_alert_threshold),
        preferred_notification_time: data.preferred_notification_time?.substring(0, 5) || "21:00",
        quiet_hours_start: data.quiet_hours_start?.substring(0, 5) || "22:00",
        quiet_hours_end: data.quiet_hours_end?.substring(0, 5) || "08:00"
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setAutoSaveStatus('saving');
    try {
      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: user.id,
          ...settings
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error: any) {
      setAutoSaveStatus('idle');
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const autoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 800);
  }, [user, settings]);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    autoSave();
  };

  return (
    <div className="min-h-screen animated-wave-bg p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
            <p className="text-sm text-white/70">Configura tus alertas de WhatsApp</p>
          </div>
          {autoSaveStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-sm text-white animate-fade-in">
              {autoSaveStatus === 'saving' && (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Guardado</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tipos de notificaciones */}
        <Card className="p-4 bg-card/80 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-white" />
            <h3 className="font-bold text-base text-white">Tipos de Notificaciones</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white text-sm">Resumen Diario</Label>
                <p className="text-xs text-white/70">
                  Recibe un resumen de tus finanzas cada día
                </p>
              </div>
              <Switch
                checked={settings.daily_summary}
                onCheckedChange={(checked) => updateSetting('daily_summary', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white text-sm">Análisis Semanal</Label>
                <p className="text-xs text-white/70">
                  Análisis detallado cada lunes
                </p>
              </div>
              <Switch
                checked={settings.weekly_analysis}
                onCheckedChange={(checked) => updateSetting('weekly_analysis', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white text-sm">Alertas de Gasto</Label>
                <p className="text-xs text-white/70">
                  Notificaciones cuando gastes más de lo normal
                </p>
              </div>
              <Switch
                checked={settings.spending_alerts}
                onCheckedChange={(checked) => updateSetting('spending_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white text-sm">Tips de Ahorro</Label>
                <p className="text-xs text-white/70">
                  Consejos personalizados para ahorrar
                </p>
              </div>
              <Switch
                checked={settings.savings_tips}
                onCheckedChange={(checked) => updateSetting('savings_tips', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white text-sm">Recordatorios de Metas</Label>
                <p className="text-xs text-white/70">
                  Progreso de tus metas de ahorro
                </p>
              </div>
              <Switch
                checked={settings.goal_reminders}
                onCheckedChange={(checked) => updateSetting('goal_reminders', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Umbrales */}
        <Card className="p-4 bg-card/80 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-white" />
            <h3 className="font-bold text-base text-white">Umbrales de Alerta</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="daily_limit" className="text-white text-sm">
                Límite de Gasto Diario
              </Label>
              <Input
                id="daily_limit"
                type="number"
                value={settings.daily_spending_limit}
                onChange={(e) => updateSetting('daily_spending_limit', Number(e.target.value))}
                className="mt-1 bg-white/10 border-white/20 text-white"
              />
              <p className="text-[10px] text-white/70 mt-1">
                Te alertaremos si gastas más de este monto en un día
              </p>
            </div>

            <div>
              <Label htmlFor="transaction_threshold" className="text-white text-sm">
                Alerta por Transacción Mayor a
              </Label>
              <Input
                id="transaction_threshold"
                type="number"
                value={settings.transaction_alert_threshold}
                onChange={(e) => updateSetting('transaction_alert_threshold', Number(e.target.value))}
                className="mt-1 bg-white/10 border-white/20 text-white"
              />
              <p className="text-[10px] text-white/70 mt-1">
                Recibirás notificación de transacciones mayores a este monto
              </p>
            </div>
          </div>
        </Card>

        {/* Horarios */}
        <Card className="p-4 bg-card/80 backdrop-blur border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-white" />
            <h3 className="font-bold text-base text-white">Horarios</h3>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="preferred_time" className="text-white text-sm">
                Hora Preferida para Resumen Diario
              </Label>
              <Input
                id="preferred_time"
                type="time"
                value={settings.preferred_notification_time}
                onChange={(e) => updateSetting('preferred_notification_time', e.target.value)}
                className="mt-1 bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <Label className="text-white text-sm">Horario Silencioso</Label>
              <p className="text-[10px] text-white/70 mb-2">
                No recibirás notificaciones durante estas horas
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="quiet_start" className="text-[10px] text-white/70">
                    Inicio
                  </Label>
                  <Input
                    id="quiet_start"
                    type="time"
                    value={settings.quiet_hours_start}
                    onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                    className="mt-1 bg-white/10 border-white/20 text-white text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="quiet_end" className="text-[10px] text-white/70">
                    Fin
                  </Label>
                  <Input
                    id="quiet_end"
                    type="time"
                    value={settings.quiet_hours_end}
                    onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                    className="mt-1 bg-white/10 border-white/20 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 animated-wave-bg border-t border-white/20 shadow-lg">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/dashboard")}>
              <Home className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Home</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/analysis")}>
              <BarChart3 className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Análisis</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/goals")}>
              <Target className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Metas</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/chat")}>
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Chat AI</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-purple-400" onClick={() => navigate("/profile")}>
              <User className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-purple-400">Perfil</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}
