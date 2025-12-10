import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Message, Suggestion, AppState } from '@/components/chat/types';
import { sendMessageStream, transcribeAudio, resetChat } from '@/services/geminiService';
import {
  PlusIcon, MicIcon, WaveformIcon, SendIcon, SparklesIcon,
  CameraIcon, ImageIcon, ChartIcon, TelescopeIcon, GlobeIcon,
  BookIcon, UserIcon, PaperclipIcon, WalletIcon, ArrowLeftIcon
} from '@/components/chat/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves } from '@/components/ui/waves-background';
import BottomNav from '@/components/BottomNav';

const SUGGESTIONS: Suggestion[] = [
  { label: 'Valoración de Negocio', subLabel: 'Métodos explicados', prompt: 'Explica métodos comunes de valoración de negocios como DCF y Múltiplos para una pequeña empresa tecnológica.' },
  { label: 'Financiación Startup', subLabel: 'Oportunidades', prompt: '¿Cuáles son las tendencias actuales en financiación de startups para 2024? Seed vs Series A.' },
  { label: 'Flujo de Caja', subLabel: 'Optimización', prompt: '¿Cómo puedo optimizar el flujo de caja para un negocio minorista estacional?' },
  { label: 'Inversión Personal', subLabel: 'Estrategias', prompt: 'Crea una estrategia de inversión personal conservadora para crecimiento a largo plazo.' },
];

const FinancialChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Voice Recording State
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Full Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'listening' | 'processing' | 'speaking'>('listening');
  const silenceTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // File Input Refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 80) + 'px';
    }
  }, [input]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isStreaming) return;

    if (appState === AppState.IDLE) {
      setAppState(AppState.CHATTING);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsStreaming(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'model',
      text: '',
      isThinking: true
    }]);

    try {
      let prompt = textToSend;
      if (isVoiceMode) {
        prompt += " (Responde de manera muy breve y conversacional, ideal para texto a voz).";
      }

      await sendMessageStream(prompt, (streamedText) => {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, text: streamedText, isThinking: false }
            : msg
        ));
      });

      return true;
    } catch (error) {
      setMessages(prev => prev.map(msg =>
        msg.id === aiMessageId
          ? { ...msg, text: "Tuve un pequeño problema de conexión. ¿Podrías repetirlo?", isThinking: false }
          : msg
      ));
      return false;
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, appState, isVoiceMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAction = (prompt: string) => {
    setIsMenuOpen(false);
    handleSend(prompt);
  };

  const handleBack = () => {
    if (messages.length > 0) {
      setMessages([]);
      setAppState(AppState.IDLE);
      resetChat();
    } else {
      navigate(-1);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsMenuOpen(false);
      if (appState === AppState.IDLE) setAppState(AppState.CHATTING);

      const fileMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: `[Archivo adjunto: ${file.name}]`,
      };
      setMessages(prev => [...prev, fileMsg]);

      setIsStreaming(true);
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'model',
        text: '',
        isThinking: true
      }]);

      setTimeout(() => {
        const response = `He recibido tu archivo "${file.name}". Estoy analizándolo... ¿Qué te gustaría saber específicamente sobre este documento?`;
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, text: response, isThinking: false }
            : msg
        ));
        setIsStreaming(false);
      }, 1500);
    }
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          setIsTranscribing(true);
          try {
            const text = await transcribeAudio(base64String, 'audio/webm');
            if (text) {
              setInput(prev => prev + (prev.length > 0 ? ' ' : '') + text);
            }
          } catch (error) {
            console.error("Transcription failed", error);
          } finally {
            setIsTranscribing(false);
            setIsListening(false);
            stream.getTracks().forEach(track => track.stop());
          }
        };
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const speakText = (text: string) => {
    setVoiceStatus('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;

    utterance.onend = () => {
      if (isVoiceMode) {
        startVoiceConversation();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceConversation = () => {
    setIsVoiceMode(false);
    window.speechSynthesis.cancel();
    stopRecording();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  };

  const startVoiceConversation = async () => {
    if (!isVoiceMode) return;
    setVoiceStatus('listening');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let silenceStart = Date.now();
      let isSpeaking = false;

      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        if (average > 10) {
          silenceStart = Date.now();
          isSpeaking = true;
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        } else {
          if (isSpeaking && Date.now() - silenceStart > 1500) {
            stopRecording();
            isSpeaking = false;
            return;
          }
        }
        animationFrameRef.current = requestAnimationFrame(checkSilence);
      };

      checkSilence();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];

          setVoiceStatus('processing');
          try {
            const text = await transcribeAudio(base64String, 'audio/webm');
            if (text && text.trim()) {
              setAppState(AppState.CHATTING);
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: text }]);

              const aiId = (Date.now() + 1).toString();
              setMessages(prev => [...prev, { id: aiId, role: 'model', text: '', isThinking: true }]);

              const prompt = text + " (Responde corto y hablado)";
              const aiResponseText = await sendMessageStream(prompt, (chunk) => {
                setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: chunk, isThinking: false } : m));
              });

              speakText(aiResponseText);

            } else {
              startVoiceConversation();
            }
          } catch (error) {
            console.error(error);
            speakText("Lo siento, hubo un error.");
          }
        };
      };

      mediaRecorder.start();

    } catch (e) {
      console.error("Voice mode error", e);
      setIsVoiceMode(false);
    }
  };

  useEffect(() => {
    if (isVoiceMode) {
      startVoiceConversation();
    } else {
      window.speechSynthesis.cancel();
      stopRecording();
    }
    return () => {
      window.speechSynthesis.cancel();
      stopRecording();
    };
  }, [isVoiceMode]);

  return (
    <div className="page-standard min-h-screen flex flex-col items-center relative">
      <Waves
        lineColor="rgba(87, 83, 78, 0.125)"
        backgroundColor="transparent"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
        className="fixed inset-0 z-0 pointer-events-none"
      />
      {/* Hidden File Inputs */}
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
      <input type="file" ref={galleryInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

      {/* Header */}
      <header className="relative w-full h-[50px] flex items-center justify-center shrink-0 z-30 pt-8">
        <button
          onClick={handleBack}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white rounded-full hover:bg-white/10 transition-colors z-50 cursor-pointer"
        >
          <ArrowLeftIcon />
        </button>

        <div className="bg-white/95 backdrop-blur-md px-5 py-2 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] border border-coffee-100/50 flex flex-col items-center">
          <h1 className="text-lg font-black tracking-tighter leading-none text-coffee-950">MONI AI.</h1>
          <p className="text-[0.5rem] uppercase tracking-[0.35em] text-coffee-600 font-medium mt-0.5">COACH FINANCIERO</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative w-full max-w-2xl mx-auto flex flex-col overflow-hidden pb-32">

        {/* IDLE STATE */}
        {appState === AppState.IDLE && (
          <div className="flex-1" />
        )}

        {/* CHATTING STATE */}
        {appState === AppState.CHATTING && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-coffee-900 text-coffee-50 rounded-br-sm border border-white/20'
                    : 'bg-white text-coffee-900 border border-coffee-100/80 rounded-bl-sm'
                    }`}
                >
                  {msg.role === 'model' && msg.isThinking ? (
                    <div className="flex gap-1.5 items-center h-6">
                      <span className="w-1.5 h-1.5 bg-coffee-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-coffee-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-coffee-400 rounded-full animate-bounce"></span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="fixed bottom-20 left-0 right-0 z-20 px-4">
        <div className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-coffee-50/90 p-4 rounded-3xl border border-white/20 shadow-[0px_15px_45px_-10px_rgba(0,0,0,0.25),0px_0px_10px_-2px_rgba(0,0,0,0.08)]">
          {/* Suggestions attached to input */}
          {appState === AppState.IDLE && (
            <div className="w-full flex overflow-x-auto gap-2.5 pb-2 px-1 no-scrollbar snap-x snap-mandatory">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAction(s.prompt)}
                  className="snap-center shrink-0 w-auto min-w-[120px] max-w-[160px] p-3 rounded-2xl bg-coffee-600 text-coffee-50 hover:bg-coffee-700 transition-colors text-left flex flex-col gap-0.5 shadow-sm active:scale-95 duration-200"
                >
                  <span className="font-semibold text-xs leading-tight">{s.label}</span>
                  <span className="text-[10px] opacity-80 leading-tight">{s.subLabel}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-center gap-2 bg-coffee-100 p-1 rounded-3xl shadow-sm border border-coffee-200/50 transition-all duration-200">
            {/* Action Menu Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-coffee-200/50 text-coffee-700 hover:bg-coffee-300 transition-colors shrink-0"
            >
              <PlusIcon />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta lo que quieras"
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-2 px-3 text-[15px] placeholder:text-coffee-400 text-coffee-900 max-h-24 leading-relaxed no-scrollbar"
              style={{ minHeight: '34px' }}
            />

            <div className="flex items-center gap-1 shrink-0">
              {input.trim() || isListening ? (
                <button
                  onClick={input.trim() ? () => handleSend() : stopRecording}
                  disabled={!input.trim() && !isListening}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-coffee-900 text-coffee-50 hover:bg-coffee-800'
                    }`}
                >
                  {isListening ? <MicIcon /> : <SendIcon />}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleMicClick}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-coffee-600 hover:bg-coffee-200/50 transition-colors"
                  >
                    <MicIcon />
                  </button>
                  <button
                    onClick={() => setIsVoiceMode(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-coffee-900 text-coffee-50 hover:bg-coffee-800 transition-colors shadow-sm"
                  >
                    <WaveformIcon />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Action Menu Sheet */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-coffee-950 rounded-t-[32px] p-6 z-50 text-coffee-50 pb-10"
            >
              <div className="w-10 h-1 bg-coffee-800 rounded-full mx-auto mb-6 opacity-50" />

              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg text-white">MONI AI</h3>
                <span className="text-xs text-coffee-400 font-medium">Todos los archivos</span>
              </div>

              {/* Media Row */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="aspect-square rounded-2xl bg-coffee-900/50 border border-coffee-800 flex items-center justify-center hover:bg-coffee-800 transition-colors"
                >
                  <CameraIcon />
                </button>

                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-2xl bg-coffee-900/50 border border-coffee-800 overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-coffee-800/30 group-hover:bg-transparent transition-colors" />
                  <div className="w-full h-full bg-gradient-to-br from-coffee-800 to-coffee-900 flex items-center justify-center">
                    <ImageIcon />
                  </div>
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-2xl bg-coffee-900/50 border border-coffee-800 overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-coffee-800/30 group-hover:bg-transparent transition-colors" />
                  <div className="w-full h-full bg-gradient-to-tr from-gray-800 to-black flex items-center justify-center">
                    <div className="w-4 h-4 border-b-2 border-r-2 border-coffee-400 rotate-45"></div>
                  </div>
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-2xl bg-coffee-900/50 border border-coffee-800 flex items-center justify-center text-xs font-medium text-coffee-400 hover:text-white hover:bg-coffee-800 transition-colors"
                >
                  +12
                </button>
              </div>

              {/* Actions List */}
              <div className="space-y-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 hover:bg-coffee-900/50 rounded-2xl flex items-center gap-4 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-coffee-900 flex items-center justify-center text-coffee-400 group-hover:text-white transition-colors border border-coffee-800">
                    <PaperclipIcon />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Agregar archivos</div>
                    <div className="text-xs text-coffee-400">Analizar o resumir</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction("Generar gráficas de finanzas personales")}
                  className="w-full p-4 hover:bg-coffee-900/50 rounded-2xl flex items-center gap-4 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-coffee-900 flex items-center justify-center text-coffee-400 group-hover:text-white transition-colors border border-coffee-800">
                    <ChartIcon />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Generar gráficas de finanzas personales</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction("Dame métricas personales de mis finanzas")}
                  className="w-full p-4 hover:bg-coffee-900/50 rounded-2xl flex items-center gap-4 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-coffee-900 flex items-center justify-center text-coffee-400 group-hover:text-white transition-colors border border-coffee-800">
                    <WalletIcon />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Métricas personales de mis finanzas</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAction("Recomendaciones de mejora financiera")}
                  className="w-full p-4 hover:bg-coffee-900/50 rounded-2xl flex items-center gap-4 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-coffee-900 flex items-center justify-center text-coffee-400 group-hover:text-white transition-colors border border-coffee-800">
                    <SparklesIcon />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Recomendaciones de mejora</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Voice Mode Overlay */}
      <AnimatePresence>
        {isVoiceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-coffee-50 flex flex-col items-center justify-center"
          >
            {/* Header in Voice Mode */}
            <div className="absolute top-0 w-full flex flex-col items-center pt-12">
              <h2 className="text-lg font-black tracking-tighter text-coffee-200/50 mb-4">MONI AI.</h2>
              <div className="px-6 py-2 bg-white border border-coffee-200 rounded-full shadow-sm">
                <span className="text-coffee-900 font-semibold animate-pulse">
                  {voiceStatus === 'listening' ? 'Escuchando...' :
                    voiceStatus === 'processing' ? 'Procesando...' :
                      'Hablando...'}
                </span>
              </div>
            </div>

            {/* Visualizer */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer Glow */}
              <motion.div
                animate={{
                  scale: voiceStatus === 'listening' ? [1, 1.2, 1] :
                    voiceStatus === 'processing' ? [1, 1.1, 1] :
                      [1, 1.5, 1],
                  opacity: voiceStatus === 'listening' ? 0.3 :
                    voiceStatus === 'processing' ? 0.6 :
                      0.2
                }}
                transition={{
                  duration: voiceStatus === 'processing' ? 0.5 : 2,
                  repeat: Infinity
                }}
                className="absolute inset-0 bg-coffee-600 rounded-full blur-2xl"
              />

              {/* Core Sphere */}
              <motion.div
                animate={{
                  scale: voiceStatus === 'listening' ? [1, 1.05, 1] :
                    voiceStatus === 'processing' ? [0.9, 1.1, 0.9] :
                      [1, 1.1, 1]
                }}
                transition={{
                  duration: voiceStatus === 'processing' ? 0.4 : 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-40 h-40 bg-coffee-950 rounded-full shadow-2xl relative z-10 flex items-center justify-center"
              >
                <div className="w-10 h-6 bg-white/10 rounded-full blur-md absolute top-8 right-10 rotate-[-20deg]" />
              </motion.div>
            </div>

            {/* Footer controls */}
            <div className="absolute bottom-12 w-full flex justify-center gap-6 items-center">
              <button
                onClick={stopVoiceConversation}
                className="px-8 py-3 bg-coffee-200 hover:bg-coffee-300 text-coffee-900 rounded-full font-medium transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancialChat;
