import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, Mic, ArrowLeft, Circle, Paperclip, TrendingUp, Calculator, PiggyBank, Lightbulb, Target, Receipt, Sparkles, Camera, X, Check } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Autoplay from 'embla-carousel-autoplay';
import moniLogo from '@/assets/moni-ai-logo.png';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PulseBeams } from '@/components/ui/pulse-beams';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AIVoiceInput } from '@/components/ui/ai-voice-input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SiriOrb } from '@/components/ui/siri-orb';
import { AudioWaveVisualizer } from '@/components/ui/audio-wave-visualizer';
import { cn } from '@/lib/utils';

// Function to remove asterisks from text
const removeAsterisks = (text: string): string => {
  return text.replace(/\*/g, '');
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
    toolCall?: {
      type: 'tabla' | 'grafica';
      data: any;
    };
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
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRecordingRef = useRef<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string; type: string; data: string}>>([]);
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
          messages: conversationHistory,
          userId: user?.id
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
      let currentToolCall: any = null;
      
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
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
            
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.type === 'ai' && last.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? {
                    ...m,
                    content: assistantMessage,
                    toolCall: currentToolCall
                  } : m);
                }
                return [...prev, {
                  id: assistantId,
                  type: 'ai',
                  content: assistantMessage,
                  toolCall: currentToolCall
                }];
              });
            }
            
            if (toolCalls && toolCalls[0]?.function?.name && toolCalls[0]?.function?.arguments) {
              try {
                const funcName = toolCalls[0].function.name;
                const args = JSON.parse(toolCalls[0].function.arguments);
                
                if (funcName === 'generar_tabla') {
                  currentToolCall = { type: 'tabla' as const, data: args };
                } else if (funcName === 'generar_grafica') {
                  currentToolCall = { type: 'grafica' as const, data: args };
                }
                
                if (currentToolCall) {
                  setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.type === 'ai' && last.id === assistantId) {
                      return prev.map((m, i) => i === prev.length - 1 ? {
                        ...m,
                        toolCall: currentToolCall
                      } : m);
                    }
                    return [...prev, {
                      id: assistantId,
                      type: 'ai',
                      content: assistantMessage,
                      toolCall: currentToolCall
                    }];
                  });
                }
              } catch (parseError) {
                console.error('Error parsing tool call:', parseError);
              }
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
      console.log('🎤 Solicitando acceso al micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      console.log('✅ Acceso al micrófono concedido');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          console.log('📊 Audio chunk recibido:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('🛑 Grabación detenida, guardando audio...');
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        });
        console.log('📦 Blob de audio creado:', audioBlob.size, 'bytes');
        audioRecordingRef.current = audioBlob;
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      console.log('🔴 Grabación iniciada');
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Verifica los permisos.",
        variant: "destructive"
      });
    }
  };
  
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Deteniendo grabación...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  const handleVoiceToggle = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      setIsVoiceChatOpen(true);
      startVoiceRecording();
    }
  };
  
  const openVoiceChat = () => {
    setIsVoiceChatOpen(true);
    startVoiceRecording();
  };
  
  const closeVoiceChat = () => {
    setIsVoiceChatOpen(false);
    stopVoiceRecording();
  };
  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      console.log('🔄 Procesando entrada de voz...', 'Tamaño del blob:', audioBlob.size, 'bytes');
      
      if (audioBlob.size === 0) {
        console.error('❌ El blob de audio está vacío');
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (!base64Audio) {
            console.error('❌ No se pudo convertir audio a base64');
            return;
          }
          
          console.log('📤 Enviando audio a transcribir... (tamaño base64:', base64Audio.length, 'caracteres)');
          
          const {
            data,
            error
          } = await supabase.functions.invoke('transcribe-audio', {
            body: {
              audio: base64Audio
            }
          });
          
          if (error) {
            console.error('❌ Error en transcripción:', error);
            return;
          }
          
          if (data?.text && data.text.trim()) {
            console.log('✅ Texto transcrito:', data.text);
            
            if (isVoiceChatMode) {
              // En modo de chat por voz, enviar directamente
              const userMessage = {
                id: Date.now(),
                type: 'user',
                content: data.text
              };
              setMessages(prev => [...prev, userMessage]);
              
              // Enviar a AI automáticamente
              setIsTyping(true);
              sendToAI([...messages, userMessage]);
            } else {
              // Modo regular - llenar el input
              setMessage(data.text);
              setTimeout(() => handleSendMessage(), 100);
            }
          }
        } catch (innerError) {
          console.error('❌ Error en el procesamiento:', innerError);
        }
      };
      
      reader.onerror = () => {
        console.error('❌ Error al leer el archivo de audio');
      };
    } catch (error) {
      console.error('❌ Error processing voice:', error);
    }
  };
  
  const handleConfirmVoiceRecording = async () => {
    console.log('✅ Confirmando grabación...', 'Audio disponible:', !!audioRecordingRef.current);
    if (audioRecordingRef.current) {
      await processVoiceInput(audioRecordingRef.current);
      audioRecordingRef.current = null;
    } else {
      console.error('❌ No hay audio grabado en audioRecordingRef');
      toast({
        title: "Error",
        description: "No se encontró audio grabado. Intenta grabar de nuevo.",
        variant: "destructive"
      });
    }
    closeVoiceChat();
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
        // Analizar el primer archivo de imagen
        const imageFile = imageFiles[0];
        await analyzeReceipt(imageFile);
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

  const toggleVoiceMode = async () => {
    if (isVoiceChatMode) {
      // Detener modo de chat por voz en tiempo real
      stopRealtimeVoiceChat();
    } else {
      // Iniciar modo de chat por voz en tiempo real
      await startRealtimeVoiceChat();
    }
  };

  // Nuevo sistema de chat de voz en tiempo real
  const startRealtimeVoiceChat = async () => {
    try {
      console.log('🎤 Iniciando chat de voz en tiempo real...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setIsVoiceChatMode(true);
      setIsVoiceActive(true);
      setIsListening(true);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Procesar audio en tiempo real
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && !isSpeaking) {
          console.log('🎙️ Chunk de audio capturado:', event.data.size, 'bytes');
          
          // Transcribir inmediatamente cada chunk si tiene suficiente tamaño
          const audioBlob = new Blob([event.data], { type: 'audio/webm' });
          if (audioBlob.size > 3000) {
            console.log('✅ Chunk suficientemente grande, transcribiendo...');
            await transcribeRealtimeChunk(audioBlob);
          } else {
            console.log('⏭️ Chunk muy pequeño, esperando más audio...');
          }
        }
      };

      // Capturar audio en chunks de 2 segundos para mejor calidad
      mediaRecorder.start(2000);
      console.log('✅ Grabación iniciada con chunks de 2 segundos');

    } catch (error) {
      console.error('Error al iniciar chat de voz:', error);
      setIsVoiceChatMode(false);
      setIsVoiceActive(false);
    }
  };

  const transcribeRealtimeChunk = async (audioBlob: Blob) => {
    if (isProcessingVoice || isSpeaking) {
      console.log('⏸️ Transcripción en pausa (procesando o AI hablando)');
      return;
    }
    
    try {
      setIsProcessingVoice(true);
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) {
          console.error('❌ No se pudo convertir audio a base64');
          setIsProcessingVoice(false);
          return;
        }
        
        console.log('📤 Transcribiendo chunk de audio... (tamaño base64:', base64Audio.length, 'caracteres)');
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });
        
        if (error) {
          console.error('❌ Error en transcripción:', error);
          setIsProcessingVoice(false);
          return;
        }
        
        if (data?.text && data.text.trim()) {
          const newText = data.text.trim();
          console.log('✅ Texto transcrito:', newText);
          
          // Agregar al mensaje actual
          setCurrentUserMessage(prev => {
            const updated = prev ? `${prev} ${newText}` : newText;
            console.log('📝 Mensaje actualizado:', updated);
            
            // Crear o actualizar mensaje del usuario en tiempo real
            setMessages(prevMessages => {
              const lastMsg = prevMessages[prevMessages.length - 1];
              
              if (lastMsg?.type === 'user' && !lastMsg.toolCall) {
                console.log('✏️ Actualizando último mensaje de usuario');
                // Actualizar último mensaje de usuario
                return prevMessages.map((m, i) => 
                  i === prevMessages.length - 1 ? { ...m, content: updated } : m
                );
              } else {
                console.log('➕ Creando nuevo mensaje de usuario');
                // Crear nuevo mensaje de usuario
                return [...prevMessages, {
                  id: Date.now(),
                  type: 'user',
                  content: updated
                }];
              }
            });
            
            return updated;
          });
          
          // Reiniciar timeout para enviar mensaje
          if (voiceTimeoutRef.current) {
            clearTimeout(voiceTimeoutRef.current);
          }
          
          voiceTimeoutRef.current = setTimeout(() => {
            console.log('⏱️ Timeout alcanzado, enviando mensaje...');
            sendCurrentVoiceMessage();
          }, 3000); // Enviar después de 3 segundos de silencio
        } else {
          console.log('⚠️ No se recibió texto de la transcripción');
        }
        
        setIsProcessingVoice(false);
      };
    } catch (error) {
      console.error('❌ Error transcribiendo chunk:', error);
      setIsProcessingVoice(false);
    }
  };

  const sendCurrentVoiceMessage = async () => {
    if (!currentUserMessage.trim() || isSpeaking) return;
    
    console.log('📨 Enviando mensaje completo a la AI:', currentUserMessage);
    
    const messageToSend = currentUserMessage;
    setCurrentUserMessage('');
    
    // Enviar a la AI con el mensaje completo
    setIsTyping(true);
    
    const fullMessages = [...messages];
    const lastMsg = fullMessages[fullMessages.length - 1];
    
    // Asegurar que el último mensaje tenga el contenido completo
    if (lastMsg?.type === 'user') {
      lastMsg.content = messageToSend;
    }
    
    await sendToAI(fullMessages);
  };

  const stopRealtimeVoiceChat = () => {
    console.log('🛑 Deteniendo chat de voz en tiempo real...');
    
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsVoiceChatMode(false);
    setIsVoiceActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentUserMessage('');
  };


  const sendToAI = async (conversationHistory: Array<any>) => {
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      
      const formattedMessages = conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: [{
          type: 'text',
          text: msg.content
        }]
      }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: formattedMessages,
          userId: user?.id
        })
      });

      if (!resp.ok || !resp.body) {
        throw new Error('Failed to get response');
      }

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
            // Ignorar errores de parsing
          }
        }
      }
      
      setIsTyping(false);
      
      // En modo de chat por voz, hablar la respuesta y reiniciar escucha
      if (isVoiceChatMode && assistantMessage) {
        await speakText(assistantMessage);
        // Reiniciar la escucha después de que termine de hablar
        if (isVoiceChatMode) {
          setTimeout(() => {
            setIsListening(true);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error al enviar a AI:', error);
      setIsTyping(false);
      toast({
        title: "Error",
        description: "No se pudo obtener respuesta",
        variant: "destructive"
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
  const beamPaths = [
    {
      path: "M50,200 Q200,100 400,200 T750,200",
      gradientConfig: {
        initial: { x1: "0", x2: "100%", y1: "0", y2: "0" },
        animate: {
          x1: ["0", "100%", "0"],
          x2: ["100%", "200%", "100%"],
          y1: ["0", "50%", "0"],
          y2: ["0", "50%", "0"],
        },
        transition: { duration: 6, repeat: Infinity, ease: "linear" }
      }
    },
    {
      path: "M100,350 Q300,250 500,350 T800,350",
      gradientConfig: {
        initial: { x1: "0", x2: "100%", y1: "0", y2: "0" },
        animate: {
          x1: ["100%", "0", "100%"],
          x2: ["200%", "100%", "200%"],
          y1: ["0", "50%", "0"],
          y2: ["0", "50%", "0"],
        },
        transition: { duration: 8, repeat: Infinity, ease: "linear", delay: 1 }
      }
    },
    {
      path: "M0,100 Q250,50 450,150 T850,100",
      gradientConfig: {
        initial: { x1: "0", x2: "100%", y1: "0", y2: "0" },
        animate: {
          x1: ["0", "100%", "0"],
          x2: ["100%", "200%", "100%"],
          y1: ["0", "30%", "0"],
          y2: ["0", "30%", "0"],
        },
        transition: { duration: 7, repeat: Infinity, ease: "linear", delay: 2 }
      }
    }
  ];

  return <PulseBeams 
    beams={beamPaths}
    background={<div className="absolute inset-0 animated-wave-bg" />}
    className="text-white"
  >
    <div className="flex flex-col h-screen relative z-10">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all border-0 h-10 w-10 p-0 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
            </Button>
            <div className="flex-1 flex items-center gap-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden w-16 h-10">
                <img src={moniLogo} alt="Moni" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Moni AI</h1>
                <p className="text-xs text-gray-600">Tu asistente financiero</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4">
        {messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center pb-32">
          </div> : <div className="py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            {messages.map((msg, index) => <div key={msg.id} className="fade-in-up" style={{
          animationDelay: `${index * 0.1}s`
        }}>
                <div className={`flex items-start gap-2 sm:gap-3 mb-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.type === 'ai' ? <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-card flex items-center justify-center flex-shrink-0 shadow-glow border border-border/50 hover-lift p-1 mt-0.5">
                      <img src={moniLogo} alt="AI" className="w-full h-full object-contain" />
                    </div> : <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border/50 hover-lift mt-0.5">
                      <span className="text-xs font-medium text-foreground">Tú</span>
                    </div>}
                  <div className={`flex-1 min-w-0 ${msg.type === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <span className={`text-xs sm:text-sm font-medium text-muted-foreground block mb-1.5 ${msg.type === 'user' ? 'text-right' : ''}`}>
                      {msg.type === 'ai' ? 'MONI AI+' : 'Tú'}
                    </span>
                    
                    {msg.files && msg.files.length > 0 && (
                      <div className={`mb-2 flex flex-wrap gap-2 ${msg.type === 'user' ? 'justify-end' : ''}`}>
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
                      <div className={`bg-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 border border-blue-100 shadow-lg ${msg.type === 'user' ? 'max-w-[85%]' : ''}`}>
                        <p className="text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                          {removeAsterisks(msg.content)}
                        </p>
                      </div>
                    )}
                    
                    {msg.toolCall && msg.toolCall.type === 'tabla' && (
                      <div className="bg-white rounded-[20px] p-4 sm:p-6 border border-blue-100 shadow-xl mt-2 animate-fade-in">
                        <h3 className="font-bold text-lg sm:text-xl mb-4 text-foreground">{msg.toolCall.data.titulo}</h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-border/30">
                                {msg.toolCall.data.columnas.map((col: string, idx: number) => (
                                  <TableHead key={idx} className="font-bold text-foreground bg-muted/30">{col}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {msg.toolCall.data.filas.map((fila: string[], idx: number) => (
                                <TableRow key={idx} className="border-border/20 hover:bg-muted/20 transition-colors">
                                  {fila.map((celda: string, cellIdx: number) => (
                                    <TableCell key={cellIdx} className="text-foreground">{celda}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    
                    {msg.toolCall && msg.toolCall.type === 'grafica' && (
                      <div className="bg-white rounded-[20px] p-4 sm:p-6 border border-blue-100 shadow-xl mt-2 animate-fade-in">
                        <div className="mb-4">
                          <h3 className="font-bold text-lg sm:text-xl text-foreground">{msg.toolCall.data.titulo}</h3>
                          {msg.toolCall.data.datos && msg.toolCall.data.datos.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                              <span className="text-muted-foreground">
                                Total: <span className="font-bold text-foreground">
                                  ${msg.toolCall.data.datos.reduce((sum: number, item: any) => sum + item.valor, 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                              </span>
                              <span className="text-muted-foreground">
                                Promedio: <span className="font-bold text-foreground">
                                  ${(msg.toolCall.data.datos.reduce((sum: number, item: any) => sum + item.valor, 0) / msg.toolCall.data.datos.length).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                          {msg.toolCall.data.tipo === 'barras' ? (
                            <BarChart data={msg.toolCall.data.datos}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                              <XAxis 
                                dataKey="nombre" 
                                stroke="hsl(var(--foreground))" 
                                tick={{ fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis 
                                stroke="hsl(var(--foreground))" 
                                tick={{ fontSize: 11 }}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value: any) => [`$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Monto']}
                                labelFormatter={(label) => `📅 ${label}`}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          ) : msg.toolCall.data.tipo === 'linea' ? (
                            <LineChart data={msg.toolCall.data.datos}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                              <XAxis 
                                dataKey="nombre" 
                                stroke="hsl(var(--foreground))" 
                                tick={{ fontSize: 11 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis 
                                stroke="hsl(var(--foreground))" 
                                tick={{ fontSize: 11 }}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value: any) => [`$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Monto']}
                                labelFormatter={(label) => `📅 ${label}`}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                          ) : (
                            <PieChart>
                              <Pie
                                data={msg.toolCall.data.datos}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ nombre, percent }) => `${nombre}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="valor"
                              >
                                {msg.toolCall.data.datos.map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }} 
                                formatter={(value: any) => [`$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Monto']}
                              />
                            </PieChart>
                          )}
                        </ResponsiveContainer>
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
                    <div className="bg-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 border border-blue-100 shadow-lg inline-block">
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

        {isVoiceChatOpen ? (
          /* Voice Recording Interface - Replaces bottom bar */
          <div className="flex items-center gap-1.5 sm:gap-3 bg-card rounded-[30px] px-2 sm:px-4 py-2 sm:py-3.5 shadow-elegant border border-border/30 hover:border-border/50 transition-all">
            <AudioWaveVisualizer 
              isRecording={isRecording} 
              bars={25}
              className="flex-1 h-6 sm:h-8"
            />

            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleConfirmVoiceRecording}
              className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex-shrink-0 transition-all"
            >
              <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                audioRecordingRef.current = null;
                closeVoiceChat();
              }}
              className="h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex-shrink-0 transition-all"
            >
              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </Button>
          </div>
        ) : (
          /* Normal Chat Input */
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

          <Button variant="ghost" size="icon" onClick={handleVoiceToggle} className={`flex-shrink-0 h-8 w-8 p-0 transition-all hover:scale-110 text-muted-foreground hover:text-foreground hover:bg-accent/50`}>
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleVoiceMode} 
            className={`flex-shrink-0 h-10 w-10 p-0 rounded-full transition-all hover:scale-110 ${
              isVoiceChatMode 
                ? 'bg-gradient-primary text-white shadow-glow hover:shadow-elegant animate-pulse' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            {isVoiceChatMode ? (
              <div className="relative flex items-center justify-center w-full h-full">
                <Circle className="w-6 h-6 fill-current" />
                {isListening && !isSpeaking && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                  </div>
                )}
              </div>
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </Button>
        </div>
        )}
        
        <p className="text-center text-xs text-muted-foreground mt-3">Verifica la información importante.</p>
      </div>

      {/* Voice Recording Modal - Mini Version - Hidden when full voice chat is active */}
      {!isVoiceChatOpen && (
        <Dialog open={isRecording && !isVoiceChatOpen} onOpenChange={(open) => !open && stopVoiceRecording()}>
          <DialogContent className="sm:max-w-md max-w-[90vw] border-none bg-background/95 backdrop-blur-sm p-2">
            <AIVoiceInput 
              onStart={() => console.log('Grabación iniciada')}
              onStop={(duration) => console.log('Grabación detenida:', duration)}
              className="py-2"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  </PulseBeams>;
};
export default ChatInterface;