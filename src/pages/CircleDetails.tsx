import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Trophy, MessageCircle, Newspaper, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";

const CircleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    fetchCircleData();
  }, [id]);

  const fetchCircleData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);

      // Fetch circle details
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (circleError) {
        console.error('Error fetching circle:', circleError);
        toast.error('Error al buscar el círculo');
        navigate('/social');
        return;
      }
      
      if (!circleData) {
        toast.error('Este círculo no existe');
        navigate('/social');
        return;
      }
      setCircle(circleData);

      // Check if current user is a member
      const { data: memberData } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', id)
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      setIsMember(!!memberData);
    } catch (error: any) {
      console.error('Error fetching circle data:', error);
      toast.error('Error al cargar el círculo');
    }
  };

  const handleJoinCircle = async () => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from('circle_members')
        .insert({
          circle_id: id,
          user_id: user.id,
          xp: 0
        });

      if (error) throw error;

      // Update member count
      await supabase
        .from('circles')
        .update({ member_count: (circle?.member_count || 0) + 1 })
        .eq('id', id);

      toast.success('¡Te has unido al círculo!');
      fetchCircleData();
    } catch (error: any) {
      console.error('Error joining circle:', error);
      toast.error('Error al unirse al círculo');
    }
  };

  const handleShareCircle = () => {
    const inviteUrl = `${window.location.origin}/circle/${id}`;
    if (navigator.share) {
      navigator.share({
        title: `Únete al círculo ${circle?.name}`,
        text: `¡Únete a nuestro círculo "${circle?.name}" en Moni AI! 🚀`,
        url: inviteUrl
      });
    } else {
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MoniLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/social')}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                {circle?.name}
              </h1>
              <p className="text-xs text-gray-600">
                {circle?.member_count} miembros · {circle?.category}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-2 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Circle Info Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          {circle.description && (
            <p className="text-gray-600 text-sm mb-3">{circle.description}</p>
          )}
          
          <div className="flex gap-2">
            {!isMember ? (
              <Button
                onClick={handleJoinCircle}
                className="flex-1 bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9"
              >
                <Plus className="h-4 w-4 mr-1" />
                Unirme al círculo
              </Button>
            ) : (
              <Button
                onClick={handleShareCircle}
                className="flex-1 bg-white text-gray-800 hover:bg-white/90 shadow-sm border rounded-xl font-medium h-9"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Invitar miembro
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Icons */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate(`/circle/${id}/members`)}
              className="flex flex-col items-center gap-1.5 group w-16"
            >
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] text-gray-600 font-medium text-center">Miembros</span>
            </button>

            <button 
              onClick={() => navigate(`/circle/${id}/challenges`)}
              className="flex flex-col items-center gap-1.5 group w-16"
            >
              <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-600/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-[10px] text-gray-600 font-medium text-center">Retos</span>
            </button>

            <button 
              onClick={() => navigate(`/circle/${id}/chat`)}
              className="flex flex-col items-center gap-1.5 group w-16"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">Chat grupal</span>
            </button>

            <button 
              onClick={() => navigate(`/circle/${id}/news`)}
              className="flex flex-col items-center gap-1.5 group w-16"
            >
              <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                <Newspaper className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-[8px] text-gray-600 font-medium text-center leading-tight">Noticias recomendadas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleDetails;
