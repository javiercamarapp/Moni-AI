import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, MessageSquare, Trash2, Edit3, MoreVertical, User, LogOut, Menu, X } from 'lucide-react';
import moniLogo from '@/assets/moni-ai-logo.png';

const ChatInterface = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Conversación Nueva', date: 'Hoy' }
  ]);
  const [activeConversation, setActiveConversation] = useState(1);
  const [messages, setMessages] = useState<Array<{
    id: number;
    type: string;
    content: string;
  }>>([
    {
      id: 1,
      type: 'ai',
      content: "¡Hola! Soy MONI AI+, tu asistente financiero inteligente. ¿En qué puedo ayudarte hoy?"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Hasta pronto!"
    });
    navigate("/");
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ messages: conversationHistory })
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({
            title: "Límite alcanzado",
            description: "Por favor intenta de nuevo en un momento",
            variant: "destructive"
          });
        } else if (resp.status === 402) {
          toast({
            title: "Créditos agotados",
            description: "Se requieren más créditos para continuar",
            variant: "destructive"
          });
        }
        setIsTyping(false);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;
      let assistantMessage = '';
      let assistantId = Date.now() + 1;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.type === 'ai' && last.id === assistantId) {
                  return prev.map((m, i) => 
                    i === prev.length - 1 ? { ...m, content: assistantMessage } : m
                  );
                }
                return [...prev, {
                  id: assistantId,
                  type: 'ai',
                  content: assistantMessage
                }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Intenta de nuevo.",
        variant: "destructive"
      });
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    const newId = conversations.length + 1;
    setConversations(prev => [
      { id: newId, title: 'Conversación Nueva', date: 'Hoy' },
      ...prev
    ]);
    setActiveConversation(newId);
    setMessages([{
      id: 1,
      type: 'ai',
      content: "¡Hola! Soy MONI AI+, tu asistente financiero inteligente. ¿En qué puedo ayudarte hoy?"
    }]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-900 text-white transition-all duration-300 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <Button
            onClick={handleNewChat}
            className="w-full bg-transparent border border-gray-700 hover:bg-gray-800 text-white justify-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva conversación
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg mb-1 hover:bg-gray-800 transition-colors group ${
                activeConversation === conv.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{conv.title}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <button className="p-1 hover:bg-gray-700 rounded">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:bg-gray-700 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">{conv.date}</span>
            </button>
          ))}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <img src={moniLogo} alt="MONI AI+" className="h-8 w-8" />
              <h1 className="text-xl font-semibold text-gray-900">MONI AI+</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-8 flex gap-4 ${msg.type === 'user' ? 'justify-end' : ''}`}
              >
                {msg.type === 'ai' && (
                  <div className="w-8 h-8 rounded-sm bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <img src={moniLogo} alt="AI" className="w-6 h-6" />
                  </div>
                )}
                <div className={`flex-1 ${msg.type === 'user' ? 'max-w-2xl' : ''}`}>
                  <div className={`${msg.type === 'user' ? 'bg-gray-100 rounded-2xl px-4 py-3 inline-block' : ''}`}>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
                {msg.type === 'user' && (
                  <div className="w-8 h-8 rounded-sm bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="mb-8 flex gap-4">
                <div className="w-8 h-8 rounded-sm bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <img src={moniLogo} alt="AI" className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-white border border-gray-300 rounded-xl shadow-sm focus-within:border-gray-400 focus-within:shadow-md transition-all">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Envía un mensaje a MONI AI+"
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping}
                size="icon"
                className="mr-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              MONI AI+ puede cometer errores. Considera verificar información importante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
