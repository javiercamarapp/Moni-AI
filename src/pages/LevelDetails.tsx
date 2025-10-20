import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Target, TrendingUp, Star, Award, Zap } from "lucide-react";
import { toast } from "sonner";

interface LevelInfo {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXpForNextLevel: number;
}

export default function LevelDetails() {
  const navigate = useNavigate();
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLevelInfo();
  }, []);

  const fetchLevelInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Obtener información del usuario
      const profileResponse: any = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileResponse.error) throw profileResponse.error;

      const profile = profileResponse.data;
      const currentXP = profile?.xp || 0;
      const currentLevel = profile?.level || 1;
      const xpForNextLevel = currentLevel * 100;
      const xpProgress = currentXP % 100;

      setLevelInfo({
        level: currentLevel,
        xp: currentXP,
        xpToNextLevel: xpProgress,
        totalXpForNextLevel: xpForNextLevel
      });
    } catch (error) {
      console.error("Error fetching level info:", error);
      toast.error("Error al cargar información de nivel");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const progressPercent = levelInfo 
    ? (levelInfo.xpToNextLevel / levelInfo.totalXpForNextLevel) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-2xl mx-auto pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tu Nivel</h1>
            <p className="text-sm text-muted-foreground">
              Sigue completando desafíos para subir de nivel
            </p>
          </div>
        </div>

        {/* Current Level Card */}
        <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-4xl font-bold">Nivel {levelInfo?.level}</h2>
                <p className="text-muted-foreground">{levelInfo?.xp} puntos totales</p>
              </div>
            </div>
          </div>

          {/* Progress to Next Level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso al siguiente nivel</span>
              <span className="font-medium">
                {levelInfo?.xpToNextLevel} / {levelInfo?.totalXpForNextLevel} XP
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        </Card>

        {/* Ways to Earn XP */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Cómo ganar puntos
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Completar desafíos semanales</p>
                <p className="text-sm text-muted-foreground">+50 XP por desafío</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Alcanzar tus metas financieras</p>
                <p className="text-sm text-muted-foreground">+30 XP por meta</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
              <Star className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Mantener racha diaria</p>
                <p className="text-sm text-muted-foreground">+10 XP por día</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Level Milestones */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Próximos hitos
          </h3>
          <div className="space-y-3">
            {[
              { level: (levelInfo?.level || 1) + 1, reward: "Badge de Bronce" },
              { level: (levelInfo?.level || 1) + 2, reward: "Función Premium desbloqueada" },
              { level: (levelInfo?.level || 1) + 3, reward: "Avatar personalizado" },
            ].map((milestone, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold">{milestone.level}</span>
                  </div>
                  <span className="font-medium">{milestone.reward}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {milestone.level * 100} XP
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Back Button */}
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          className="w-full"
        >
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}