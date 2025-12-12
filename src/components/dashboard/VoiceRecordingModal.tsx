import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Loader2, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface VoiceRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'result' | 'saving';

const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const queryClient = useQueryClient();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && state === 'idle') {
      startRecording();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Start level monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        await processRecording();
      };

      mediaRecorder.start();
      setState('recording');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('No se pudo acceder al micrófono');
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('transcribing');
    }
  };

  const processRecording = async () => {
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          setTranscription(data.text);
          setState('result');
        } else {
          toast.error('No se pudo transcribir el audio');
          onClose();
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Error al transcribir el audio');
      onClose();
    }
  };

  const saveTransaction = async (type: 'ingreso' | 'gasto') => {
    if (!transcription) return;
    
    setState('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Get default category based on type
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', type)
        .limit(1);

      const categoryId = categories?.[0]?.id || null;

      // Try to extract amount from transcription
      const amountMatch = transcription.match(/(\d+(?:[.,]\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          description: transcription,
          amount: amount,
          type: type,
          category_id: categoryId,
          transaction_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });

      toast.success(`${type === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado correctamente`);
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Error al guardar la transacción');
      setState('result');
    }
  };

  const handleClose = () => {
    if (state === 'recording' && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setState('idle');
    setTranscription(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Recording state */}
        {state === 'recording' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            {/* Animated rings */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2 border-white/20"
                  style={{
                    width: `${100 + i * 40}%`,
                    height: `${100 + i * 40}%`,
                  }}
                  animate={{
                    scale: [1, 1 + audioLevel * 0.3, 1],
                    opacity: [0.3, 0.1 + audioLevel * 0.3, 0.3],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                  }}
                />
              ))}
              
              {/* Center mic button */}
              <motion.button
                onClick={stopRecording}
                className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/30"
                animate={{
                  scale: [1, 1 + audioLevel * 0.1, 1],
                }}
                transition={{ duration: 0.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </motion.button>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-white/80 text-lg font-light"
            >
              Escuchando...
            </motion.p>
            <p className="mt-2 text-white/40 text-sm">
              Toca para terminar
            </p>
          </motion.div>
        )}

        {/* Transcribing state */}
        {state === 'transcribing' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <p className="mt-8 text-white/80 text-lg font-light">
              Procesando...
            </p>
          </motion.div>
        )}

        {/* Saving state */}
        {state === 'saving' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <p className="mt-8 text-white/80 text-lg font-light">
              Guardando...
            </p>
          </motion.div>
        )}

        {/* Result state */}
        {state === 'result' && transcription && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center px-8 max-w-md w-full"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            
            <p className="text-white/90 text-xl text-center font-light leading-relaxed mb-8">
              "{transcription}"
            </p>

            <p className="text-white/50 text-sm mb-6">
              ¿Cómo quieres registrarlo?
            </p>

            <div className="flex gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => saveTransaction('gasto')}
                className="flex-1 flex items-center justify-center gap-2 bg-[#5D4037] text-white rounded-2xl py-4 font-medium shadow-lg shadow-[#5D4037]/20"
              >
                <TrendingDown className="w-5 h-5" />
                Gasto
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => saveTransaction('ingreso')}
                className="flex-1 flex items-center justify-center gap-2 bg-[#A1887F] text-white rounded-2xl py-4 font-medium shadow-lg shadow-[#A1887F]/20"
              >
                <TrendingUp className="w-5 h-5" />
                Ingreso
              </motion.button>
            </div>

            <button
              onClick={handleClose}
              className="mt-6 text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              Cancelar
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceRecordingModal;
