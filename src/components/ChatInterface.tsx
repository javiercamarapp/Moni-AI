import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, Mic, ArrowLeft, Circle, Paperclip, TrendingUp, Calculator, PiggyBank, Lightbulb, Target, Receipt, Sparkles, Camera } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Autoplay from 'embla-carousel-autoplay';
import moniLogo from '@/assets/moni-ai-logo.png';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
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
    files?: Array<{name: string; type: string; data: string}>;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string; type: string; data: string}>>([]);
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
      // Mostrar sugerencias inmediatamente
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
      
      // Cargar sugerencias personalizadas en segundo plano
      loadPersonalizedSuggestions();
    }
  }, [user, messages.length]);
  const loadPersonalizedSuggestions = async () => {
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
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      // Mantener las sugerencias predeterminadas si hay error
    }
  };
  const handleSendMessage = async () => {
    if (!message.trim() && uploadedFiles.length === 0) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message.trim() || "Analiza este archivo",
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setUploadedFiles([]);
    setIsTyping(true);
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const conversationHistory = [...messages, userMessage].map(msg => {
        const messageContent: any = { 
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: []
        };
        
        // Add text content
        if (msg.content) {
          messageContent.content.push({
            type: 'text',
            text: msg.content
          });
        }
        
        // Add files if present
        if (msg.files && msg.files.length > 0) {
          msg.files.forEach(file => {
            if (file.type.startsWith('image/')) {
              messageContent.content.push({
                type: 'image_url',
                image_url: {
                  url: file.data
                }
              });
            } else {
              messageContent.content.push({
                type: 'text',
                text: `[Archivo adjunto: ${file.name}]`
              });
            }
          });
        }
        
        return messageContent;
      });
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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} supera el límite de 10MB`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    try {
      const filePromises = validFiles.map(file => {
        return new Promise<{name: string; type: string; data: string}>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve({
              name: file.name,
              type: file.type,
              data: base64
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const loadedFiles = await Promise.all(filePromises);
      setUploadedFiles(prev => [...prev, ...loadedFiles]);
      
      // Auto-analizar si es una imagen (potencial ticket)
      const imageFiles = loadedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        toast({
          title: "Analizando ticket...",
          description: "La IA está procesando tu imagen"
        });
        
        // Analizar el primer archivo de imagen
        const imageFile = imageFiles[0];
        await analyzeReceipt(imageFile);
      } else {
        toast({
          title: "Archivos cargados",
          description: `${loadedFiles.length} archivo(s) listo(s) para enviar`
        });
      }
    } catch (error) {
      console.error('Error reading files:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar algunos archivos",
        variant: "destructive"
      });
    }

    // Reset input
    e.target.value = '';
  };

  const analyzeReceipt = async (imageFile: {name: string; type: string; data: string}) => {
    try {
      setIsTyping(true);
      
      // Extraer base64 puro (sin el prefijo data:image/...)
      const base64Data = imageFile.data.split(',')[1];
      
      const { data, error } = await supabase.functions.invoke('analyze-receipt', {
        body: {
          imageBase64: base64Data,
          userId: user?.id
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        const { receiptData, transaction } = data;
        
        // Agregar mensaje de éxito al chat
        const successMessage = {
          id: Date.now(),
          type: 'ai',
          content: `✅ **Ticket analizado exitosamente**\n\n` +
                   `💰 **Monto:** $${receiptData.amount.toFixed(2)}\n` +
                   `📝 **Descripción:** ${receiptData.description}\n` +
                   `🏷️ **Categoría:** ${receiptData.category}\n` +
                   `📅 **Fecha:** ${new Date(receiptData.date).toLocaleDateString('es-MX')}\n\n` +
                   `La transacción ha sido guardada en tu historial.`
        };
        
        setMessages(prev => [...prev, successMessage]);
        
        toast({
          title: "¡Ticket procesado!",
          description: `$${receiptData.amount} en ${receiptData.category}`,
        });
      }
      
      setIsTyping(false);
      setUploadedFiles([]);
      
    } catch (error: any) {
      console.error('Error analyzing receipt:', error);
      setIsTyping(false);
      
      toast({
        title: "Error al analizar ticket",
        description: error.message || "No se pudo procesar el ticket. Intenta de nuevo.",
        variant: "destructive"
      });
      
      // Mantener el archivo para que el usuario pueda enviarlo manualmente al chat
      setUploadedFiles([]);
    }
  };

  const openCamera = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        const imageFile = {
          name: `ticket_${Date.now()}.jpg`,
          type: 'image/jpeg',
          data: image.dataUrl
        };
        
        toast({
          title: "Analizando ticket...",
          description: "La IA está procesando tu foto"
        });
        
        await analyzeReceipt(imageFile);
      }
    } catch (error: any) {
      console.error('Error opening camera:', error);
      
      // Si el error es porque el usuario canceló, no mostrar error
      if (error.message && error.message.includes('User cancelled')) {
        return;
      }
      
      toast({
        title: "Error al abrir cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
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
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/dashboard")} 
          className="absolute left-4 text-foreground hover:bg-accent/50 transition-all hover:scale-110 hover-lift fade-in-up rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 fade-in-up">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden w-16 h-10">
            <img src={moniLogo} alt="Moni" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4">
        {messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center pb-32">
            
            <h1 className="text-2xl sm:text-3xl font-normal text-foreground text-center fade-in-up px-4">¿En qué puedo ayudarte hoy?</h1>
          </div> : <div className="py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            {messages.map((msg, index) => <div key={msg.id} className="fade-in-up" style={{
          animationDelay: `${index * 0.1}s`
        }}>
                <div className="flex items-start gap-2 sm:gap-3 mb-2">
                  {msg.type === 'ai' ? <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-card flex items-center justify-center flex-shrink-0 shadow-glow border border-border/50 hover-lift p-1 mt-0.5">
                      <img src={moniLogo} alt="AI" className="w-full h-full object-contain" />
                    </div> : <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border/50 hover-lift mt-0.5">
                      <span className="text-xs font-medium text-foreground">Tú</span>
                    </div>}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1.5">
                      {msg.type === 'ai' ? 'MONI AI+' : 'Tú'}
                    </span>
                    
                    {msg.files && msg.files.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {msg.files.map((file, idx) => (
                          <div key={idx} className="bg-muted/50 rounded-lg overflow-hidden border border-border/30">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={file.data} 
                                alt={file.name} 
                                className="max-w-full w-auto h-auto max-h-[200px] sm:max-h-[300px] rounded object-contain"
                              />
                            ) : (
                              <div className="p-2">
                                <span className="text-muted-foreground text-xs">📎 {file.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {msg.content && (
                      <div className="bg-card/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 border border-border/20">
                        <p className="text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>)}

            {isTyping && <div className="fade-in-up">
                <div className="flex items-start gap-2 sm:gap-3 mb-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-card flex items-center justify-center flex-shrink-0 shadow-glow border border-border/50 pulse-subtle p-1 mt-0.5">
                    <img src={moniLogo} alt="AI" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1.5">MONI AI+</span>
                    <div className="bg-card/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 border border-border/20 inline-block">
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

        {uploadedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="bg-card rounded-lg overflow-hidden border border-border/30 relative group">
                {file.type.startsWith('image/') ? (
                  <div className="relative">
                    <img 
                      src={file.data} 
                      alt={file.name} 
                      className="max-w-[200px] max-h-[200px] object-cover rounded"
                    />
                    <button 
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1">
                      <p className="text-xs text-white truncate">{file.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2">
                    <span className="text-muted-foreground text-xs">📎 {file.name}</span>
                    <button 
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-destructive hover:text-destructive/80 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2 bg-card rounded-[30px] px-2 sm:px-4 py-2.5 sm:py-3 shadow-elegant border border-border/30 hover:border-border/50 transition-all">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0 transition-all hover:scale-110"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-72 z-50 bg-popover backdrop-blur-md border-border/50 shadow-elegant"
            >
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Paperclip className="w-5 h-5" />
                <span className="font-medium">Adjuntar archivo o foto</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onSelect={(e) => {
                  e.preventDefault();
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (event) => {
                    const target = event.target as HTMLInputElement;
                    if (target.files && target.files[0]) {
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64 = reader.result as string;
                        const imageFile = {
                          name: target.files![0].name,
                          type: target.files![0].type,
                          data: base64
                        };
                        await analyzeReceipt(imageFile);
                      };
                      reader.readAsDataURL(target.files[0]);
                    }
                  };
                  input.click();
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Receipt className="w-5 h-5 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium">Escanear ticket</span>
                  <span className="text-xs text-muted-foreground">La IA detectará y guardará el gasto</span>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => {
                  setMessage("Crea gráficas financieras de mis gastos e ingresos del último mes");
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Crea gráficas financieras</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  setMessage("Ayúdame a crear un presupuesto mensual personalizado");
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Calculator className="w-5 h-5" />
                <span>Crea un presupuesto</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  setMessage("Crea estimaciones de ahorro basadas en mis hábitos financieros");
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <PiggyBank className="w-5 h-5" />
                <span>Crea estimaciones de ahorro</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  setMessage("Analiza mis transacciones recientes y sugiere oportunidades de ahorro");
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Lightbulb className="w-5 h-5" />
                <span>Optimiza mis gastos</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  setMessage("Ayúdame a definir metas financieras inteligentes y alcanzables");
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Target className="w-5 h-5" />
                <span>Define metas financieras</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  setMessage("Detecta gastos innecesarios y patrones de gasto preocupantes");
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Receipt className="w-5 h-5" />
                <span>Detecta gastos innecesarios</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => {
                  setMessage("Proyecta mi situación financiera a 6 meses basándote en mis hábitos actuales");
                  setTimeout(() => handleSendMessage(), 100);
                }}
                className="flex items-center gap-3 py-3 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>Proyecta mi futuro financiero</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Pregunta..." className="flex-1 bg-transparent border-0 text-foreground text-sm sm:text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-1.5 sm:px-3 h-7 sm:h-8" />

          <Button variant="ghost" size="icon" onClick={handleSendMessage} disabled={!message.trim() && uploadedFiles.length === 0} className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex-shrink-0 h-8 w-8 p-0 disabled:opacity-30 transition-all hover:scale-110">
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={openCamera} className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex-shrink-0 h-8 w-8 p-0 transition-all hover:scale-110">
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={isRecording ? stopVoiceRecording : startVoiceRecording} className={`flex-shrink-0 h-8 w-8 p-0 transition-all hover:scale-110 ${isRecording ? 'text-destructive hover:text-destructive/80 animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleVoiceMode} disabled={isSpeaking} className={`flex-shrink-0 h-8 w-8 p-0 rounded-full transition-all hover:scale-110 ${isVoiceActive ? 'bg-gradient-primary text-foreground shadow-glow hover:shadow-elegant' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'} ${isSpeaking ? 'animate-pulse' : ''}`}>
            <Circle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isVoiceActive ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-3">Verifica la información importante.</p>
      </div>
    </div>;
};
export default ChatInterface;