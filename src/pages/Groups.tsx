import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, ChevronRight, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Circle {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
}

interface GroupGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string | null;
  members: number | null;
  color: string | null;
}

const Groups = () => {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [groupGoals, setGroupGoals] = useState<GroupGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCircleDialog, setShowCreateCircleDialog] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [circleDescription, setCircleDescription] = useState("");
  const [circleCategory, setCircleCategory] = useState("general");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch group goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'group')
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;
      if (goalsData) {
        setGroupGoals(goalsData);
      }

      // Fetch circles
      const { data: circlesData, error: circlesError } = await supabase
        .from('circles')
        .select('id, name, description, member_count')
        .order('created_at', { ascending: false });

      if (circlesError) throw circlesError;
      if (circlesData) {
        setCircles(circlesData);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      toast.error('Por favor ingresa un nombre para el círculo');
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('circles')
        .insert({
          user_id: user.id,
          name: circleName.trim(),
          description: circleDescription.trim() || null,
          category: circleCategory || 'general',
          member_count: 1
        });

      if (error) throw error;

      toast.success('Círculo creado exitosamente');
      setShowCreateCircleDialog(false);
      setCircleName("");
      setCircleDescription("");
      setCircleCategory("general");
      fetchData();
    } catch (error: any) {
      console.error('Error creating circle:', error);
      toast.error('Error al crear círculo');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen pb-6 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-900" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                  Grupos y Círculos Moni
                </h1>
                <p className="text-xs text-gray-600">
                  Crea o únete a comunidades financieras
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Main Section: Grupos y Círculos Moni */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-gray-900">Grupos y Círculos Moni</h3>
            </div>
            {groupGoals.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/new-goal')}
                className="h-7 text-xs bg-white hover:bg-white/90 shadow-md rounded-2xl font-medium"
              >
                + Nueva
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-600">Cargando...</p>
            </div>
          ) : groupGoals.length === 0 ? (
            <div className="text-center py-6">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Aún no tienes metas grupales creadas
              </p>
              <Button
                onClick={() => navigate('/new-goal')}
                className="h-9 px-4 text-xs bg-white text-foreground hover:bg-white/90 shadow-md rounded-2xl font-medium"
              >
                Invita a tus amigos a una meta
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {groupGoals.map((goal) => {
                const progress = (Number(goal.current) / Number(goal.target)) * 100;
                return (
                  <button
                    key={goal.id}
                    onClick={() => navigate(`/goals`)}
                    className="w-full text-left bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${goal.color || 'from-primary/20 to-primary/10'} flex items-center justify-center`}>
                          <Target className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">
                            {goal.title}
                          </h4>
                          {goal.members && (
                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {goal.members} miembros
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-600">
                          ${Number(goal.current).toLocaleString()}
                        </span>
                        <span className="text-gray-500">
                          ${Number(goal.target).toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className="h-1.5"
                        indicatorClassName="bg-gradient-to-r from-primary to-primary/80"
                      />
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-primary font-medium">
                          {progress.toFixed(0)}% completado
                        </span>
                        {goal.deadline && (
                          <span className="text-gray-500">
                            {new Date(goal.deadline).toLocaleDateString('es-MX', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Círculos Moni inside the same section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              Círculos Moni
            </h3>
            <p className="text-gray-600 text-xs mb-3">
              Únete o crea comunidades donde otros usuarios comparten metas similares.
            </p>
            {circles.length > 0 && (
              <div className="space-y-2 mb-3">
                {circles.map((circle) => (
                  <button
                    key={circle.id}
                    onClick={() => navigate(`/circle/${circle.id}`)}
                    className="w-full p-3 border rounded-xl flex justify-between items-center hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <span className="text-xs text-gray-900">💬 Círculo &quot;{circle.name}&quot;</span>
                    <span className="text-xs text-gray-500">{circle.member_count} miembros</span>
                  </button>
                ))}
              </div>
            )}
            <Button
              onClick={() => setShowCreateCircleDialog(true)}
              className="w-full bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear un Círculo Moni
            </Button>
          </div>
        </div>
      </div>

      {/* Create Circle Dialog */}
      <Dialog open={showCreateCircleDialog} onOpenChange={setShowCreateCircleDialog}>
        <DialogContent className="max-w-[360px] w-[90%] rounded-3xl border-none shadow-2xl p-0 bg-white">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-center text-xl font-semibold text-gray-900">Crear Círculo Moni</DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-500 pt-1">
              Crea un círculo para compartir metas con la comunidad
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Nombre del círculo"
                value={circleName}
                onChange={(e) => setCircleName(e.target.value)}
                maxLength={50}
                className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Descripción (opcional)"
                value={circleDescription}
                onChange={(e) => setCircleDescription(e.target.value)}
                maxLength={200}
                className="rounded-xl min-h-[100px] resize-none border-gray-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <Button 
              onClick={handleCreateCircle}
              disabled={creating}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm font-medium text-base disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear Círculo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;
