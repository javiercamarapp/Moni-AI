import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";

interface Circle {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
}

const Groups = () => {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Circle[]>([]);
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
    <div className="min-h-screen pb-6">
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
                  Círculos Moni
                </h1>
                <p className="text-xs text-gray-600">
                  Únete o crea comunidades financieras
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Círculos Moni Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-gray-900">Círculos Moni</h3>
          </div>
          <p className="text-gray-600 text-xs mb-4">
            Únete o crea comunidades donde otros usuarios comparten metas similares.
          </p>

          {loading ? (
            <div className="text-center py-8">
              <MoniLoader size="sm" />
            </div>
          ) : circles.length === 0 ? (
            <div className="text-center py-6">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs text-gray-600 mb-4">
                No hay círculos disponibles aún
              </p>
              <Button
                onClick={() => setShowCreateCircleDialog(true)}
                className="h-9 px-4 text-xs bg-white text-foreground hover:bg-white/90 shadow-md rounded-2xl font-medium"
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear el primer círculo
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {circles.map((circle) => (
                  <button
                    key={circle.id}
                    onClick={() => navigate(`/circle/${circle.id}`)}
                    className="w-full p-3 border rounded-xl flex justify-between items-center hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span className="text-xs text-gray-900">💬 {circle.name}</span>
                    <span className="text-xs text-gray-500">{circle.member_count} miembros</span>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setShowCreateCircleDialog(true)}
                className="w-full bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear un Círculo Moni
              </Button>
            </>
          )}
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
