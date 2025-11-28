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
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, xp, level")
        .eq("id", user.id)
        .single();

      if (error) throw error;

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
      <div className="page-standard min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const progressPercent = levelInfo 
    ? (levelInfo.xpToNextLevel / levelInfo.totalXpForNextLevel) * 100 
    : 0;

  return (
    <div className="page-standard min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
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
        <Card className="p-8 bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 rounded-3xl animate-fade-in hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Nivel {levelInfo?.level}</h2>
                <p className="text-gray-600 font-medium">{levelInfo?.xp} puntos totales</p>
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
        <Card className="p-6 bg-white/95 backdrop-blur-md shadow-lg border border-gray-100 rounded-3xl animate-fade-in hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Zap className="w-5 h-5 text-blue-600" />
            Cómo ganar puntos
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-md transition-all duration-200">
              <Target className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Completar desafíos semanales</p>
                <p className="text-sm text-gray-600">+50 XP por desafío</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-md transition-all duration-200">
              <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Alcanzar tus metas financieras</p>
                <p className="text-sm text-gray-600">+30 XP por meta</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-all duration-200">
              <Star className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Mantener racha diaria</p>
                <p className="text-sm text-gray-600">+10 XP por día</p>
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