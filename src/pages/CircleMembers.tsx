import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { MoniLoader } from "@/components/MoniLoader";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface MemberWithProfile {
  id: string;
  circle_id: string;
  user_id: string;
  joined_at: string;
  xp: number;
  profiles: Profile | null;
}

const CircleMembers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }

      // Fetch circle details
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (circleError || !circleData) {
        toast.error('Error al cargar el círculo');
        navigate('/social');
        return;
      }
      setCircle(circleData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('circle_members')
        .select('*')
        .eq('circle_id', id)
        .order('xp', { ascending: false });

      if (membersError) throw membersError;

      // Fetch profiles for members
      let enrichedMembers: MemberWithProfile[] = [];
      if (membersData && membersData.length > 0) {
        const memberIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', memberIds);

        enrichedMembers = membersData.map(member => {
          const profile = profilesData?.find(p => p.id === member.user_id);
          return {
            ...member,
            profiles: profile ? {
              id: profile.id,
              full_name: profile.full_name,
              username: profile.username,
              avatar_url: profile.avatar_url
            } : null
          };
        });
      }

      setMembers(enrichedMembers);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/circle/${id}`)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Miembros: {circle.name}
              </h1>
              <p className="text-xs text-gray-600">
                {members.length} miembros
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-2 space-y-4" style={{ maxWidth: '600px' }}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm mb-3">
            <Users className="h-4 w-4 text-primary" />
            Miembros del círculo
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <MoniLoader size="sm" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-gray-600 text-xs text-center py-4">
              No hay miembros en este círculo aún
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="text-xs font-bold w-6 text-center text-gray-600">
                    {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </span>
                  <Avatar className="h-10 w-10 border border-gray-200">
                    <AvatarImage src={member.profiles?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(member.profiles?.full_name || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {member.profiles?.full_name || 'Usuario'}
                    </p>
                    {member.profiles?.username && (
                      <p className="text-xs text-gray-500">@{member.profiles.username}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {member.xp} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircleMembers;
