import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Send, 
  Smile, 
  Paperclip, 
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Bot,
  User,
  LogOut
} from 'lucide-react';

const ChatInterface = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [messages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "¡Hola! 👋 Soy tu coach financiero personal. Veo que has estado muy activa ahorrando para tu viaje a Japón. ¡Felicidades! 🎉",
      timestamp: "10:30 AM",
      read: true
    },
    {
      id: 2,
      type: 'ai', 
      content: "Te tengo noticias importantes:\n\n💰 Detecté que gastaste $280 en delivery esta semana\n📊 Esto es 40% más que la semana pasada\n🎯 Si reduces esto a la mitad, ahorrarías $560 al mes extra\n\n¿Te doy algunos tips para cocinar rápido en casa?",
      timestamp: "10:32 AM",
      read: true
    },
    {
      id: 3,
      type: 'user',
      content: "¡Sí! Me encantaría tener algunos tips. No sabía que gastaba tanto en delivery 😅",
      timestamp: "10:35 AM",
      read: true
    },
    {
      id: 4,
      type: 'ai',
      content: "¡Perfecto! 🍳 Aquí van 3 tips súper prácticos:\n\n1️⃣ **Meal prep dominical**: 2 horas el domingo = comidas toda la semana\n\n2️⃣ **La regla 15-15**: 15 mins de prep + 15 mins cocinando = comida casera\n\n3️⃣ **Apps aliadas**: Usa \"Too Good To Go\" para comida gourmet a mitad de precio\n\n💡 Con estos cambios podrías llegar a Japón 2 meses antes de lo planeado",
      timestamp: "10:36 AM",
      read: true
    },
    {
      id: 5,
      type: 'user',
      content: "Wow, ¿2 meses antes? ¿Cómo calculaste eso?",
      timestamp: "10:38 AM",
      read: true
    },
    {
      id: 6,
      type: 'ai',
      content: "¡Te explico la magia de los números! ✨\n\n📈 **Ahorro actual**: $2,890/mes hacia Japón\n💸 **Reducir delivery**: +$280/mes\n🍕 **Otros gastos hormiga que detecté**: +$340/mes\n🎁 **Aprovechar ofertas**: +$150/mes\n\n**Total nuevo**: $3,660/mes\n\n🗓️ **Tiempo original**: 6 meses más\n🗓️ **Tiempo optimizado**: 4 meses más\n\n¿Quieres que te ayude a crear un plan específico para estos próximos 4 meses?",
      timestamp: "10:40 AM",
      read: true,
      typing: true
    }
  ]);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
      description: "Hasta pronto!",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // Aquí se enviaría el mensaje
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen animated-wave-bg">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        
        {/* Chat Header */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 rounded-b-none shadow-lg">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="lg:hidden text-gray-900 hover:bg-gray-100" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center glow-primary">
                <Bot className="w-5 h-5 text-white" />
              </div>
              
              <div>
                <h2 className="font-semibold text-gray-900">Moni AI Coach</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-xs text-gray-600">En línea • Analizando tus finanzas</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                +25 XP por chat activo
              </Badge>
              <Button variant="ghost" size="icon" className="text-gray-900 hover:bg-gray-100">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-900 hover:bg-gray-100">
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-900 hover:bg-gray-100" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-white/90 backdrop-blur-sm p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg ${
                msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.type === 'ai' 
                    ? 'bg-gradient-primary glow-primary' 
                    : 'bg-secondary'
                }`}>
                  {msg.type === 'ai' ? (
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <User className="w-4 h-4 text-secondary-foreground" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`relative px-4 py-3 rounded-2xl ${
                  msg.type === 'ai'
                    ? 'bg-gray-100 text-gray-900 rounded-bl-md'
                    : 'bg-primary text-primary-foreground rounded-br-md'
                } ${msg.typing ? 'animate-pulse' : ''}`}>
                  
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </div>
                  
                  <div className={`text-xs mt-2 ${
                    msg.type === 'ai' ? 'text-gray-600' : 'text-primary-foreground/70'
                  }`}>
                    {msg.timestamp}
                  </div>

                  {/* Typing indicator */}
                  {msg.typing && (
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 justify-center py-4">
            <Button variant="outline" size="sm" className="text-xs border-white/30 text-gray-900 hover:bg-white/10 hover:border-white/50">
              📊 Analizar mis gastos
            </Button>
            <Button variant="outline" size="sm" className="text-xs border-white/30 text-gray-900 hover:bg-white/10 hover:border-white/50">
              🎯 Crear nueva meta
            </Button>
            <Button variant="outline" size="sm" className="text-xs border-white/30 text-gray-900 hover:bg-white/10 hover:border-white/50">
              💡 Tips de ahorro
            </Button>
            <Button variant="outline" size="sm" className="text-xs border-white/30 text-gray-900 hover:bg-white/10 hover:border-white/50">
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
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregúntame sobre tus finanzas..."
                  className="bg-white border-gray-300 text-gray-900 focus:border-purple-500 pr-12"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
              
              <Button 
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="bg-gradient-primary text-white hover:scale-105 transition-all glow-primary"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
              <span>🤖 Respuesta instantánea con IA • 🔐 Datos 100% seguros</span>
              <span>Presiona Enter para enviar</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatInterface;
