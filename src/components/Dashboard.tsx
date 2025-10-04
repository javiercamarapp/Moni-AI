import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { useToast } from "@/hooks/use-toast";
import bannerInvestment from '@/assets/banner-investment.jpg';
import bannerGoals from '@/assets/banner-goals.jpg';
import bannerGroups from '@/assets/banner-groups.jpg';
import bannerHalloween from '@/assets/banner-halloween.png';
import { 
  Target, 
  TrendingUp, 
  Wallet, 
  Trophy, 
  Zap, 
  Users, 
  MessageCircle,
  Settings,
  Bell,
  Plus,
  LogOut
} from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentXP] = useState(1250);
  const [nextLevelXP] = useState(1500);
  const [level] = useState(8);
  const [api, setApi] = useState<CarouselApi>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);

    return () => clearInterval(interval);
  }, [api]);

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
    try {
      // Limpiar localStorage manualmente primero
      localStorage.removeItem('sb-gfojxewccmjwdzdmdfxv-auth-token');
      
      await supabase.auth.signOut();
      
      toast({
        title: "Sesión cerrada",
        description: "Hasta pronto!",
      });
      
      // Navegar inmediatamente, el onAuthStateChange ya no interferirá
      navigate("/auth");
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentXP / nextLevelXP) * 100;
  
  const goals = [
    {
      id: 1,
      title: "Viaje a Japón",
      target: 50000,
      current: 32500,
      deadline: "Dic 2024",
      type: "personal",
      color: "primary"
    },
    {
      id: 2,
      title: "Fondo de emergencia",
      target: 25000,
      current: 18750,
      deadline: "Mar 2025",
      type: "personal",
      color: "success"
    },
    {
      id: 3,
      title: "Viaje Grupal - Tulum",
      target: 15000,
      current: 8500,
      deadline: "Jul 2024",
      type: "group",
      color: "warning",
      members: 4
    }
  ];

  const recentTransactions = [
    { id: 1, description: "Starbucks - Insurgentes", amount: -89, category: "Café", time: "Hace 2h" },
    { id: 2, description: "Salario depositado", amount: 15000, category: "Ingreso", time: "Ayer" },
    { id: 3, description: "Uber - Casa a oficina", amount: -67, category: "Transporte", time: "Ayer" },
    { id: 4, description: "Mercado Soriana", amount: -580, category: "Supermercado", time: "2 días" }
  ];

  const achievements = [
    { id: 1, title: "Ahorro Constante", description: "7 días seguidos cumpliendo meta diaria", earned: true },
    { id: 2, title: "Cazador de Ofertas", description: "Usaste 3 promociones esta semana", earned: true },
    { id: 3, title: "Planificador", description: "Creaste tu primer presupuesto", earned: false }
  ];

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header con saludo y botón de logout para desktop */}
      <div className="p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            ¡Hola, {user?.user_metadata?.full_name || user?.email}! 👋
          </h1>
          <p className="text-sm text-white">Vas excelente con tus metas financieras</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="hidden md:flex border-white bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-black transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Salir
        </Button>
      </div>

      {/* Banner Publicitario - Carrusel */}
      <div className="mx-4 mb-4">
        <Carousel 
          className="w-full"
          setApi={setApi}
          opts={{
            loop: true,
            align: "center",
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-[80%]">
              <Card className="relative overflow-hidden border border-border/50 h-[200px] sm:h-[240px]">
                <img 
                  src={bannerHalloween} 
                  alt="Halloween Special Sale" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                <div className="relative p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      Oferta Especial Halloween
                    </h3>
                  </div>
                  <p className="text-sm text-white/90 mb-3">
                    Descuentos exclusivos por tiempo limitado
                  </p>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 w-fit"
                  >
                    Comprar Ahora
                  </Button>
                </div>
              </Card>
            </CarouselItem>
            
            <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-[80%]">
              <Card className="relative overflow-hidden border border-border/50 h-[200px] sm:h-[240px]">
                <img 
                  src={bannerGoals} 
                  alt="Banner de metas" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                <div className="relative p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      Alcanza tus Metas
                    </h3>
                  </div>
                  <p className="text-sm text-white/90 mb-3">
                    Planifica y ahorra para cumplir tus objetivos
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs sm:text-sm bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 w-fit"
                  >
                    Comenzar
                  </Button>
                </div>
              </Card>
            </CarouselItem>
            
            <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-[80%]">
              <Card className="relative overflow-hidden border border-border/50 h-[200px] sm:h-[240px]">
                <img 
                  src={bannerGroups} 
                  alt="Banner de ahorro grupal" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                <div className="relative p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">
                      Ahorro en Grupo
                    </h3>
                  </div>
                  <p className="text-sm text-white/90 mb-3">
                    Únete a grupos y multiplica tus ahorros
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs sm:text-sm bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 w-fit"
                  >
                    Explorar
                  </Button>
                </div>
              </Card>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
      
      {/* Bottom Navigation Menu - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-white/20 shadow-lg">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10"
            >
              <Target className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Metas</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10"
              onClick={() => navigate("/chat")}
            >
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Chat</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10"
            >
              <TrendingUp className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Análisis</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10"
            >
              <Users className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Grupos</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10"
            >
              <Settings className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Más</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        
        {/* Level Progress y Quick Stats en la misma fila - dos secciones */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Sección 1: Level Progress */}
          <Card className="p-2 sm:p-3 lg:p-4 bg-gradient-card card-glow h-full flex flex-col justify-between">
            <div className="space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-center">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs sm:text-sm lg:text-base font-semibold text-white leading-tight">Nivel {level}</h2>
                    <p className="text-[9px] sm:text-[10px] text-white leading-tight">Ahorrador Pro</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-[9px] sm:text-[10px] px-1 py-0.5 flex-shrink-0 leading-tight">
                  +50 XP
                </Badge>
              </div>
              
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex justify-between text-[9px] sm:text-[10px]">
                  <span className="text-white">{currentXP}</span>
                  <span className="text-white">{nextLevelXP}</span>
                </div>
                <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
                <p className="text-[8px] sm:text-[9px] text-white text-center leading-tight">
                  {nextLevelXP - currentXP} XP restantes
                </p>
              </div>
            </div>
          </Card>

          {/* Sección 2: Quick Stats - 3 estadísticas */}
          <div className="grid grid-cols-1 gap-2">
            <Card className="p-2 sm:p-3 bg-gradient-card card-glow">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-white">Balance</p>
                  <p className="text-sm sm:text-base lg:text-lg font-semibold text-white">$23,450</p>
                </div>
              </div>
            </Card>

            <Card className="p-2 sm:p-3 bg-gradient-card card-glow">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-white">Ahorrado</p>
                  <p className="text-sm sm:text-base lg:text-lg font-semibold text-white">$4,200</p>
                </div>
              </div>
            </Card>

            <Card className="p-2 sm:p-3 bg-gradient-card card-glow">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-white">Metas</p>
                  <p className="text-sm sm:text-base lg:text-lg font-semibold text-white">{goals.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Goals Section */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Tus Metas</h3>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/new-goal')}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Nueva Meta
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {goals.map((goal) => {
                  const goalProgress = (goal.current / goal.target) * 100;
                  return (
                    <Card key={goal.id} className="p-4 sm:p-6 bg-gradient-card card-glow hover-lift">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap space-x-2 mb-2 gap-1">
                            <h4 className="text-base sm:text-lg font-semibold text-white">{goal.title}</h4>
                            {goal.type === 'group' && (
                              <Badge variant="outline" className="text-xs text-white border-white/30">
                                <Users className="w-3 h-3 mr-1" />
                                {goal.members} personas
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-white">Meta: {goal.deadline}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-base sm:text-lg font-semibold text-white">
                            ${goal.current.toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-white">
                            de ${goal.target.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <Progress value={goalProgress} className="h-2 sm:h-3 mb-2" />
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-white">{Math.round(goalProgress)}% completado</span>
                        <span className="text-white font-medium">
                          ${(goal.target - goal.current).toLocaleString()} restante
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Chat with AI */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-white">Moni AI Coach</h4>
                  <p className="text-xs text-white">En línea</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="bg-white/10 rounded-2xl rounded-bl-md p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-white">
                    ¡Excelente progreso en tu meta de Japón! 🇯🇵 
                    <br /><br />
                    Te quedan solo $17,500. Si ahorras $890 extra este mes, ¡estarás súper cerca! 
                  </p>
                </div>
                
                <div className="bg-white/20 rounded-2xl rounded-br-md p-2 sm:p-3 ml-6 sm:ml-8">
                  <p className="text-xs sm:text-sm text-white">
                    ¿Cómo puedo ahorrar esos $890 extras? 🤔
                  </p>
                </div>
              </div>

              <Button 
                size="sm" 
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => navigate("/chat")}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continuar chat
              </Button>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-4">Movimientos Recientes</h4>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-white">
                        {transaction.category} • {transaction.time}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${
                      transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      ${Math.abs(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Achievements */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm sm:text-base font-semibold text-white flex items-center">
                  <Trophy className="w-4 h-4 mr-2 text-white" />
                  Logros Recientes
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-white hover:bg-white/10"
                >
                  Ver todos
                </Button>
              </div>
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`p-3 rounded-lg border ${
                    achievement.earned 
                      ? 'border-white/30 bg-white/10' 
                      : 'border-white/20 bg-white/5'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        achievement.earned ? 'bg-white text-black' : 'bg-gray-600'
                      }`}>
                        {achievement.earned ? <Zap className="w-3 h-3" /> : <Target className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-white">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
