import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

const AddFriends = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!currentUserId) return;

    try {
      // Here you would insert into a friends/friend_requests table
      // For now, we'll just show a success message
      setSentRequests(new Set(sentRequests).add(friendId));
      toast.success('Solicitud enviada');
    } catch (error: any) {
      console.error('Error adding friend:', error);
      toast.error('Error al enviar solicitud');
    }
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen pb-6 animate-fade-in">
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
                Agregar Amigos
              </h1>
              <p className="text-xs text-gray-600">
                Busca y conecta con otros usuarios
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4 space-y-4" style={{ maxWidth: '600px' }}>
        {/* Search Box */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por usuario o nombre..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-muted/30 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        {/* Search Results */}
        {loading && (
          <div className="text-center py-8 text-sm text-gray-500">
            Buscando...
          </div>
        )}

        {!loading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No se encontraron usuarios
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {user.full_name ? getInitials(user.full_name) : user.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {user.full_name || user.username || 'Usuario'}
                    </h3>
                    {user.username && (
                      <p className="text-xs text-primary font-medium">
                        @{user.username}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddFriend(user.id)}
                    disabled={sentRequests.has(user.id)}
                    className={`rounded-xl px-3 py-1.5 h-auto text-xs ${
                      sentRequests.has(user.id)
                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {sentRequests.has(user.id) ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Enviado
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3 mr-1" />
                        Agregar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery.trim().length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-gray-600">
              Busca usuarios por nombre o usuario
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriends;
