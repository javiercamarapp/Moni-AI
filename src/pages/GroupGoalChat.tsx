import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";
import BottomNav from "@/components/BottomNav";

interface Comment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
}

const STICKERS = ["💪", "🎯", "🥂", "🔥", "🎉", "👏"];

const AI_MESSAGES = [
  "Llevan 73% del progreso total. ¡Excelente ritmo, equipo!",
  "Recuerden su aporte semanal 💪",
  "Moni AI detectó que van adelantados 2 semanas 🚀",
  "¡Sigan así! Están muy cerca de su meta 🎯",
];

const GroupGoalChat = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments();
    
    // Add AI welcome message
    setTimeout(() => {
      const randomAIMessage = AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)];
      addAIMessage(randomAIMessage);
    }, 1000);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_comments')
        .select('*')
        .eq('goal_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('Error al cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const addAIMessage = (message: string) => {
    const aiComment: Comment = {
      id: `ai-${Date.now()}`,
      user_id: 'moni-ai',
      comment: message,
      created_at: new Date().toISOString(),
    };
    setComments(prev => [...prev, aiComment]);
  };

  const handleSend = async () => {
    if (!newComment.trim() || sending) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('goal_comments')
        .insert({
          goal_id: id,
          user_id: user.id,
          comment: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      await fetchComments();
      
      // Occasionally trigger AI response
      if (Math.random() > 0.7) {
        setTimeout(() => {
          const randomAIMessage = AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)];
          addAIMessage(randomAIMessage);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleStickerClick = (sticker: string) => {
    setNewComment(newComment + sticker);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SectionLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen pb-32 bg-[#f5efea]">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-purple-50/80 via-cyan-50/60 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
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
                <h1 className="text-lg font-semibold text-gray-900">Chat Grupal</h1>
                <p className="text-xs text-gray-600">Colabora con tu equipo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {comments.map((comment) => {
            const isAI = comment.user_id === 'moni-ai';
            const isCurrentUser = !isAI; // Simplified for demo

            return (
              <div
                key={comment.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex gap-2 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={isAI ? 'bg-[#c8a57b]' : 'bg-gradient-to-br from-purple-400 to-cyan-400'}>
                      {isAI ? '🤖' : '👤'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`${isCurrentUser ? 'bg-white' : 'bg-white'} rounded-2xl p-3 shadow-sm border ${isAI ? 'border-[#c8a57b]/20' : 'border-gray-100'}`}>
                    <p className={`text-sm ${isAI ? 'text-gray-900 font-medium' : 'text-gray-900'}`}>
                      {comment.comment}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {new Date(comment.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            {/* Stickers */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {STICKERS.map((sticker) => (
                <button
                  key={sticker}
                  onClick={() => handleStickerClick(sticker)}
                  className="text-2xl hover:scale-110 transition-transform"
                >
                  {sticker}
                </button>
              ))}
            </div>

            {/* Input field */}
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-2xl border-[#c8a57b]/30"
              />
              <Button
                onClick={handleSend}
                disabled={!newComment.trim() || sending}
                className="h-10 w-10 p-0 rounded-full bg-[#c8a57b] hover:bg-[#a08860] transition-all"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
};

export default GroupGoalChat;
