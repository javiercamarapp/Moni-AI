import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  score_moni: number;
  ranking: number;
}

const FriendsList = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get accepted friendships
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendshipsError) throw friendshipsError;

      if (!friendships || friendships.length === 0) {
        setLoading(false);
        return;
      }

      const friendIds = friendships.map(f => f.friend_id);

      // Get friend profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', friendIds);

      if (profilesError) throw profilesError;

      // Get friend scores
      const { data: scores, error: scoresError } = await supabase
        .from('user_scores')
        .select('user_id, score_moni')
        .in('user_id', friendIds);

      if (scoresError) throw scoresError;

      // Get all scores for ranking calculation
      const { data: allScores, error: allScoresError } = await supabase
        .from('user_scores')
        .select('user_id, score_moni')
        .order('score_moni', { ascending: false });

      if (allScoresError) throw allScoresError;

      // Create ranking map
      const rankingMap = new Map();
      allScores?.forEach((score, index) => {
        rankingMap.set(score.user_id, index + 1);
      });

      // Combine data
      const friendsData: Friend[] = profiles?.map(profile => {
        const score = scores?.find(s => s.user_id === profile.id);
        return {
          id: profile.id,
          username: profile.username || 'usuario',
          full_name: profile.full_name || 'Usuario',
          avatar_url: profile.avatar_url || '',
          score_moni: score?.score_moni || 40,
          ranking: rankingMap.get(profile.id) || 0
        };
      }) || [];

      setFriends(friendsData);
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      toast.error('Error al cargar amigos');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
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
                  Mis Amigos
                </h1>
                <p className="text-xs text-gray-600">
                  {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/add-friend')}
              variant="ghost"
              size="sm"
              className="bg-white hover:bg-white/90 shadow-md rounded-2xl font-medium"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4 space-y-3" style={{ maxWidth: '600px' }}>
        {loading ? (
          <div className="text-center py-12">
            <SectionLoader size="lg" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Sin amigos aún
            </h2>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Agrega amigos para ver su progreso financiero
            </p>
            <Button
              onClick={() => navigate('/add-friend')}
              className="mt-4 bg-white hover:bg-white/90 text-foreground shadow-md rounded-2xl font-medium"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Amigos
            </Button>
          </div>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.id}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={friend.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getInitials(friend.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">
                    {friend.full_name}
                  </h3>
                  <p className="text-xs text-primary">@{friend.username}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <Trophy className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs font-semibold text-gray-900">
                      #{friend.ranking}
                    </span>
                  </div>
                  <p className={`text-xs font-bold ${getScoreColor(friend.score_moni)}`}>
                    {friend.score_moni}/100
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendsList;
