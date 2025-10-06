import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Clock, DollarSign } from "lucide-react";
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

    setLoading(true);
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

      toast({
        title: "Guardado",
        description: "Tu configuración de notificaciones se actualizó correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen animated-wave-bg p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-foreground hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notificaciones</h1>
            <p className="text-muted-foreground">Configura tus alertas de WhatsApp</p>
          </div>
        </div>

        {/* Tipos de notificaciones */}
        <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Tipos de Notificaciones</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Resumen Diario</Label>
                <p className="text-sm text-muted-foreground">
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
                <Label className="text-foreground">Análisis Semanal</Label>
                <p className="text-sm text-muted-foreground">
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
                <Label className="text-foreground">Alertas de Gasto</Label>
                <p className="text-sm text-muted-foreground">
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
                <Label className="text-foreground">Tips de Ahorro</Label>
                <p className="text-sm text-muted-foreground">
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
                <Label className="text-foreground">Recordatorios de Metas</Label>
                <p className="text-sm text-muted-foreground">
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
        <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Umbrales de Alerta</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="daily_limit" className="text-foreground">
                Límite de Gasto Diario
              </Label>
              <Input
                id="daily_limit"
                type="number"
                value={settings.daily_spending_limit}
                onChange={(e) => updateSetting('daily_spending_limit', Number(e.target.value))}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Te alertaremos si gastas más de este monto en un día
              </p>
            </div>

            <div>
              <Label htmlFor="transaction_threshold" className="text-foreground">
                Alerta por Transacción Mayor a
              </Label>
              <Input
                id="transaction_threshold"
                type="number"
                value={settings.transaction_alert_threshold}
                onChange={(e) => updateSetting('transaction_alert_threshold', Number(e.target.value))}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recibirás notificación de transacciones mayores a este monto
              </p>
            </div>
          </div>
        </Card>

        {/* Horarios */}
        <Card className="p-6 bg-card/80 backdrop-blur border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Horarios</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="preferred_time" className="text-foreground">
                Hora Preferida para Resumen Diario
              </Label>
              <Input
                id="preferred_time"
                type="time"
                value={settings.preferred_notification_time}
                onChange={(e) => updateSetting('preferred_notification_time', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-foreground">Horario Silencioso</Label>
              <p className="text-xs text-muted-foreground mb-2">
                No recibirás notificaciones durante estas horas
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="quiet_start" className="text-xs text-muted-foreground">
                    Inicio
                  </Label>
                  <Input
                    id="quiet_start"
                    type="time"
                    value={settings.quiet_hours_start}
                    onChange={(e) => updateSetting('quiet_hours_start', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="quiet_end" className="text-xs text-muted-foreground">
                    Fin
                  </Label>
                  <Input
                    id="quiet_end"
                    type="time"
                    value={settings.quiet_hours_end}
                    onChange={(e) => updateSetting('quiet_hours_end', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Botón guardar */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {loading ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>
    </div>
  );
}
