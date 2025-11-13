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
      <div className="min-h-screen pb-24 bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full h-9 w-9 hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Desafíos
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {loading ? (
            <div className="py-12">
              <SectionLoader size="lg" />
            </div>
          ) : (
            <>
              {/* Friends Quick Actions */}
              {friends.length > 0 && (
                <div className="bg-card rounded-xl p-5 border border-border/40">
                  <h3 className="text-sm font-medium text-foreground/70 mb-4">
                    Crear desafío
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                    {friends.map(friend => (
                      <button
                        key={friend.id}
                        onClick={() => handleCreateChallenge(friend)}
                        className="flex flex-col items-center gap-2.5 min-w-[72px] p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center ring-1 ring-border/40">
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <span className="text-xs font-medium text-foreground/70 text-center line-clamp-2">
                          {friend.full_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="active" className="space-y-6">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="pending">
                    Pendientes {pendingChallenges.length > 0 && `(${pendingChallenges.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    Activos {activeChallenges.length > 0 && `(${activeChallenges.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completados {completedChallenges.length > 0 && `(${completedChallenges.length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-6">
                  {pendingChallenges.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-xl border border-border/40">
                      <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No hay desafíos pendientes</p>
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

                <TabsContent value="active" className="space-y-4 mt-6">
                  {activeChallenges.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-xl border border-border/40">
                      <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No hay desafíos activos</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Reta a tus amigos a cumplir metas de ahorro
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

                <TabsContent value="completed" className="space-y-4 mt-6">
                  {completedChallenges.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-xl border border-border/40">
                      <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
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
