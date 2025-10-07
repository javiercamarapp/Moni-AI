import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import whatsappLogo from '@/assets/whatsapp-logo.png';
import BottomNav from '@/components/BottomNav';

const FinancialChat = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');

  const suggestedQuestions = [
    "¿En qué he gastado estos últimos 7 días? 🤔",
    "¿Cuánto es mi promedio de gasto por semana? 🤓",
    "¿Cuánto gaste el mes pasado en mascotas? 🐶",
    "¿Cuánto he gastado en viajes este mes? 🚗"
  ];

  const handleAskQuestion = () => {
    if (question.trim()) {
      // Aquí irá la lógica para enviar la pregunta
      window.open(`https://wa.me/5215512345678?text=${encodeURIComponent(question)}`, '_blank');
    }
  };

  const handleSuggestedQuestion = (suggestedQuestion: string) => {
    const cleanQuestion = suggestedQuestion.replace(/[🤔🤓🐶🚗]/g, '').trim();
    window.open(`https://wa.me/5215512345678?text=${encodeURIComponent(cleanQuestion)}`, '_blank');
  };

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header con botón de regreso */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="container mx-auto max-w-3xl px-4 pb-8">
        {/* Título y descripción */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Soy <span className="text-blue-400">Moni</span>,
              </h1>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                tu experto financiero
              </h2>
            </div>
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              <img src={whatsappLogo} alt="WhatsApp" className="w-full h-full object-contain" />
            </div>
          </div>

          <p className="text-white text-base sm:text-lg mb-6">
            Hazme cualquier pregunta sobre tus finanzas y te aconsejaré para que logres tus metas financieras.
          </p>

          <div className="space-y-2 text-white text-sm sm:text-base mb-4">
            <p>¿No sabes cuánto gastas en restaurantes? 🍔</p>
            <p>¿No sabes cuánto ahorras cada mes? 📊</p>
            <p className="font-medium">Pregúntame.</p>
          </div>

          <p className="text-white text-sm sm:text-base mb-6">
            Pregúntame y te llevaré a WhatsApp para darte la respuesta.
          </p>
        </div>

        {/* Sección de pregunta */}
        <Card className="p-4 sm:p-6 bg-gradient-card card-glow mb-6">
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">
            ¿Quieres preguntarme algo?
          </h3>
          
          <Input
            type="text"
            placeholder="Escribe aquí tu pregunta"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
            className="mb-4 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />

          <Button
            onClick={handleAskQuestion}
            disabled={!question.trim()}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Preguntarle a Moni
          </Button>
        </Card>

        {/* Preguntas sugeridas */}
        <div>
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-4">
            O acá te dejo algunas preguntas
          </h3>
          
          <div className="space-y-3">
            {suggestedQuestions.map((q, index) => (
              <Card
                key={index}
                onClick={() => handleSuggestedQuestion(q)}
                className="p-4 bg-gradient-card card-glow hover:bg-white/30 cursor-pointer transition-all hover-lift"
              >
                <p className="text-white text-sm sm:text-base">{q}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default FinancialChat;
