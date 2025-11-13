import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFriendChallenges } from '@/hooks/useFriendChallenges';
import { FriendChallengeCard } from '@/components/social/FriendChallengeCard';
import { CreateChallengeModal } from '@/components/social/CreateChallengeModal';
import { supabase } from '@/integrations/supabase/client';
import { SectionLoader } from '@/components/SectionLoader';
import BottomNav from '@/components/BottomNav';

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const FriendChallenges = () => {
  const navigate = useNavigate();
  const { challenges, loading } = useFriendChallenges();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setCurrentUserId(user.id);

    // Obtener amigos aceptados
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (friendships) {
      const friendIds = friendships.map(f =>
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', friendIds);

      setFriends(profiles || []);
    }
  };

  const handleCreateChallenge = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowCreateModal(true);
  };

  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  return (
    <>
      <div className="min-h-screen pb-24 bg-gradient-to-b from-amber-50/30 to-orange-50/20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-purple-50/80 via-cyan-50/60 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10"
                >
                  <ArrowLeft className="h-4 w-4 text-gray-700" />
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Desafíos con Amigos
                  </h1>
                  <p className="text-xs text-gray-600">
                    Compite y motívense mutuamente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {loading ? (
            <div className="py-12">
              <SectionLoader size="lg" />
            </div>
          ) : (
            <>
              {/* Friends Quick Actions */}
              {friends.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200/50">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Retar a un amigo
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {friends.map(friend => (
                      <button
                        key={friend.id}
                        onClick={() => handleCreateChallenge(friend)}
                        className="flex flex-col items-center gap-2 min-w-[80px] p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">
                          {friend.full_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="active" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
                  <TabsTrigger value="pending">
                    Pendientes ({pendingChallenges.length})
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    Activos ({activeChallenges.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completados ({completedChallenges.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                  {pendingChallenges.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hay desafíos pendientes</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingChallenges.map(challenge => (
                        <FriendChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                  {activeChallenges.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hay desafíos activos</p>
                      <p className="text-sm text-gray-500 mt-2">
                        ¡Reta a tus amigos a cumplir metas de ahorro!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeChallenges.map(challenge => (
                        <FriendChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {completedChallenges.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Aún no has completado ningún desafío
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completedChallenges.map(challenge => (
                        <FriendChallengeCard
                          key={challenge.id}
                          challenge={challenge}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {selectedFriend && (
        <CreateChallengeModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          friendId={selectedFriend.id}
          friendName={selectedFriend.full_name}
        />
      )}

      <BottomNav />
    </>
  );
};

export default FriendChallenges;
