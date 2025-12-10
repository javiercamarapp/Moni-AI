import { supabase } from "@/integrations/supabase/client";

let chatHistory: { role: 'user' | 'model'; parts: string }[] = [];

export const resetChat = () => {
  chatHistory = [];
};

export const sendMessageStream = async (
  message: string,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    // Add user message to history
    chatHistory.push({ role: 'user', parts: message });

    // Call the AI chat edge function
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        message,
        history: chatHistory.slice(-10) // Keep last 10 messages for context
      }
    });

    if (error) throw error;

    const responseText = data?.response || 'Lo siento, no pude procesar tu mensaje.';
    
    // Simulate streaming by chunking the response
    let currentText = '';
    const words = responseText.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      onChunk(currentText);
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Add model response to history
    chatHistory.push({ role: 'model', parts: responseText });

    return responseText;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const transcribeAudio = async (
  base64Audio: string,
  mimeType: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: {
        audio: base64Audio,
        mimeType
      }
    });

    if (error) throw error;

    return data?.text || '';
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};
