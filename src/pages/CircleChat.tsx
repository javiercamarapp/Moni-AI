import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface MessageWithProfile {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  xp_earned: number;
  created_at: string;
  profiles: Profile | null;
}

const CircleChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [circle, setCircle] = useState<any>(null);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const xpSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, [id]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchData = async () => {
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
        .eq('circle_id', id);

      if (membersError) throw membersError;

      // Fetch profiles for members
      let enrichedMembers: any[] = [];
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
            profiles: profile || null
          };
        });
      }
      setMembers(enrichedMembers);

      // Fetch messages
      if (enrichedMembers && enrichedMembers.length > 0) {
        const memberIds = enrichedMembers.map(m => m.user_id);
        const { data: activityData } = await supabase
          .from('friend_activity')
          .select('*')
          .in('user_id', memberIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (activityData && activityData.length > 0) {
          const enrichedActivity = activityData.map(activity => {
            const member = enrichedMembers.find(m => m.user_id === activity.user_id);
            return {
              ...activity,
              profiles: member?.profiles || null
            };
          });
          setMessages(enrichedActivity.reverse());
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    }
  };

  const setupRealtimeSubscription = () => {
    if (!id) return;

    const channel = supabase
      .channel(`circle-chat-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_activity'
        },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;

    try {
      const message = newMessage.trim();
      
      // Detectar si el mensaje incluye un aporte de dinero
      const moneyMatch = message.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (moneyMatch && (message.toLowerCase().includes('aporté') || message.toLowerCase().includes('aporte'))) {
        const amount = parseFloat(moneyMatch[1].replace(/,/g, ''));
        
        const { error: rpcError } = await supabase.rpc('update_circle_goal', {
          p_circle_id: id,
          p_amount: amount
        });

        if (rpcError) throw rpcError;
        
        const xpEarned = Math.max(1, Math.round(amount / 10));
        
        if (xpSoundRef.current) {
          xpSoundRef.current.currentTime = 0;
          xpSoundRef.current.volume = 0.35;
          xpSoundRef.current.play().catch(() => {});
        }
        
        toast.success(`¡Aporte de $${amount} registrado! +${xpEarned} XP`);
      }

      // Insertar el mensaje
      await supabase
        .from('friend_activity')
        .insert({
          user_id: user.id,
          activity_type: 'circle_message',
          description: message,
          xp_earned: 0
        });

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    }
  };

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 animate-fade-in flex flex-col">
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
                Chat: {circle.name}
              </h1>
              <p className="text-xs text-gray-600">
                {members.length} miembros
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 mx-auto px-4 py-2 flex flex-col" style={{ maxWidth: '600px', width: '100%' }}>
        <div 
          ref={chatRef}
          className="flex-1 bg-white rounded-2xl shadow-sm p-4 mb-4 overflow-y-auto space-y-3"
          style={{ maxHeight: 'calc(100vh - 250px)' }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">
                No hay mensajes aún. ¡Sé el primero en escribir!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarImage src={msg.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(msg.profiles?.full_name || 'U').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-900">
                      {msg.profiles?.full_name || msg.profiles?.username || 'Usuario'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(msg.created_at).toLocaleDateString('es-MX', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                    {msg.description}
                  </p>
                  {msg.xp_earned > 0 && (
                    <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                      +{msg.xp_earned} XP
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 rounded-xl text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-4"
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio 
        ref={xpSoundRef}
        preload="auto"
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_3b7f0b1df4.mp3"
      />
    </div>
  );
};

export default CircleChat;
