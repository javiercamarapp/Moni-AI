import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectionLoader } from "@/components/SectionLoader";
import BottomNav from "@/components/BottomNav";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Comment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  reactions?: Reaction[];
}

interface Reaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
}

interface TypingUser {
  user_id: string;
}

const STICKERS = ["💪", "🎯", "🥂", "🔥", "🎉", "👏"];
const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "🚀", "💯"];

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
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      
      await fetchComments();
      
      // Add AI welcome message
      setTimeout(() => {
        const randomAIMessage = AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)];
        addAIMessage(randomAIMessage);
      }, 1000);
    };

    initializeChat();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Setup realtime subscriptions for messages and presence
  useEffect(() => {
    if (!currentUserId || !id) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`goal-comments-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'goal_comments',
          filter: `goal_id=eq.${id}`
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments(prev => [...prev, newComment]);
          
          // Send notification to other members if not from AI
          if (newComment.user_id !== 'moni-ai' && newComment.user_id !== currentUserId) {
            // The notification will be sent from the backend
          }
        }
      )
      .subscribe();

    // Setup presence channel for typing indicators
    const presenceChannel = supabase.channel(`presence-goal-${id}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter((user: any) => user.user_id !== currentUserId && user.typing)
          .map((user: any) => ({ user_id: user.user_id }));
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUserId, id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('goal_comments')
        .select('*')
        .eq('goal_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch reactions for all comments
      const commentIds = commentsData?.map(c => c.id) || [];
      if (commentIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from('goal_comment_reactions')
          .select('*')
          .in('comment_id', commentIds);

        const commentsWithReactions = commentsData?.map(comment => ({
          ...comment,
          reactions: reactionsData?.filter(r => r.comment_id === comment.id) || []
        }));

        setComments(commentsWithReactions || []);
      } else {
        setComments(commentsData || []);
      }
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

  const handleTyping = async (text: string) => {
    setNewComment(text);

    // Update typing status
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      const channel = supabase.channel(`presence-goal-${id}`);
      await channel.track({ user_id: currentUserId, typing: true });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      const channel = supabase.channel(`presence-goal-${id}`);
      await channel.track({ user_id: currentUserId, typing: false });
    }, 1000);
  };

  const handleSend = async () => {
    if (!newComment.trim() || sending) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Stop typing indicator
      setIsTyping(false);
      const channel = supabase.channel(`presence-goal-${id}`);
      await channel.track({ user_id: currentUserId, typing: false });

      const { data: newCommentData, error } = await supabase
        .from('goal_comments')
        .insert({
          goal_id: id,
          user_id: user.id,
          comment: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Get all members of this goal to send notifications
      const { data: goalData } = await supabase
        .from('circle_goals')
        .select('circle_id')
        .eq('id', id)
        .single();

      if (goalData) {
        const { data: members } = await supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', goalData.circle_id)
          .neq('user_id', user.id);

        // Create notifications for all other members
        if (members && members.length > 0) {
          const notifications = members.map(member => ({
            user_id: member.user_id,
            notification_type: 'group_message',
            message: `Nuevo mensaje en el chat grupal: "${newComment.trim().substring(0, 50)}${newComment.length > 50 ? '...' : ''}"`,
            metadata: {
              goal_id: id,
              sender_id: user.id,
              comment_id: newCommentData.id
            }
          }));

          await supabase
            .from('notification_history')
            .insert(notifications);
        }
      }

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

  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user already reacted with this emoji
      const existingReaction = comments
        .find(c => c.id === commentId)
        ?.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('goal_comment_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('goal_comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            emoji: emoji
          });

        if (error) throw error;
      }

      // Refresh comments to get updated reactions
      await fetchComments();
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      toast.error('Error al procesar la reacción');
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
            const isCurrentUser = comment.user_id === currentUserId;

            // Group reactions by emoji
            const reactionGroups = comment.reactions?.reduce((acc, reaction) => {
              if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = [];
              }
              acc[reaction.emoji].push(reaction);
              return acc;
            }, {} as Record<string, Reaction[]>) || {};

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
                  <div>
                    <div className={`${isCurrentUser ? 'bg-white' : 'bg-white'} rounded-2xl p-3 shadow-sm border ${isAI ? 'border-[#c8a57b]/20' : 'border-gray-100'}`}>
                      <p className={`text-sm ${isAI ? 'text-gray-900 font-medium' : 'text-gray-900'}`}>
                        {comment.comment}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-gray-500">
                          {new Date(comment.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {!isAI && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-gray-400 hover:text-gray-600 ml-2">
                                <Smile className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 bg-white border border-gray-200">
                              <div className="flex gap-1">
                                {REACTION_EMOJIS.map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(comment.id, emoji)}
                                    className="text-xl hover:scale-125 transition-transform p-1"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                    {/* Reactions display */}
                    {Object.keys(reactionGroups).length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(reactionGroups).map(([emoji, reactions]) => {
                          const userReacted = reactions.some(r => r.user_id === currentUserId);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(comment.id, emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                userReacted 
                                  ? 'bg-blue-100 border border-blue-300' 
                                  : 'bg-gray-100 border border-gray-200'
                              } hover:scale-105 transition-transform`}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium">{reactions.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-2 items-center px-4 py-2 bg-gray-100 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-600">escribiendo...</span>
              </div>
            </div>
          )}
          
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
                onChange={(e) => handleTyping(e.target.value)}
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
