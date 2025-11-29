import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Clock, DollarSign, Check } from "lucide-react";
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
    <div className="min-h-screen pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-border/30 bg-card/50 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/settings")}
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Notificaciones</h1>
            <p className="text-xs text-muted-foreground">Configura tus alertas</p>
          </div>
          {autoSaveStatus !== 'idle' && (
            <div className="flex items-center gap-2 text-sm text-foreground animate-fade-in">
              {autoSaveStatus === 'saving' && (
                <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Guardando...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <span className="hidden sm:inline text-success">Guardado</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-4 space-y-4 max-w-full overflow-hidden">

          {/* Tipos de notificaciones */}
          <Card className="bg-white border-blue-100 shadow-xl hover:shadow-glow transition-all overflow-hidden rounded-[20px]">
            <div className="bg-blue-50 px-4 py-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-blue-100 flex-shrink-0">
                  <Bell className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-foreground truncate">Tipos de Notificaciones</h3>
                  <p className="text-xs text-foreground/70">Personaliza tus alertas de WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-all">
                <div className="flex-1 min-w-0 pr-4">
                  <Label className="text-foreground text-sm font-medium cursor-pointer">Resumen Diario</Label>
                  <p className="text-xs text-foreground/70 mt-1">
                    Recibe un resumen de tus finanzas cada día
                  </p>
                </div>
                <Switch
                  checked={settings.daily_summary}
                  onCheckedChange={(checked) => updateSetting('daily_summary', checked)}
                  className="flex-shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-all">
                <div className="flex-1 min-w-0 pr-4">
                  <Label className="text-foreground text-sm font-medium cursor-pointer">Análisis Semanal</Label>
                  <p className="text-xs text-foreground/70 mt-1">
                    Análisis detallado cada lunes
                  </p>
                </div>
                <Switch
                  checked={settings.weekly_analysis}
                  onCheckedChange={(checked) => updateSetting('weekly_analysis', checked)}
                  className="flex-shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-all">
                <div className="flex-1 min-w-0 pr-4">
                  <Label className="text-foreground text-sm font-medium cursor-pointer">Alertas de Gasto</Label>
                  <p className="text-xs text-foreground/70 mt-1">
                    Notificaciones cuando gastes más de lo normal
                  </p>
                </div>
                <Switch
                  checked={settings.spending_alerts}
                  onCheckedChange={(checked) => updateSetting('spending_alerts', checked)}
                  className="flex-shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-all">
                <div className="flex-1 min-w-0 pr-4">
                  <Label className="text-foreground text-sm font-medium cursor-pointer">Tips de Ahorro</Label>
                  <p className="text-xs text-foreground/70 mt-1">
                    Consejos personalizados para ahorrar
                  </p>
                </div>
                <Switch
                  checked={settings.savings_tips}
                  onCheckedChange={(checked) => updateSetting('savings_tips', checked)}
                  className="flex-shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-all">
                <div className="flex-1 min-w-0 pr-4">
                  <Label className="text-foreground text-sm font-medium cursor-pointer">Recordatorios de Metas</Label>
                  <p className="text-xs text-foreground/70 mt-1">
                    Progreso de tus metas de ahorro
                  </p>
                </div>
                <Switch
                  checked={settings.goal_reminders}
                  onCheckedChange={(checked) => updateSetting('goal_reminders', checked)}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          </Card>

          {/* Umbrales */}
          <Card className="bg-white border-blue-100 shadow-xl hover:shadow-glow transition-all overflow-hidden rounded-[20px]">
            <div className="bg-blue-50 px-4 py-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-blue-100 flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-foreground truncate">Umbrales de Alerta</h3>
                  <p className="text-xs text-foreground/70">Define límites personalizados</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daily_limit" className="text-foreground text-sm font-medium">
                  Límite de Gasto Diario
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/70">$</span>
                  <Input
                    id="daily_limit"
                    type="number"
                    value={settings.daily_spending_limit}
                    onChange={(e) => updateSetting('daily_spending_limit', Number(e.target.value))}
                    className="pl-7 bg-white border-blue-100 text-foreground focus:border-primary transition-all"
                  />
                </div>
                <p className="text-xs text-foreground/70">
                  Te alertaremos si gastas más de este monto en un día
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_threshold" className="text-foreground text-sm font-medium">
                  Alerta por Transacción Mayor a
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/70">$</span>
                  <Input
                    id="transaction_threshold"
                    type="number"
                    value={settings.transaction_alert_threshold}
                    onChange={(e) => updateSetting('transaction_alert_threshold', Number(e.target.value))}
                    className="pl-7 bg-white border-blue-100 text-foreground focus:border-primary transition-all"
                  />
                </div>
                <p className="text-xs text-foreground/70">
                  Recibirás notificación de transacciones mayores a este monto
                </p>
              </div>
            </div>
          </Card>

          {/* Horarios */}
          <Card className="bg-white border-blue-100 shadow-xl hover:shadow-glow transition-all overflow-hidden rounded-[20px]">
            <div className="bg-blue-50 px-4 py-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-blue-100 flex-shrink-0">
                  <Clock className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base sm:text-lg text-foreground truncate">Horarios</h3>
                  <p className="text-xs text-foreground/70">Configura cuándo recibir notificaciones</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferred_time" className="text-foreground text-sm font-medium">
                  Hora Preferida para Resumen Diario
                </Label>
                <Input
                  id="preferred_time"
                  type="time"
                  value={settings.preferred_notification_time}
                  onChange={(e) => updateSetting('preferred_notification_time', e.target.value)}
                  className="bg-white border-blue-100 text-foreground focus:border-primary transition-all w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground text-sm font-medium">Horario Silencioso</Label>
                <p className="text-xs text-foreground/70 mb-3">
                  No recibirás notificaciones durante estas horas
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quiet_start" className="text-xs text-foreground/70">
                      Inicio
                    </Label>
                    <Input
                      id="quiet_start"
                      type="time"
                      value={settings.quiet_hours_start}
                      onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                      className="bg-white border-blue-100 text-foreground focus:border-primary transition-all w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet_end" className="text-xs text-foreground/70">
                      Fin
                    </Label>
                    <Input
                      id="quiet_end"
                      type="time"
                      value={settings.quiet_hours_end}
                      onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                      className="bg-white border-blue-100 text-foreground focus:border-primary transition-all w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
