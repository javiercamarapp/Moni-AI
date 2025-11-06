import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Smile, Trash2, Reply, X } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  deleted_at?: string | null;
  reply_to_id?: string | null;
  reactions?: Reaction[];
  reply_to?: Comment | null;
  mentions?: string[];
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

interface CircleMember {
  user_id: string;
  name?: string;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      
      await fetchComments();
      await fetchCircleMembers();
      
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

  const fetchCircleMembers = async () => {
    try {
      // Get circle_id from goal
      const { data: goalData } = await supabase
        .from('circle_goals')
        .select('circle_id')
        .eq('id', id)
        .single();

      if (goalData) {
        const { data: members } = await supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', goalData.circle_id);

        setCircleMembers(members || []);
      }
    } catch (error) {
      console.error('Error fetching circle members:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('goal_comments')
        .select('*')
        .eq('goal_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch reactions for all comments
      const commentIds = commentsData?.map(c => c.id) || [];
      if (commentIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from('goal_comment_reactions')
          .select('*')
          .in('comment_id', commentIds);

        // Fetch reply-to comments
        const replyToIds = commentsData?.filter(c => c.reply_to_id).map(c => c.reply_to_id) || [];
        let replyToComments: any[] = [];
        if (replyToIds.length > 0) {
          const { data } = await supabase
            .from('goal_comments')
            .select('*')
            .in('id', replyToIds);
          replyToComments = data || [];
        }

        const commentsWithReactions = commentsData?.map(comment => ({
          ...comment,
          reactions: reactionsData?.filter(r => r.comment_id === comment.id) || [],
          reply_to: comment.reply_to_id ? replyToComments.find(r => r.id === comment.reply_to_id) : null
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

    // Check for mentions
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === text.length - 1) {
      setShowMentionSuggestions(true);
      setMentionStartIndex(lastAtIndex);
      setMentionSearch("");
    } else if (lastAtIndex !== -1 && mentionStartIndex !== -1) {
      const searchTerm = text.slice(mentionStartIndex + 1);
      if (searchTerm.includes(' ')) {
        setShowMentionSuggestions(false);
        setMentionStartIndex(-1);
      } else {
        setMentionSearch(searchTerm);
        setShowMentionSuggestions(true);
      }
    } else {
      setShowMentionSuggestions(false);
      setMentionStartIndex(-1);
    }

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

  const handleMentionSelect = (userId: string) => {
    const beforeMention = newComment.slice(0, mentionStartIndex);
    const afterMention = newComment.slice(mentionStartIndex + 1 + mentionSearch.length);
    setNewComment(`${beforeMention}@${userId.slice(0, 8)} ${afterMention}`);
    setShowMentionSuggestions(false);
    setMentionStartIndex(-1);
    inputRef.current?.focus();
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@([a-f0-9]{8})/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
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

      // Extract mentions
      const mentions = extractMentions(newComment);

      const { data: newCommentData, error } = await supabase
        .from('goal_comments')
        .insert({
          goal_id: id,
          user_id: user.id,
          comment: newComment.trim(),
          reply_to_id: replyingTo?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      // Insert mentions
      if (mentions.length > 0 && newCommentData) {
        const mentionRecords = mentions.map(userId => ({
          comment_id: newCommentData.id,
          mentioned_user_id: userId
        }));

        await supabase
          .from('goal_comment_mentions')
          .insert(mentionRecords);

        // Send notifications to mentioned users
        const mentionNotifications = mentions.map(userId => ({
          user_id: userId,
          notification_type: 'mention',
          message: `Te mencionaron en el chat grupal: "${newComment.trim().substring(0, 50)}${newComment.length > 50 ? '...' : ''}"`,
          metadata: {
            goal_id: id,
            comment_id: newCommentData.id,
            sender_id: user.id
          }
        }));

        await supabase
          .from('notification_history')
          .insert(mentionNotifications);
      }

      // Get all members of this goal to send notifications (except mentioned users)
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
          .neq('user_id', user.id)
          .not('user_id', 'in', `(${mentions.join(',')})`);

        // Create notifications for all other members (not mentioned)
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
      setReplyingTo(null);
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

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const { error } = await supabase
        .from('goal_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentToDelete)
        .eq('user_id', currentUserId);

      if (error) throw error;

      toast.success('Mensaje eliminado');
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
      await fetchComments();
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error('Error al eliminar el mensaje');
    }
  };

  const handleReplyTo = (comment: Comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
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
                    {/* Reply indicator */}
                    {comment.reply_to && (
                      <div className="text-xs text-gray-500 mb-1 ml-2 flex items-center gap-1">
                        <Reply className="h-3 w-3" />
                        <span>Respondiendo a: {comment.reply_to.comment.substring(0, 30)}...</span>
                      </div>
                    )}
                    
                    <div className={`${isCurrentUser ? 'bg-white' : 'bg-white'} rounded-2xl p-3 shadow-sm border ${isAI ? 'border-[#c8a57b]/20' : 'border-gray-100'} relative group`}>
                      <p className={`text-sm ${isAI ? 'text-gray-900 font-medium' : 'text-gray-900'}`}>
                        {comment.comment}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-gray-500">
                          {new Date(comment.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        
                        {/* Action buttons */}
                        {!isAI && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleReplyTo(comment)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="Responder"
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </button>
                            
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-gray-400 hover:text-gray-600 p-1" title="Reaccionar">
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
                            
                            {isCurrentUser && (
                              <button
                                onClick={() => {
                                  setCommentToDelete(comment.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-400 hover:text-red-600 p-1"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
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
            {/* Reply indicator */}
            {replyingTo && (
              <div className="mb-2 bg-gray-50 rounded-lg p-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Reply className="h-3 w-3" />
                  <span>Respondiendo a: {replyingTo.comment.substring(0, 40)}...</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Mention suggestions */}
            {showMentionSuggestions && (
              <div className="mb-2 bg-white rounded-lg border border-gray-200 shadow-lg max-h-32 overflow-y-auto">
                {circleMembers
                  .filter(m => m.user_id !== currentUserId)
                  .filter(m => !mentionSearch || m.user_id.toLowerCase().includes(mentionSearch.toLowerCase()))
                  .map(member => (
                    <button
                      key={member.user_id}
                      onClick={() => handleMentionSelect(member.user_id)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-cyan-400 text-xs">
                          👤
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-900">@{member.user_id.slice(0, 8)}</span>
                    </button>
                  ))}
              </div>
            )}

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
                ref={inputRef}
                value={newComment}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje... (usa @ para mencionar)"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar mensaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El mensaje será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-900">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupGoalChat;
