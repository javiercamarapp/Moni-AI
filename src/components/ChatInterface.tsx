import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, Mic, ArrowLeft, Circle } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import moniLogo from '@/assets/moni-ai-logo.png';
const ChatInterface = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
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
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoplayPlugin = useRef(Autoplay({
    delay: 3000,
    stopOnInteraction: true
  }));
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
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
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  useEffect(() => {
    if (user && messages.length === 0) {
      loadPersonalizedSuggestions();
    }
  }, [user, messages.length]);
  const loadPersonalizedSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const {
        data: functionData,
        error: functionError
      } = await supabase.functions.invoke('financial-analysis', {
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
        setSuggestionCards([{
          title: "Analizar mis gastos",
          subtitle: "del mes actual"
        }, {
          title: "Ver mi progreso",
          subtitle: "de ahorro"
        }, {
          title: "Crear una meta",
          subtitle: "de ahorro"
        }, {
          title: "Revisar mi presupuesto",
          subtitle: "mensual"
        }]);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestionCards([{
        title: "Analizar mis gastos",
        subtitle: "del mes actual"
      }, {
        title: "Ver mi progreso",
        subtitle: "de ahorro"
      }, {
        title: "Crear una meta",
        subtitle: "de ahorro"
      }, {
        title: "Revisar mi presupuesto",
        subtitle: "mensual"
      }]);
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

      // Si el modo de voz está activo, convertir la respuesta a audio
      if (isVoiceActive && assistantMessage) {
        await speakText(assistantMessage);
      }
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
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive"
      });
    }
  };
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) return;
        const {
          data,
          error
        } = await supabase.functions.invoke('transcribe-audio', {
          body: {
            audio: base64Audio
          }
        });
        if (error) throw error;
        if (data?.text) {
          setMessage(data.text);
          setTimeout(() => handleSendMessage(), 100);
        }
      };
    } catch (error) {
      console.error('Error processing voice:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el audio",
        variant: "destructive"
      });
    }
  };
  const toggleVoiceMode = () => {
    setIsVoiceActive(!isVoiceActive);
    if (isVoiceActive) {
      stopVoiceRecording();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
    } else {
      toast({
        title: "Modo de voz activado",
        description: "Tus respuestas serán leídas en voz alta"
      });
    }
  };
  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      const {
        data,
        error
      } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice: 'nova'
        }
      });
      if (error) throw error;
      if (data?.audioContent) {
        const audioBlob = new Blob([Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))], {
          type: 'audio/mpeg'
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };
        await audio.play();
      }
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
      toast({
        title: "Error",
        description: "No se pudo reproducir el audio",
        variant: "destructive"
      });
    }
  };
  return <div className="flex flex-col h-screen animated-wave-bg text-white">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-4 relative border-b border-border/30 bg-card/50 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="absolute left-4 text-foreground hover:bg-accent/50 p-2 transition-all hover:scale-105">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3 fade-in-up">
          
          <span className="text-xl font-semibold text-foreground">MONI AI+</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4">
        {messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center pb-32">
            
            <h1 className="text-3xl font-normal text-foreground text-center fade-in-up">¿En qué puedo ayudarte hoy?</h1>
          </div> : <div className="py-6 space-y-6">
            {messages.map((msg, index) => <div key={msg.id} className="space-y-2 fade-in-up" style={{
          animationDelay: `${index * 0.1}s`
        }}>
                <div className="flex items-center gap-2">
                  {msg.type === 'ai' ? <div className="w-7 h-7 rounded-full bg-gradient-card flex items-center justify-center flex-shrink-0 shadow-glow border border-border/50 hover-lift p-1">
                      <img src={moniLogo} alt="AI" className="w-full h-full object-contain" />
                    </div> : <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border/50 hover-lift">
                      <span className="text-xs font-medium text-foreground">Tú</span>
                    </div>}
                  <span className="text-sm font-medium text-muted-foreground">
                    {msg.type === 'ai' ? 'MONI AI+' : 'Tú'}
                  </span>
                </div>
                <div className="pl-9">
                  <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>)}

            {isTyping && <div className="space-y-2 fade-in-up">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-card flex items-center justify-center flex-shrink-0 shadow-glow border border-border/50 pulse-subtle p-1">
                    <img src={moniLogo} alt="AI" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">MONI AI+</span>
                </div>
                <div className="pl-9">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{
                animationDelay: '0.2s'
              }} />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{
                animationDelay: '0.4s'
              }} />
                  </div>
                </div>
              </div>}

            <div ref={messagesEndRef} />
          </div>}
      </div>

      {/* Input Area */}
      <div className="px-4 pb-8 pt-4">
        {messages.length === 0 && suggestionCards.length > 0 && <div className="mb-4 relative">
            <Carousel opts={{
          align: "start",
          loop: true
        }} plugins={[autoplayPlugin.current]} className="w-full max-w-full" onMouseEnter={() => autoplayPlugin.current.stop()} onMouseLeave={() => autoplayPlugin.current.play()}>
              <CarouselContent className="-ml-2">
                {suggestionCards.map((card, index) => <CarouselItem key={index} className="pl-2 basis-[85%] sm:basis-[45%]">
                    <button onClick={() => handleSuggestionClick(card.title)} className="w-full bg-card hover:bg-card/80 rounded-2xl p-4 text-left transition-all border border-border/30 hover-lift shadow-card hover:shadow-glow">
                      <h3 className="text-foreground font-medium text-sm mb-1">
                        {card.title}
                      </h3>
                      <p className="text-muted-foreground text-xs">
                        {card.subtitle}
                      </p>
                    </button>
                  </CarouselItem>)}
              </CarouselContent>
            </Carousel>
          </div>}

        <div className="flex items-center gap-2 bg-card rounded-[30px] px-4 py-3 shadow-elegant border border-border/30 hover:border-border/50 transition-all">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex-shrink-0 h-8 w-8 p-0 transition-all hover:scale-110">
            <Plus className="w-5 h-5" />
          </Button>

          <Input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Pregunta lo que quieras" className="flex-1 bg-transparent border-0 text-foreground text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-8" />

          <Button variant="ghost" size="icon" onClick={handleSendMessage} disabled={!message.trim()} className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex-shrink-0 h-8 w-8 p-0 disabled:opacity-30 transition-all hover:scale-110">
            <Send className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={isRecording ? stopVoiceRecording : startVoiceRecording} className={`flex-shrink-0 h-8 w-8 p-0 transition-all hover:scale-110 ${isRecording ? 'text-destructive hover:text-destructive/80 animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
            <Mic className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleVoiceMode} disabled={isSpeaking} className={`flex-shrink-0 h-8 w-8 p-0 rounded-full transition-all hover:scale-110 ${isVoiceActive ? 'bg-gradient-primary text-foreground shadow-glow hover:shadow-elegant' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'} ${isSpeaking ? 'animate-pulse' : ''}`}>
            <Circle className={`w-4 h-4 ${isVoiceActive ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-3">Verifica la información importante.</p>
      </div>
    </div>;
};
export default ChatInterface;