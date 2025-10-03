import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { useToast } from "@/hooks/use-toast";
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
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Hasta pronto!",
    });
    navigate("/");
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
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header con saludo y botón de logout para desktop */}
      <div className="p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            ¡Hola, {user?.user_metadata?.full_name || user?.email}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">Vas excelente con tus metas financieras</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="hidden md:flex"
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
          }}
        >
          <CarouselContent>
            <CarouselItem>
              <Card className="bg-muted/30 p-6 relative overflow-hidden border border-border/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        Oferta Especial
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      20% de descuento en tu primer inversión
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      Ver más
                    </Button>
                  </div>
                </div>
              </Card>
            </CarouselItem>
            
            <CarouselItem>
              <Card className="bg-muted/30 p-6 relative overflow-hidden border border-border/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        Alcanza tus Metas
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Planifica y ahorra para cumplir tus objetivos
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      Comenzar
                    </Button>
                  </div>
                </div>
              </Card>
            </CarouselItem>
            
            <CarouselItem>
              <Card className="bg-muted/30 p-6 relative overflow-hidden border border-border/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        Ahorro en Grupo
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Únete a grupos y multiplica tus ahorros
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      Explorar
                    </Button>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
      
      {/* Bottom Navigation Menu - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Target className="w-5 h-5" />
              <span className="text-xs">Metas</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
              onClick={() => navigate("/chat")}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Chat</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Análisis</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Grupos</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1 h-auto py-2 px-3"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Más</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        
        {/* Level Progress */}
        <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Nivel {level} - Ahorrador Pro</h2>
                <p className="text-sm text-muted-foreground">{currentXP} / {nextLevelXP} XP</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
              +50 XP hoy
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2 sm:h-3" />
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            {nextLevelXP - currentXP} XP para el siguiente nivel
          </p>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Goals Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4 bg-gradient-card card-glow hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Total</p>
                    <p className="text-xl font-semibold text-foreground">$23,450</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-card card-glow hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ahorrado este mes</p>
                    <p className="text-xl font-semibold text-foreground">$4,200</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-card card-glow hover-lift">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Metas activas</p>
                    <p className="text-xl font-semibold text-foreground">{goals.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Goals */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">Tus Metas</h3>
                <Button size="sm" className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/30 text-xs sm:text-sm">
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
                            <h4 className="text-base sm:text-lg font-semibold text-foreground">{goal.title}</h4>
                            {goal.type === 'group' && (
                              <Badge variant="outline" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                {goal.members} personas
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Meta: {goal.deadline}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-base sm:text-lg font-semibold text-foreground">
                            ${goal.current.toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            de ${goal.target.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <Progress value={goalProgress} className="h-2 sm:h-3 mb-2" />
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">{Math.round(goalProgress)}% completado</span>
                        <span className="text-primary font-medium">
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
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-foreground">Moni AI Coach</h4>
                  <p className="text-xs text-muted-foreground">En línea</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="bg-muted/50 rounded-2xl rounded-bl-md p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-foreground">
                    ¡Excelente progreso en tu meta de Japón! 🇯🇵 
                    <br /><br />
                    Te quedan solo $17,500. Si ahorras $890 extra este mes, ¡estarás súper cerca! 
                  </p>
                </div>
                
                <div className="bg-primary/20 rounded-2xl rounded-br-md p-2 sm:p-3 ml-6 sm:ml-8">
                  <p className="text-xs sm:text-sm text-foreground">
                    ¿Cómo puedo ahorrar esos $890 extras? 🤔
                  </p>
                </div>
              </div>

              <Button 
                size="sm" 
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
                onClick={() => navigate("/chat")}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Continuar chat
              </Button>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-4">Movimientos Recientes</h4>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.category} • {transaction.time}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${
                      transaction.amount > 0 ? 'text-success' : 'text-foreground'
                    }`}>
                      ${Math.abs(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Achievements */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <h4 className="text-sm sm:text-base font-semibold text-foreground mb-4 flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-primary" />
                Logros Recientes
              </h4>
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`p-3 rounded-lg border ${
                    achievement.earned 
                      ? 'border-primary/30 bg-primary/10' 
                      : 'border-muted bg-muted/20'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        achievement.earned ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {achievement.earned ? <Zap className="w-3 h-3" /> : <Target className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
