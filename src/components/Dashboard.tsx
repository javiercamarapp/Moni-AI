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
import heroAuth from '@/assets/moni-ai-logo.png';
import whatsappLogo from '@/assets/whatsapp-logo.png';
import { Target, TrendingUp, Wallet, Trophy, Zap, Users, MessageCircle, Settings, Bell, Plus, LogOut, Home, User } from 'lucide-react';
import moniLogo from '/moni-logo.png';
const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false); // Changed to false for instant load
  const [currentXP] = useState(0);
  const [nextLevelXP] = useState(100);
  const [level] = useState(1);
  const [api, setApi] = useState<CarouselApi>();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [goals, setGoals] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = mes actual, 1 = mes anterior, etc.
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Datos por mes
  const getMonthName = (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return targetDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  };

  const currentMonth = {
    month: getMonthName(selectedMonthOffset),
    income: monthlyIncome,
    expenses: monthlyExpenses,
    balance: monthlyIncome - monthlyExpenses
  };
  
  const handlePrevMonth = () => {
    setSelectedMonthOffset(prev => prev + 1);
  };
  
  const handleNextMonth = () => {
    if (selectedMonthOffset > 0) {
      setSelectedMonthOffset(prev => prev - 1);
    }
  };

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  // Fetch goals
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setGoals(data || []);
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };

    fetchGoals();
  }, []);

  // Fetch recent transactions and calculate monthly totals
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calculate the selected month's dates
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth() - selectedMonthOffset, 1);
        const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        // Fetch all transactions for selected month
        const { data: allTransactions, error: allError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('transaction_date', firstDay.toISOString().split('T')[0])
          .lte('transaction_date', lastDay.toISOString().split('T')[0]);

        if (allError) throw allError;

        // Calculate monthly totals
        const income = allTransactions
          ?.filter(t => t.type === 'ingreso')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        
        const expenses = allTransactions
          ?.filter(t => t.type === 'gasto')
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        setMonthlyIncome(income);
        setMonthlyExpenses(expenses);

        // Fetch recent transactions for display (always from current month for recent view)
        if (selectedMonthOffset === 0) {
          const { data: recentData, error: recentError } = await supabase
            .from('transactions')
            .select('*, categories(name, color)')
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .limit(5);

          if (recentError) throw recentError;
          setRecentTransactions(recentData || []);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [selectedMonthOffset]);

  useEffect(() => {
    // Check authentication in background - no loading screen
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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
  
  const handleLogout = async () => {
    try {
      localStorage.removeItem('sb-gfojxewccmjwdzdmdfxv-auth-token');
      await supabase.auth.signOut();
      toast({
        title: "Sesión cerrada",
        description: "Hasta pronto!"
      });
      navigate("/auth");
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      navigate("/auth");
    }
  };
  
  const progressPercentage = currentXP / nextLevelXP * 100;
  const achievements: any[] = []; // Los logros se implementarán en el futuro basados en la actividad del usuario
  return <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header superior con logo y notificaciones */}
      <div className="p-2 flex justify-between items-start">
        {/* Logo banner - esquina superior izquierda */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden w-16 h-10">
          <img src={heroAuth} alt="Moni" className="w-full h-full object-cover" />
        </div>
        
        {/* Puntos y nivel + Notificaciones */}
        <div className="flex gap-2 items-center">
          {/* Botón de puntos y nivel */}
          <Button variant="ghost" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-10 px-3 gap-2">
            <span className="text-sm font-bold">{currentXP} pts</span>
            <span className="text-xs opacity-80">Nivel {level}</span>
          </Button>
          
          {/* Botón de notificaciones */}
          <Button variant="ghost" size="icon" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white h-10 w-10">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Header con saludo y botón de logout para desktop */}
      <div className="p-4 pt-2 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            ¡Hola, {user?.user_metadata?.full_name || user?.email}! 👋
          </h1>
          <p className="text-sm text-white">Vas excelente con tus metas financieras</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex border-white bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-black transition-colors">
          <LogOut className="h-4 w-4 mr-2" />
          Salir
        </Button>
      </div>

      {/* Banner Publicitario - Carrusel */}
      <div className="mx-4 mb-4">
        <Carousel className="w-full" setApi={setApi} opts={{
        loop: true,
        align: "center"
      }}>
          <CarouselContent className="-ml-2 md:-ml-4">
            <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-[80%]">
              <Card className="relative overflow-hidden border border-border/50 h-[200px] sm:h-[240px]">
                <img src={bannerHalloween} alt="Halloween Special Sale" className="absolute inset-0 w-full h-full object-cover" />
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
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 w-fit">
                    Comprar Ahora
                  </Button>
                </div>
              </Card>
            </CarouselItem>
            
            <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-[80%]">
              <Card className="relative overflow-hidden border border-border/50 h-[200px] sm:h-[240px]">
                <img src={bannerGoals} alt="Banner de metas" className="absolute inset-0 w-full h-full object-cover" />
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
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 w-fit">
                    Comenzar
                  </Button>
                </div>
              </Card>
            </CarouselItem>
            
            <CarouselItem className="pl-2 md:pl-4 basis-[85%] md:basis-[80%]">
              <Card className="relative overflow-hidden border border-border/50 h-[200px] sm:h-[240px]">
                <img src={bannerGroups} alt="Banner de ahorro grupal" className="absolute inset-0 w-full h-full object-cover" />
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
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 w-fit">
                    Explorar
                  </Button>
                </div>
              </Card>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
      
      {/* Bottom Navigation Menu - Fixed */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 animated-wave-bg border-t border-white/20 shadow-lg">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/dashboard")}>
              <Home className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Home</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10">
              <TrendingUp className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Análisis</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10">
              <Target className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Metas</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/chat")}>
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Chat AI</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3 text-white hover:bg-white/10" onClick={() => navigate("/profile")}>
              <User className="w-5 h-5 text-white" />
              <span className="text-xs text-white">Perfil</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        
        {/* Balance Overview y Quick Stats en la misma fila */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {/* Sección 1: Balance Overview - Más grande */}
          <Card className="sm:col-span-2 p-3 sm:p-4 bg-gradient-card card-glow h-full flex flex-col justify-between animate-fade-in" style={{ animationDelay: '0ms' }}>
            <div className="space-y-2 sm:space-y-3">
              {/* Balance Principal */}
              <div>
                <p className="text-[10px] sm:text-xs text-white/80 mb-1">Te quedan</p>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    ${currentMonth.balance.toLocaleString('es-MX')}
                  </h2>
                  <span className="text-xs sm:text-sm text-white/60">MXN</span>
                </div>
              </div>

               {/* Selector de Mes */}
               <div className="flex items-center justify-center gap-1 sm:gap-2">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-6 w-6 sm:h-7 sm:w-7 text-white hover:bg-white/10" 
                   onClick={handlePrevMonth}
                 >
                   <span className="text-sm sm:text-base">&lt;</span>
                 </Button>
                 <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1">
                   <span className="text-[10px] sm:text-xs text-white font-medium capitalize">{currentMonth.month}</span>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-6 w-6 sm:h-7 sm:w-7 text-white hover:bg-white/10" 
                   onClick={handleNextMonth}
                   disabled={selectedMonthOffset === 0}
                 >
                   <span className="text-sm sm:text-base">&gt;</span>
                 </Button>
               </div>

              {/* Ingresos y Egresos */}
              <div className="grid grid-cols-2 gap-2">
                <Card 
                  className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => navigate('/ingresos')}
                >
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] text-white/80 mb-0.5">Ingresos</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-green-500">${currentMonth.income.toLocaleString('es-MX')}</p>
                  </div>
                </Card>
                <Card 
                  className="p-2 sm:p-3 bg-white/10 backdrop-blur-sm border-white/20 cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => navigate('/gastos')}
                >
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] text-white/80 mb-0.5">Gastos</p>
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-red-500">-${currentMonth.expenses.toLocaleString('es-MX')}</p>
                  </div>
                </Card>
              </div>
            </div>
          </Card>

          {/* Sección 2: Quick Stats - 3 estadísticas */}
          <div className="sm:col-span-1 grid grid-cols-3 sm:grid-cols-1 gap-2">
            <Card 
              className="p-2 sm:p-3 bg-gradient-card card-glow cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
              onClick={() => navigate('/balance')}
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/20 flex items-center justify-center mb-1 sm:mb-0">
                  <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[9px] sm:text-[10px] text-white">Balance</p>
                  <p className="text-xs sm:text-sm lg:text-base font-semibold text-white">
                    ${currentMonth.balance.toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-2 sm:p-3 bg-gradient-card card-glow animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '200ms' }}>
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-success/20 flex items-center justify-center mb-1 sm:mb-0">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[9px] sm:text-[10px] text-white">Ahorrado</p>
                  <p className="text-xs sm:text-sm lg:text-base font-semibold text-white">
                    ${goals.reduce((sum, goal) => sum + Number(goal.current), 0).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-2 sm:p-3 bg-gradient-card card-glow animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '300ms' }}>
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-warning/20 flex items-center justify-center mb-1 sm:mb-0">
                  <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[9px] sm:text-[10px] text-white">Metas</p>
                  <p className="text-xs sm:text-sm lg:text-base font-semibold text-white">{goals.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* WhatsApp Banner */}
        <Card className="p-3 sm:p-4 bg-gradient-card card-glow mb-4 animate-fade-in hover:scale-105 transition-transform duration-200" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
              <img src={whatsappLogo} alt="WhatsApp" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              
            <p className="text-xs text-white mb-2 leading-relaxed">
              Registra tus ingresos y gastos enviando mensajes a WhatsApp. ¡La IA los interpreta automáticamente!
            </p>
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white border-0 text-xs h-8" onClick={() => navigate('/whatsapp')}>
                <MessageCircle className="w-3 h-3 mr-1" />
                Conectar WhatsApp
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Goals Section */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-row justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Tus Metas</h3>
                <Button size="sm" onClick={() => navigate('/new-goal')} className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Nueva Meta
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {goals.length === 0 ? (
                  <Card className="p-6 bg-gradient-card card-glow text-center">
                    <p className="text-white/70 mb-4">No tienes metas creadas aún</p>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/new-goal')} 
                      className="bg-white/20 hover:bg-white/30 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear tu primera meta
                    </Button>
                  </Card>
                ) : (
                  goals.map(goal => {
                    const goalProgress = goal.current / goal.target * 100;
                    return <Card key={goal.id} className="p-4 sm:p-6 bg-gradient-card card-glow hover-lift">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap space-x-2 mb-2 gap-1">
                              <h4 className="text-base sm:text-lg font-semibold text-white">{goal.title}</h4>
                              {goal.type === 'group' && <Badge variant="outline" className="text-xs text-white border-white/30">
                                  <Users className="w-3 h-3 mr-1" />
                                  {goal.members} personas
                                </Badge>}
                            </div>
                            <p className="text-xs sm:text-sm text-white">Meta: {goal.deadline}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-base sm:text-lg font-semibold text-white">
                              ${Number(goal.current).toLocaleString()}
                            </p>
                            <p className="text-xs sm:text-sm text-white">
                              de ${Number(goal.target).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <Progress value={goalProgress} className="h-2 sm:h-3 mb-2" />
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-white">{Math.round(goalProgress)}% completado</span>
                          <span className="text-white font-medium">
                            ${(Number(goal.target) - Number(goal.current)).toLocaleString()} restante
                          </span>
                        </div>
                      </Card>;
                  })
                )}
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
                    ¡Hola! 👋 Soy tu coach financiero personal.
                    <br /><br />
                    Estoy aquí para ayudarte a mejorar tus finanzas, crear metas de ahorro y darte consejos personalizados. ¿Empezamos? 💰
                  </p>
                </div>
              </div>

              <Button size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30" onClick={() => navigate("/chat")}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Chatear con Moni AI
              </Button>
            </Card>

            {/* Financial Analysis with AI */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-white">Análisis Financiero</h4>
                  <p className="text-xs text-white">Insights con IA</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="bg-white/10 rounded-2xl rounded-bl-md p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-white">
                    📊 Obtén análisis detallado de tus finanzas con IA
                    <br /><br />
                    • Métricas y gráficas
                    <br />
                    • Proyecciones personalizadas
                    <br />
                    • Recomendaciones inteligentes
                  </p>
                </div>
              </div>

              <Button size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30" onClick={() => navigate("/analysis")}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Análisis
              </Button>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm sm:text-base font-semibold text-white">Movimientos Recientes</h4>
                <Button variant="ghost" size="sm" className="text-xs text-white hover:bg-white/10">
                  Ver todos
                </Button>
              </div>
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <p className="text-white/70 text-sm text-center py-4">
                    No hay transacciones registradas aún
                  </p>
                ) : (
                  recentTransactions.map(transaction => <div key={transaction.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-white">
                          {transaction.categories?.name || 'Sin categoría'} • {new Date(transaction.transaction_date).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${transaction.type === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.type === 'ingreso' ? '+' : '-'}${Math.abs(Number(transaction.amount))}
                      </span>
                    </div>)
                )}
              </div>
            </Card>

            {/* Achievements */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm sm:text-base font-semibold text-white flex items-center">
                  <Trophy className="w-4 h-4 mr-2 text-white" />
                  Logros Recientes
                </h4>
                <Button variant="ghost" size="sm" className="text-xs text-white hover:bg-white/10">
                  Ver todos
                </Button>
              </div>
              <div className="space-y-3">
                {achievements.length === 0 ? (
                  <p className="text-white/70 text-sm text-center py-4">
                    No hay logros aún. ¡Empieza a usar la app para desbloquearlos!
                  </p>
                ) : (
                  achievements.map(achievement => <div key={achievement.id} className={`p-3 rounded-lg border ${achievement.earned ? 'border-white/30 bg-white/10' : 'border-white/20 bg-white/5'}`}>
                      <div className="flex items-start space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${achievement.earned ? 'bg-white text-black' : 'bg-gray-600'}`}>
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
                    </div>)
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Logout Button for Mobile - At the bottom */}
        <div className="md:hidden mt-6 pb-4">
          <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
      </div>
    </div>;
};
export default Dashboard;