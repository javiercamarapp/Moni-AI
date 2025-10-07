import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, Menu, Mic, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import moniLogo from '@/assets/moni-ai-logo.png';

const ChatInterface = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: number;
    type: string;
    content: string;
  }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestionCards, setSuggestionCards] = useState<Array<{
    title: string;
    subtitle: string;
  }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

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

  useEffect(() => {
    if (user && messages.length === 0) {
      loadPersonalizedSuggestions();
    }
  }, [user, messages.length]);

  const loadPersonalizedSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('financial-analysis', {
        body: { 
          type: 'suggestions',
          userId: user?.id 
        }
      });

      if (functionError) throw functionError;

      if (functionData?.suggestions) {
        setSuggestionCards(functionData.suggestions);
      } else {
        // Fallback suggestions
        setSuggestionCards([
          { title: "Analizar mis gastos", subtitle: "del mes actual" },
          { title: "Ver mi progreso", subtitle: "de ahorro" },
          { title: "Crear una meta", subtitle: "de ahorro" },
          { title: "Revisar mi presupuesto", subtitle: "mensual" }
        ]);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestionCards([
        { title: "Analizar mis gastos", subtitle: "del mes actual" },
        { title: "Ver mi progreso", subtitle: "de ahorro" },
        { title: "Crear una meta", subtitle: "de ahorro" },
        { title: "Revisar mi presupuesto", subtitle: "mensual" }
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
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

  const handleSuggestionClick = (title: string) => {
    setMessage(title);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-gray-900 p-2"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl font-medium">MONI AI+</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center pb-32">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-8">
              <img src={moniLogo} alt="MONI AI+" className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-semibold text-white mb-2">¿En qué puedo ayudarte hoy?</h1>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {msg.type === 'ai' ? (
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <img src={moniLogo} alt="AI" className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                      <span className="text-xs font-medium">Tú</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-400">
                    {msg.type === 'ai' ? 'MONI AI+' : 'Tú'}
                  </span>
                </div>
                <div className="pl-8">
                  <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <img src={moniLogo} alt="AI" className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-400">MONI AI+</span>
                </div>
                <div className="pl-8">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-8 pt-4">
        {messages.length === 0 && suggestionCards.length > 0 && (
          <div className="mb-4 relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[autoplayPlugin.current]}
              className="w-full max-w-full"
              onMouseEnter={() => autoplayPlugin.current.stop()}
              onMouseLeave={() => autoplayPlugin.current.play()}
            >
              <CarouselContent className="-ml-2">
                {suggestionCards.map((card, index) => (
                  <CarouselItem key={index} className="pl-2 basis-[85%] sm:basis-[45%]">
                    <button
                      onClick={() => handleSuggestionClick(card.title)}
                      className="w-full bg-[#2f2f2f] hover:bg-[#3f3f3f] rounded-2xl p-4 text-left transition-all border border-[#565869]/30"
                    >
                      <h3 className="text-white font-medium text-sm mb-1">
                        {card.title}
                      </h3>
                      <p className="text-gray-400 text-xs">
                        {card.subtitle}
                      </p>
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        <div className="flex items-center gap-2 bg-[#2f2f2f] rounded-[26px] px-4 py-3 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-transparent flex-shrink-0 h-6 w-6 p-0"
          >
            <Plus className="w-5 h-5" />
          </Button>

          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enviar mensaje a MONI AI+"
            className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-6"
          />

          {message.trim() ? (
            <Button
              onClick={handleSendMessage}
              disabled={isTyping}
              size="icon"
              className="bg-white text-black hover:bg-gray-200 rounded-full flex-shrink-0 w-8 h-8 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-transparent flex-shrink-0 h-6 w-6 p-0"
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-3">
          MONI AI+ puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
