import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  member_count: number;
  created_at: string;
}

const Groups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (groupsData) {
        setGroups(groupsData);
      }
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast.error('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Por favor ingresa un nombre para el grupo');
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('groups')
        .insert({
          user_id: user.id,
          name: groupName.trim(),
          description: groupDescription.trim(),
          color: 'from-blue-500/20 to-blue-500/10'
        });

      if (error) throw error;

      toast.success('Grupo creado exitosamente');
      setShowCreateDialog(false);
      setGroupName("");
      setGroupDescription("");
      fetchGroups();
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error('Error al crear grupo');
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
                  Grupos
                </h1>
                <p className="text-xs text-gray-600">
                  Crea o únete a grupos financieros
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="ghost"
              size="sm"
              className="bg-white hover:bg-white/90 shadow-md rounded-2xl font-medium"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Groups Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Mis Grupos</h3>
            </div>
            <span className="text-xs text-gray-500">{groups.length} grupos</span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-xs text-gray-600">Cargando...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Aún no tienes grupos creados
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="h-9 px-4 text-xs bg-white text-foreground hover:bg-white/90 shadow-md rounded-2xl font-medium"
              >
                Crear tu primer grupo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {/* Navigate to group details */}}
                  className="w-full text-left bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-100 hover:border-blue-500/20 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${group.color} flex items-center justify-center`}>
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-gray-900 line-clamp-1">
                          {group.name}
                        </h4>
                        {group.description && (
                          <p className="text-[10px] text-gray-500 line-clamp-1">
                            {group.description}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          {group.member_count} {group.member_count === 1 ? 'miembro' : 'miembros'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[320px] rounded-3xl border-none shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-center text-lg font-bold">Crear Grupo</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Crea un grupo para compartir objetivos financieros
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Input
                placeholder="Nombre del grupo"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={50}
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Descripción (opcional)"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                maxLength={200}
                className="rounded-2xl min-h-[80px] resize-none"
              />
            </div>
            <Button 
              onClick={handleCreateGroup}
              disabled={creating}
              className="w-full bg-white text-foreground hover:bg-white/90 rounded-2xl shadow-md font-medium"
            >
              {creating ? 'Creando...' : 'Crear Grupo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;
