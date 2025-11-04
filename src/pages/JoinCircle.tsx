import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";
import { Users, CheckCircle, XCircle } from "lucide-react";

const JoinCircle = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [circle, setCircle] = useState<any>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateInvitation();
  }, [code]);

  const validateInvitation = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth', { state: { returnTo: `/join-circle/${code}` } });
        return;
      }
      setUser(currentUser);

      // Fetch invitation
      const { data: inviteData, error: inviteError } = await supabase
        .from('circle_invitations')
        .select('*, circles(*)')
        .eq('code', code)
        .maybeSingle();

      if (inviteError || !inviteData) {
        setError('Invitación no encontrada');
        setLoading(false);
        return;
      }

      // Check if invitation is expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('Esta invitación ha expirado');
        setLoading(false);
        return;
      }

      // Check if max uses reached
      if (inviteData.max_uses && inviteData.current_uses >= inviteData.max_uses) {
        setError('Esta invitación ya alcanzó su límite de usos');
        setLoading(false);
        return;
      }

      setInvitation(inviteData);
      setCircle(inviteData.circles);
      setLoading(false);
    } catch (error: any) {
      console.error('Error validating invitation:', error);
      setError('Error al validar la invitación');
      setLoading(false);
    }
  };

  const handleJoinCircle = async () => {
    if (!user || !circle || !invitation) return;

    try {
      setLoading(true);

      // Check if already member
      const { data: existingMember } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', circle.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        toast.success('Ya eres miembro de este círculo');
        navigate(`/circle/${circle.id}`);
        return;
      }

      // Join circle
      const { error: joinError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circle.id,
          user_id: user.id,
          xp: 0
        });

      if (joinError) throw joinError;

      // Update member count
      await supabase
        .from('circles')
        .update({ member_count: (circle.member_count || 0) + 1 })
        .eq('id', circle.id);

      // Increment invitation uses
      await supabase
        .from('circle_invitations')
        .update({ current_uses: invitation.current_uses + 1 })
        .eq('id', invitation.id);

      toast.success('¡Te has unido al círculo exitosamente!');
      navigate(`/circle/${circle.id}`);
    } catch (error: any) {
      console.error('Error joining circle:', error);
      toast.error('Error al unirse al círculo');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MoniLoader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Invitación inválida
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/social')}
            className="w-full bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium"
          >
            Volver a Social
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Invitación al círculo
          </h1>
          <p className="text-gray-600 text-sm">
            Has sido invitado a unirte
          </p>
        </div>

        {/* Circle Info */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {circle?.name}
          </h2>
          {circle?.description && (
            <p className="text-sm text-gray-600 mb-2">{circle.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{circle?.member_count || 0} miembros</span>
            <span>·</span>
            <span>{circle?.category}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleJoinCircle}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md font-medium h-11"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Unirme al círculo
          </Button>
          <Button
            onClick={() => navigate('/social')}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium h-11"
          >
            Cancelar
          </Button>
        </div>

        <p className="text-[10px] text-gray-500 text-center mt-4">
          Al unirte, aceptas compartir tu progreso con los miembros del círculo
        </p>
      </div>
    </div>
  );
};

export default JoinCircle;
