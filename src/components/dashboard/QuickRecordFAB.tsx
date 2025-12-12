import React, { useState, useRef } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Mic, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const QuickRecordFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleRecord = (type: 'income' | 'expense', description?: string) => {
    setIsOpen(false);
    setTranscription(null);
    navigate('/movimientos', { 
      state: { 
        openAddModal: true, 
        defaultType: type,
        defaultDescription: description 
      } 
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        await processRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    setIsTranscribing(true);
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) {
          throw error;
        }

        if (data?.text) {
          setTranscription(data.text);
        } else {
          toast.error('No se pudo transcribir el audio');
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Error al transcribir el audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const cancelTranscription = () => {
    setTranscription(null);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        {/* Transcription result modal */}
        {transcription && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100"
          >
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              "{transcription}"
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRecord('expense', transcription)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#5D4037] text-white rounded-full py-2.5 text-sm font-medium hover:bg-[#4E342E] transition-colors"
              >
                <TrendingDown className="w-4 h-4" />
                Gasto
              </button>
              <button
                onClick={() => handleRecord('income', transcription)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#A1887F] text-white rounded-full py-2.5 text-sm font-medium hover:bg-[#8D6E63] transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Ingreso
              </button>
            </div>
            <button
              onClick={cancelTranscription}
              className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </motion.div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 right-0 bg-red-500 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Grabando...</span>
          </motion.div>
        )}

        {/* Transcribing indicator */}
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 right-0 bg-gray-800 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Transcribiendo...</span>
          </motion.div>
        )}

        {/* Regular menu */}
        {isOpen && !transcription && !isRecording && !isTranscribing && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 right-0 flex flex-col items-end gap-2"
          >
            {/* Income button */}
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => handleRecord('income')}
              className="flex items-center gap-2 bg-[#A1887F] text-white rounded-full px-4 py-2.5 shadow-lg hover:bg-[#8D6E63] transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Ingreso</span>
            </motion.button>

            {/* Expense button */}
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1, delay: 0.05 }}
              onClick={() => handleRecord('expense')}
              className="flex items-center gap-2 bg-[#5D4037] text-white rounded-full px-4 py-2.5 shadow-lg hover:bg-[#4E342E] transition-colors"
            >
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Gasto</span>
            </motion.button>

            {/* Voice button */}
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1, delay: 0.1 }}
              onClick={startRecording}
              className="flex items-center justify-center w-10 h-10 bg-white text-gray-600 rounded-full shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <Mic className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      {isRecording ? (
        <motion.button
          onClick={stopRecording}
          className="w-14 h-14 rounded-full bg-red-500 text-white shadow-xl flex items-center justify-center hover:bg-red-600 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <Square className="w-5 h-5 fill-current" />
        </motion.button>
      ) : (
        <motion.button
          onClick={() => {
            if (transcription) {
              cancelTranscription();
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className="w-14 h-14 rounded-full bg-[#5D4037] text-white shadow-xl flex items-center justify-center hover:bg-[#4E342E] transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isOpen || transcription ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen || transcription ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      )}
    </div>
  );
};

export default QuickRecordFAB;
