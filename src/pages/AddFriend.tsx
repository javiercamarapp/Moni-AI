import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";

interface SearchedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  score_moni: number;
  status?: 'none' | 'pending' | 'accepted';
}

const AddFriend = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Ingresa un nombre de usuario");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }
      setCurrentUserId(user.id);

      // Buscar usuarios por username (sin @ al inicio)
      const cleanQuery = searchQuery.replace('@', '').toLowerCase();
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, score_moni')
        .ilike('username', `%${cleanQuery}%`)
        .neq('id', user.id)
        .limit(20);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        toast.info("No se encontraron usuarios");
        setSearchResults([]);
        return;
      }

      // Verificar el estado de amistad con cada usuario encontrado
      const userIds = profiles.map(p => p.id);
      
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('friend_id, status')
        .eq('user_id', user.id)
        .in('friend_id', userIds);

      if (friendshipsError) throw friendshipsError;

      // Mapear resultados con estado de amistad
      const results: SearchedUser[] = profiles.map(profile => {
        const friendship = friendships?.find(f => f.friend_id === profile.id);
        return {
          ...profile,
          username: profile.username || 'usuario',
          full_name: profile.full_name || 'Usuario',
          avatar_url: profile.avatar_url || '',
          score_moni: profile.score_moni || 50,
          status: friendship ? friendship.status as 'pending' | 'accepted' : 'none'
        };
      });

      setSearchResults(results);
      toast.success(`${results.length} ${results.length === 1 ? 'usuario encontrado' : 'usuarios encontrados'}`);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string, friendName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-friend-request', {
        body: { friend_id: friendId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success(`Solicitud enviada a ${friendName}`);
      
      // Actualizar el estado local
      setSearchResults(prev => prev.map(u => 
        u.id === friendId ? { ...u, status: 'pending' as const } : u
      ));
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast.error('Error al enviar solicitud');
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusButton = (user: SearchedUser) => {
    if (user.status === 'accepted') {
      return (
        <Button
          disabled
          size="sm"
          className="bg-green-500/20 text-green-700 hover:bg-green-500/20 rounded-2xl"
        >
          <Check className="h-4 w-4 mr-1" />
          Amigos
        </Button>
      );
    }

    if (user.status === 'pending') {
      return (
        <Button
          disabled
          size="sm"
          className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/20 rounded-2xl"
        >
          Pendiente
        </Button>
      );
    }

    return (
      <Button
        onClick={() => sendFriendRequest(user.id, user.full_name)}
        size="sm"
        className="bg-white hover:bg-white/90 text-foreground shadow-md rounded-2xl"
      >
        <UserPlus className="h-4 w-4 mr-1" />
        Agregar
      </Button>
    );
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Agregar Amigo
              </h1>
              <p className="text-xs text-gray-600">
                Busca usuarios por nombre de usuario
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Search Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por @usuario"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="w-full bg-white hover:bg-white/90 text-foreground shadow-md rounded-2xl font-medium"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Buscar Usuario
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <SectionLoader size="lg" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {user.full_name}
                    </h3>
                    <p className="text-xs text-primary">@{user.username}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Score: {user.score_moni}/100
                    </p>
                  </div>

                  {getStatusButton(user)}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery.trim() === "" ? (
          <div className="text-center py-16 space-y-3">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Encuentra a tus amigos
            </h2>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              Busca por nombre de usuario para conectar con otros usuarios
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AddFriend;
