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
import { Target, TrendingUp, Wallet, Trophy, Zap, Users, MessageCircle, Settings, Bell, Plus, LogOut, Home, User, BarChart3, AlertCircle } from 'lucide-react';
import moniLogo from '/moni-logo.png';
import SafeToSpendWidget from '@/components/analysis/SafeToSpendWidget';
import AICoachInsightsWidget from '@/components/analysis/AICoachInsightsWidget';
import BottomNav from '@/components/BottomNav';
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
  const [fixedExpenses, setFixedExpenses] = useState(0);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = mes actual, 1 = mes anterior, etc.
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [scoreMoni, setScoreMoni] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Datos por mes
  const getMonthName = (offset: number) => {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return targetDate.toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric'
    });
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

  // Success tips rotation
  const successTips = [{
    emoji: "✅",
    title: "¡Vas excelente!",
    message: "Tus finanzas están saludables este mes"
  }, {
    emoji: "💪",
    title: "¡Sigue así!",
    message: "Has gastado 15% menos en delivery este mes"
  }, {
    emoji: "🎯",
    title: "¡Bien hecho!",
    message: "Llevas 3 días sin gastos hormiga"
  }, {
    emoji: "📊",
    title: "¡Gran progreso!",
    message: "Este mes ahorraste más que el anterior"
  }, {
    emoji: "🌟",
    title: "¡Increíble!",
    message: "Has reducido gastos en el Oxxo un 20%"
  }, {
    emoji: "💰",
    title: "¡Excelente control!",
    message: "Tus gastos fijos están dentro del presupuesto"
  }];

  // Auto-rotate success tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % successTips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;
        const {
          data,
          error
        } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', {
          ascending: false
        });
        if (error) throw error;
        setGoals(data || []);
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };
    fetchGoals();
  }, []);

  // Calculate Score Moni instantly based on local data
  useEffect(() => {
    const calculateScoreMoni = () => {
      // Simple instant calculation based on available data
      let score = 40; // Base score
      
      // Income factor (up to +20 points)
      if (monthlyIncome > 0) {
        score += 10;
        if (monthlyIncome > 50000) score += 10;
      }
      
      // Balance factor (up to +20 points)
      const balance = monthlyIncome - monthlyExpenses;
      if (balance > 0) {
        score += 10;
        const savingsRate = (balance / monthlyIncome) * 100;
        if (savingsRate > 20) score += 10;
      }
      
      // Goals factor (up to +10 points)
      if (goals.length > 0) score += 5;
      if (goals.some(g => Number(g.current) > 0)) score += 5;
      
      // Fixed expenses control (up to +10 points)
      if (monthlyIncome > 0) {
        const fixedRatio = (fixedExpenses / monthlyIncome) * 100;
        if (fixedRatio < 50) score += 10;
        else if (fixedRatio < 70) score += 5;
      }
      
      setScoreMoni(Math.min(100, Math.max(0, score)));
    };
    
    calculateScoreMoni();
  }, [monthlyIncome, monthlyExpenses, fixedExpenses, goals]);

  // Fetch recent transactions and calculate monthly totals
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;

        // Calculate the selected month's dates
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth() - selectedMonthOffset, 1);
        const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        // Fetch all transactions for selected month
        const {
          data: allTransactions,
          error: allError
        } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('transaction_date', firstDay.toISOString().split('T')[0]).lte('transaction_date', lastDay.toISOString().split('T')[0]);
        if (allError) throw allError;

        // Calculate monthly totals
        const income = allTransactions?.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const expenses = allTransactions?.filter(t => t.type === 'gasto').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Calculate fixed expenses (rent, utilities, subscriptions, etc.)
        const fixedExpensesCategories = ['22cecde3-c7c8-437e-9b9d-d73bc7f3bdfe',
        // Luz
        'c88f9517-ba61-4420-bc49-ba6261c37e9c',
        // Agua
        '4675137c-d5b5-4679-b308-6259762ea100',
        // Internet
        'c4d8514f-54be-4fba-8300-b18164d78790',
        // Teléfono
        '77bc7935-51b3-418b-9945-7028c27d47ec',
        // Gas
        '8544dcaa-4114-4893-aa38-c4372c46a821',
        // Netflix
        'eba3ecce-a824-41d3-8209-175902e66cb9',
        // Spotify
        '94c263d1-aed5-4399-b5af-da3dfe758b58',
        // Amazon Prime
        'd81abe12-0879-49bc-9d94-ebf7c3e9e315',
        // Disney+
        'd9251ee1-749f-4cc7-94a2-ceb19a16fd8c',
        // HBO Max
        'e50cbb0b-6f45-4afd-bf09-218e413a3086' // Gym
        ];
        const fixed = allTransactions?.filter(t => t.type === 'gasto' && (fixedExpensesCategories.includes(t.category_id) || t.description?.toLowerCase().includes('renta'))).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        setMonthlyIncome(income);
        setMonthlyExpenses(expenses);
        setFixedExpenses(fixed);

        // Fetch recent transactions for display (always from current month for recent view)
        if (selectedMonthOffset === 0) {
          const {
            data: recentData,
            error: recentError
          } = await supabase.from('transactions').select('*, categories(name, color)').eq('user_id', user.id).order('transaction_date', {
            ascending: false
          }).limit(5);
          if (recentError) throw recentError;
          setRecentTransactions(recentData || []);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
    fetchTransactions();
  }, [selectedMonthOffset]);

  // Actualización en tiempo real de transacciones
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transactions'
        },
        () => {
          // Recargar transacciones cuando haya cambios
          const fetchRecentTransactions = async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { data, error } = await supabase
                .from('transactions')
                .select('*, categories(name, color)')
                .eq('user_id', user.id)
                .order('transaction_date', { ascending: false })
                .limit(5);

              if (error) throw error;
              setRecentTransactions(data || []);
            } catch (error) {
              console.error('Error fetching recent transactions:', error);
            }
          };
          
          fetchRecentTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    // Check authentication in background - no loading screen
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
          <Button variant="ghost" className="bg-gradient-card card-glow hover:bg-white/20 text-white h-10 px-3 gap-2 hover:scale-105 transition-transform duration-200">
            <span className="text-sm font-bold">{currentXP} pts</span>
            <span className="text-xs opacity-80">Nivel {level}</span>
          </Button>
          
          {/* Botón de notificaciones */}
          <Button variant="ghost" size="icon" className="bg-gradient-card card-glow hover:bg-white/20 text-white h-10 w-10 hover:scale-105 transition-transform duration-200">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Header con saludo */}
      <div className="p-4 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            ¡Hola, {user?.user_metadata?.full_name || user?.email}! 👋
          </h1>
          <p className="text-sm text-white">Vas excelente con tus metas financieras</p>
        </div>
      </div>

      {/* Score Moni - Compacto */}
      {scoreMoni !== null && <div className="mx-4 mb-4">
          <Card className={`p-4 card-glow border-white/20 hover:scale-105 transition-transform duration-200 bg-gradient-to-br ${scoreMoni >= 70 ? 'from-emerald-500/90 to-emerald-600/90' : scoreMoni >= 40 ? 'from-yellow-500/90 to-yellow-600/90' : 'from-red-500/90 to-red-600/90'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/90 mb-1">Score Moni</p>
                <p className="text-3xl font-bold text-white">{scoreMoni}<span className="text-sm text-white/80">/100</span></p>
                <p className="text-xs text-white/90 mt-1">
                  {scoreMoni >= 70 ? '✅ Excelente' : scoreMoni >= 40 ? '⚠️ Mejorable' : '❌ Crítico'}
                </p>
              </div>
              <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/30" />
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - scoreMoni / 100)}`} className="text-white transition-all" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </Card>
        </div>}

      {/* AI Coach Insights - Carousel de recomendaciones */}
      <div className="mx-4 mb-4">
        <AICoachInsightsWidget monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} fixedExpenses={fixedExpenses} savingsGoals={goals.reduce((sum, g) => sum + (Number(g.target) - Number(g.current)), 0) / 12} balance={monthlyIncome - monthlyExpenses} />
      </div>

      <div className="mx-4 space-y-4 sm:space-y-6">
        {/* Quick Stats - 4 botones horizontales en una línea */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <Card className="p-3 bg-gradient-card card-glow cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in" onClick={() => navigate('/balance')} style={{
            animationDelay: '100ms'
          }}>
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <Wallet className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-white/80 leading-tight">Balance</p>
                <p className="text-xs sm:text-base font-bold text-white leading-tight">
                  ${(currentMonth.balance / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-card card-glow hover:scale-105 transition-transform duration-200 animate-fade-in" style={{
            animationDelay: '200ms'
          }}>
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-white/80 leading-tight">Ahorros</p>
                <p className="text-xs sm:text-base font-bold text-white leading-tight">
                  ${(goals.reduce((sum, goal) => sum + Number(goal.current), 0) / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-card card-glow hover:scale-105 transition-transform duration-200 animate-fade-in" style={{
            animationDelay: '300ms'
          }}>
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <Target className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-white/80 leading-tight">Metas</p>
                <p className="text-xs sm:text-base font-bold text-white leading-tight">{goals.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-card card-glow hover:scale-105 transition-transform duration-200 animate-fade-in" style={{
            animationDelay: '400ms'
          }}>
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <Wallet className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-white/80 leading-tight">Presupuestos</p>
                <p className="text-xs sm:text-base font-bold text-white leading-tight">
                  ${(monthlyIncome / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Safe to Spend Widget */}
        <SafeToSpendWidget safeToSpend={monthlyIncome - fixedExpenses - goals.reduce((sum, g) => sum + (Number(g.target) - Number(g.current)), 0) / 12} monthlyIncome={monthlyIncome} fixedExpenses={fixedExpenses} savingsGoals={goals.reduce((sum, g) => sum + (Number(g.target) - Number(g.current)), 0) / 12} />

        {/* Banner Publicitario - Carrusel */}
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
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-gradient-card card-glow text-white border-white/30 hover:bg-white/20 w-fit hover:scale-105 transition-transform duration-200">
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
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-gradient-card card-glow text-white border-white/30 hover:bg-white/20 w-fit hover:scale-105 transition-transform duration-200">
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
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-gradient-card card-glow text-white border-white/30 hover:bg-white/20 w-fit hover:scale-105 transition-transform duration-200">
                    Explorar
                  </Button>
                </div>
              </Card>
            </CarouselItem>
          </CarouselContent>
        </Carousel>

        {/* WhatsApp Banner */}
        <Card className="p-3 sm:p-4 bg-gradient-card card-glow animate-fade-in hover:scale-105 transition-transform duration-200" style={{
          animationDelay: '500ms'
        }}>
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
                <Button size="sm" onClick={() => navigate('/new-goal')} className="bg-gradient-card card-glow hover:bg-white/30 text-white border-white/30 text-xs sm:text-sm hover:scale-105 transition-transform duration-200">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Nueva Meta
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {goals.length === 0 ? <Card className="p-6 bg-gradient-card card-glow text-center">
                    <p className="text-white/70 mb-4">No tienes metas creadas aún</p>
                    <Button size="sm" onClick={() => navigate('/new-goal')} className="bg-gradient-card card-glow hover:bg-white/30 text-white hover:scale-105 transition-transform duration-200">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear tu primera meta
                    </Button>
                  </Card> : goals.map(goal => {
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
                 <div className="bg-gradient-card card-glow rounded-2xl rounded-bl-md p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-white">
                    ¡Hola! 👋 Soy tu coach financiero personal.
                    <br /><br />
                    Estoy aquí para ayudarte a mejorar tus finanzas, crear metas de ahorro y darte consejos personalizados. ¿Empezamos? 💰
                  </p>
                </div>
              </div>

              <Button size="sm" className="w-full bg-gradient-card card-glow hover:bg-white/30 text-white border-white/30 hover:scale-105 transition-transform duration-200" onClick={() => navigate("/chat")}>
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
                <div className="bg-gradient-card card-glow rounded-2xl rounded-bl-md p-2 sm:p-3">
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

              <Button size="sm" className="w-full bg-gradient-card card-glow hover:bg-white/30 text-white border-white/30 hover:scale-105 transition-transform duration-200" onClick={() => navigate("/analysis")}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Análisis
              </Button>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-4 sm:p-6 bg-gradient-card card-glow">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm sm:text-base font-semibold text-white">Movimientos Recientes</h4>
                <Button variant="ghost" size="sm" className="text-xs text-white hover:bg-white/10 hover:scale-105 transition-transform duration-200">
                  Ver todos
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentTransactions.length === 0 ? (
                  <p className="text-white/70 text-sm text-center py-4">
                    No hay transacciones registradas aún
                  </p>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">
                              {transaction.type === 'ingreso' ? '💰' : '💳'}
                            </span>
                            <p className="text-xs font-medium text-white">
                              {transaction.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/60">
                            <span>{new Date(transaction.transaction_date).toLocaleDateString('es-MX')}</span>
                            {transaction.categories?.name && (
                              <>
                                <span>•</span>
                                <span>{transaction.categories.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm font-bold ${transaction.type === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                          {transaction.type === 'ingreso' ? '+' : '-'}${Number(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))
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
                <Button variant="ghost" size="sm" className="text-xs text-white hover:bg-white/10 hover:scale-105 transition-transform duration-200">
                  Ver todos
                </Button>
              </div>
              <div className="space-y-3">
                {achievements.length === 0 ? <p className="text-white/70 text-sm text-center py-4">
                    No hay logros aún. ¡Empieza a usar la app para desbloquearlos!
                  </p> : achievements.map(achievement => <div key={achievement.id} className={`p-3 rounded-lg border ${achievement.earned ? 'border-white/30 bg-white/10' : 'border-white/20 bg-white/5'}`}>
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
                    </div>)}
              </div>
            </Card>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>;
};
export default Dashboard;