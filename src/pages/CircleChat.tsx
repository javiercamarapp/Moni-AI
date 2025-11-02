import { useEffect, useState, useRef, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from "@/components/ui/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatInput } from "@/components/ui/chat-input";
import { ArrowLeft, Camera, Send, MessageCircle, Paperclip } from "lucide-react";
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

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
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

  const handleCameraClick = () => {
    toast.info("Cámara - próximamente");
  };

  const handleAttachFile = () => {
    toast.info("Adjuntar archivo - próximamente");
  };

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#E5DEFF] to-[#FFDEE2] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse -z-10" style={{ animationDuration: '4s' }} />
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/95 to-[#FFDEE2]/95 backdrop-blur-md border-b border-white/20 animate-pulse" style={{ animationDuration: '4s' }}>
        <div className="w-full px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/circle/${id}`)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {circle.name}
              </h1>
              <p className="text-xs text-gray-600">
                {members.length} miembros
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 w-full overflow-hidden pb-20 bg-gradient-to-b from-[#E5DEFF]/95 to-[#FFDEE2]/95 backdrop-blur-md">
        <div className="h-full">
          <ChatMessageList smooth>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-full p-6 mb-4">
                  <MessageCircle className="h-12 w-12 text-primary" />
                </div>
                <p className="text-gray-600 text-sm text-center">
                  No hay mensajes aún
                </p>
                <p className="text-gray-500 text-xs text-center mt-1">
                  ¡Sé el primero en escribir!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  variant={msg.user_id === user?.id ? "sent" : "received"}
                  className="gap-2"
                >
                  <ChatBubbleAvatar
                    src={msg.profiles?.avatar_url || ''}
                    fallback={(msg.profiles?.full_name || 'U').substring(0, 2).toUpperCase()}
                  />
                  <div className="flex flex-col gap-0.5 max-w-[75%] sm:max-w-[70%]">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs font-medium text-gray-600 truncate">
                        {msg.profiles?.full_name || msg.profiles?.username || 'Usuario'}
                      </span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {new Date(msg.created_at).toLocaleTimeString('es-MX', { 
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <ChatBubbleMessage 
                      variant={msg.user_id === user?.id ? "sent" : "received"}
                      className="bg-white/90 text-gray-900"
                    >
                      {msg.description}
                    </ChatBubbleMessage>
                    {msg.xp_earned > 0 && (
                      <span className="text-xs text-emerald-600 font-semibold px-1">
                        +{msg.xp_earned} XP
                      </span>
                    )}
                  </div>
                </ChatBubble>
              ))
            )}
          </ChatMessageList>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-2.5 bg-gradient-to-b from-[#E5DEFF]/95 to-[#FFDEE2]/95 backdrop-blur-md border-t border-white/30 z-50">
          <div className="w-full max-w-4xl mx-auto">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1.5 shadow-lg"
            >
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleCameraClick}
                className="h-7 w-7 flex-shrink-0 rounded-full hover:bg-gray-100"
              >
                <Camera className="h-4 w-4 text-gray-600" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleAttachFile}
                className="h-7 w-7 flex-shrink-0 rounded-full hover:bg-gray-100"
              >
                <Paperclip className="h-4 w-4 text-gray-600" />
              </Button>

              <ChatInput
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Mensaje..."
                className="flex-1 min-h-[24px] max-h-[24px] resize-none bg-transparent border-0 px-2 py-0.5 shadow-none focus-visible:ring-0 text-sm placeholder:text-gray-400"
                rows={1}
              />

              <Button 
                type="submit" 
                size="icon"
                className="flex-shrink-0 bg-primary hover:bg-primary/90 rounded-full h-7 w-7 p-0"
                disabled={!newMessage.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
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
