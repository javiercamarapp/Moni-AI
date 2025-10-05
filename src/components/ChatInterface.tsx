import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Smile, Paperclip, Phone, Video, MoreVertical, ArrowLeft, Bot, User, LogOut } from 'lucide-react';
import moniLogo from '/moni-logo.png';
const ChatInterface = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false); // Changed to false for instant load
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: number;
    type: string;
    content: string;
    timestamp: string;
  }>>([{
    id: 1,
    type: 'ai',
    content: "¡Hola! 👋 Soy Moni AI, tu coach financiero personal. Estoy aquí para ayudarte a alcanzar tus metas financieras de manera divertida. ¿En qué puedo ayudarte hoy?",
    timestamp: new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Check authentication in background - no loading screen
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    
    checkAuth();

    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  
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
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      })
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
        body: JSON.stringify({
          messages: conversationHistory
        })
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
        } else {
          throw new Error('Error en la respuesta');
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
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, {
          stream: true
        });
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
                  return prev.map((m, i) => i === prev.length - 1 ? {
                    ...m,
                    content: assistantMessage
                  } : m);
                }
                return [...prev, {
                  id: assistantId,
                  type: 'ai',
                  content: assistantMessage,
                  timestamp: new Date().toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
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
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth'
        });
      }, 100);
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
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  return <div className="min-h-screen animated-wave-bg">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        
        {/* Chat Header */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-b-none shadow-lg">
          <div className="flex items-center justify-between p-2 sm:p-3 gap-2">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Button variant="ghost" size="icon" className="lg:hidden text-gray-900 hover:bg-gray-100 flex-shrink-0 h-7 w-7" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-3 h-3" />
              </Button>
              
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-primary flex items-center justify-center glow-primary flex-shrink-0">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">Moni AI Coach</h2>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0"></div>
                  <span className="text-[9px] sm:text-[10px] text-gray-600 leading-tight">En línea</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              
              
              
              <Button variant="ghost" size="icon" className="text-gray-900 hover:bg-gray-100" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-white/90 backdrop-blur-sm p-4 space-y-4">
          {messages.map(msg => <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'ai' ? 'bg-gradient-primary glow-primary' : 'bg-secondary'}`}>
                  {msg.type === 'ai' ? <Bot className="w-4 h-4 text-primary-foreground" /> : <User className="w-4 h-4 text-secondary-foreground" />}
                </div>

                {/* Message Bubble */}
                <div className={`relative px-4 py-3 rounded-2xl ${msg.type === 'ai' ? 'bg-gray-100 text-gray-900 rounded-bl-md' : 'bg-primary text-primary-foreground rounded-br-md'}`}>
                  
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </div>
                  
                  <div className={`text-xs mt-2 ${msg.type === 'ai' ? 'text-gray-600' : 'text-primary-foreground/70'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            </div>)}

          {/* Typing Indicator */}
          {isTyping && <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-primary glow-primary">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="relative px-4 py-3 rounded-2xl bg-gray-100 text-gray-900 rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                  animationDelay: '0.1s'
                }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                  animationDelay: '0.2s'
                }}></div>
                  </div>
                </div>
              </div>
            </div>}
          
          <div ref={messagesEndRef} />

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 justify-center py-4">
            <Button variant="outline" size="sm" className="text-xs border-white/30 text-white hover:bg-white/10 hover:border-white/50" onClick={() => {
            setMessage('Analiza mis gastos');
            setTimeout(() => handleSendMessage(), 100);
          }}>
              📊 Analizar mis gastos
            </Button>
            <Button variant="outline" size="sm" className="text-xs border-white/30 text-white hover:bg-white/10 hover:border-white/50" onClick={() => {
            setMessage('Quiero crear una nueva meta');
            setTimeout(() => handleSendMessage(), 100);
          }}>
              🎯 Crear nueva meta
            </Button>
            <Button variant="outline" size="sm" className="text-xs border-white/30 text-white hover:bg-white/10 hover:border-white/50" onClick={() => {
            setMessage('Dame tips de ahorro');
            setTimeout(() => handleSendMessage(), 100);
          }}>
              💡 Tips de ahorro
            </Button>
            <Button variant="outline" size="sm" className="text-xs border-white/30 text-white hover:bg-white/10 hover:border-white/50" onClick={() => {
            setMessage('Muéstrame mi progreso');
            setTimeout(() => handleSendMessage(), 100);
          }}>
              📈 Ver mi progreso
            </Button>
          </div>
        </div>

        {/* Message Input */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-t-none shadow-lg">
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 relative">
                <Input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Pregúntame sobre tus finanzas..." className="bg-white border-gray-300 text-gray-900 focus:border-purple-500 pr-12" />
                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
              
              <Button onClick={handleSendMessage} disabled={!message.trim()} className="bg-gradient-primary text-white hover:scale-105 transition-all glow-primary">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center mt-3">
              <span className="text-[10px] text-gray-600 text-center">🤖 Respuesta instantánea con IA • 🔐 Datos 100% seguros</span>
            </div>
          </div>
        </Card>
      </div>
    </div>;
};
export default ChatInterface;