import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { ScrollArea } from '@/components/ui/scroll-area';
import Autoplay from 'embla-carousel-autoplay';
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
  const [budgetMessage, setBudgetMessage] = useState<string>("✅ Dentro del presupuesto del mes");
  const [loadingBudgetMessage, setLoadingBudgetMessage] = useState(false);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = mes actual, 1 = mes anterior, etc.
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<any[]>([]);
  const [creditCardDebts, setCreditCardDebts] = useState<any[]>([]);
  const [hasBankConnections, setHasBankConnections] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [scoreMoni, setScoreMoni] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [proyecciones, setProyecciones] = useState<{
    proyeccionAnual: number;
    proyeccionSemestral: number;
    confianza: string;
    insights: Array<{
      titulo: string;
      metrica: string;
      descripcion: string;
      tipo: 'positivo' | 'negativo' | 'neutral' | 'consejo';
    }>;
  } | null>(null);
  const [loadingProyecciones, setLoadingProyecciones] = useState(false);
  const [isUpdatingProjections, setIsUpdatingProjections] = useState(false);
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
        const savingsRate = balance / monthlyIncome * 100;
        if (savingsRate > 20) score += 10;
      }

      // Goals factor (up to +10 points)
      if (goals.length > 0) score += 5;
      if (goals.some(g => Number(g.current) > 0)) score += 5;

      // Fixed expenses control (up to +10 points)
      if (monthlyIncome > 0) {
        const fixedRatio = fixedExpenses / monthlyIncome * 100;
        if (fixedRatio < 50) score += 10;else if (fixedRatio < 70) score += 5;
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
          }).limit(20);
          if (recentError) throw recentError;
          setRecentTransactions(recentData || []);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
    fetchTransactions();
  }, [selectedMonthOffset]);

  // Fetch upcoming subscriptions and bank connections
  useEffect(() => {
    const fetchSubscriptionsAndDebts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for bank connections
        const { data: bankData } = await supabase
          .from('bank_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        setHasBankConnections((bankData?.length || 0) > 0);

        // Fetch all expense transactions from last 6 months for AI analysis
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: allExpenses, error: expensesError } = await supabase
          .from('transactions')
          .select('*, categories(name)')
          .eq('user_id', user.id)
          .eq('type', 'gasto')
          .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
          .order('transaction_date', { ascending: false });

        console.log('📊 Gastos encontrados para análisis:', allExpenses?.length || 0);

        if (allExpenses && allExpenses.length > 0) {
          try {
            // Use AI to detect subscriptions
            const { data: aiResult, error: aiError } = await supabase.functions.invoke('detect-subscriptions', {
              body: { transactions: allExpenses }
            });

            console.log('🤖 Resultado de IA:', aiResult);
            console.log('❌ Error de IA:', aiError);

            // Agrupar por nombre de concepto para mostrar solo UNO por tipo
            const uniqueSubs = new Map();
            (aiResult?.subscriptions || []).forEach((sub: any) => {
              const normalizedName = sub.description.toLowerCase()
                .replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '')
                .replace(/\s*\d{4}$/g, '')
                .trim();
              
              if (!uniqueSubs.has(normalizedName)) {
                uniqueSubs.set(normalizedName, {
                  name: sub.description.replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '').trim(),
                  amount: Number(sub.amount),
                  icon: getSubscriptionIcon(sub.description),
                  frequency: sub.frequency || 'mensual',
                });
              }
            });

            const detectedSubs = Array.from(uniqueSubs.values()).map((sub: any, index: number) => ({
              id: `ai-sub-${index}`,
              name: sub.name,
              amount: sub.amount,
              icon: sub.icon,
              dueDate: calculateNextDueDate(sub.frequency),
            }));

            console.log('✅ Suscripciones únicas detectadas:', detectedSubs.length);
            setUpcomingSubscriptions(detectedSubs);
          } catch (aiError) {
            console.error('Error calling AI:', aiError);
            setUpcomingSubscriptions([]);
          }
        } else {
          console.log('⚠️ No hay gastos para analizar');
          setUpcomingSubscriptions([]);
        }

        // Mock credit card debts (esto se obtendría de la conexión bancaria real)
        if (bankData && bankData.length > 0) {
          setCreditCardDebts([
            { name: 'Tarjeta Principal', balance: 15420.50, limit: 30000, percentage: 51.4 },
            { name: 'Tarjeta Oro', balance: 8250.00, limit: 20000, percentage: 41.3 },
            { name: 'Tarjeta Platino', balance: 3100.00, limit: 15000, percentage: 20.7 },
          ]);
        } else {
          setCreditCardDebts([]);
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      }
    };

    fetchSubscriptionsAndDebts();
  }, []);

  const getSubscriptionIcon = (description: string): string => {
    const lower = description.toLowerCase();
    if (lower.includes('netflix')) return '🎬';
    if (lower.includes('spotify')) return '🎵';
    if (lower.includes('amazon') || lower.includes('prime')) return '📦';
    if (lower.includes('disney')) return '🏰';
    if (lower.includes('hbo')) return '🎭';
    if (lower.includes('gym') || lower.includes('gimnasio')) return '💪';
    if (lower.includes('internet')) return '📡';
    if (lower.includes('luz') || lower.includes('electricidad')) return '💡';
    if (lower.includes('agua')) return '💧';
    if (lower.includes('gas')) return '🔥';
    return '💳';
  };

  const calculateNextDueDate = (frequency: string): Date => {
    const now = new Date();
    if (frequency === 'semanal') {
      now.setDate(now.getDate() + 7);
    } else if (frequency === 'quincenal') {
      now.setDate(now.getDate() + 15);
    } else {
      now.setMonth(now.getMonth() + 1);
    }
    return now;
  };

  // Fetch AI budget analysis whenever expenses change
  useEffect(() => {
    if (selectedMonthOffset !== 0) return; // Solo analizar el mes actual
    
    const fetchBudgetAnalysis = async () => {
      if (monthlyIncome === 0) {
        setBudgetMessage("✅ Dentro del presupuesto del mes");
        return;
      }

      try {
        setLoadingBudgetMessage(true);
        
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysIntoMonth = now.getDate();

        const { data, error } = await supabase.functions.invoke('analyze-budget', {
          body: {
            monthlyIncome,
            monthlyExpenses,
            daysIntoMonth,
            daysInMonth
          }
        });

        if (error) {
          console.error('Error analyzing budget:', error);
          // Fallback a lógica simple
          const budget = monthlyIncome * 0.8;
          const percentageSpent = (monthlyExpenses / budget) * 100;
          if (percentageSpent > 90) {
            setBudgetMessage("⚠️ Hay que mejorar o no lograremos el presupuesto del mensual");
          } else if (percentageSpent > 75) {
            setBudgetMessage("⚡ Se debe de ahorrar un poco más");
          } else {
            setBudgetMessage("✅ Dentro del presupuesto del mes");
          }
        } else {
          setBudgetMessage(data?.message || "✅ Dentro del presupuesto del mes");
        }
      } catch (error) {
        console.error('Error calling budget analysis:', error);
        setBudgetMessage("✅ Dentro del presupuesto del mes");
      } finally {
        setLoadingBudgetMessage(false);
      }
    };

    fetchBudgetAnalysis();
  }, [monthlyIncome, monthlyExpenses, selectedMonthOffset]);

  // Fetch AI projections
  useEffect(() => {
    if (isUpdatingProjections) return;
    
    if (monthlyIncome > 0 || monthlyExpenses > 0) {
      fetchAIProjections();
    } else {
      setProyecciones({
        proyeccionAnual: 0,
        proyeccionSemestral: 0,
        confianza: 'sin-datos',
        insights: [{
          titulo: 'Sin Datos Suficientes',
          metrica: '0 transacciones',
          descripcion: 'Aún no hay suficientes datos para hacer proyecciones. Empieza registrando tus ingresos y gastos.',
          tipo: 'neutral'
        }]
      });
      setLoadingProyecciones(false);
    }
  }, [monthlyIncome, monthlyExpenses]);

  const fetchAIProjections = async () => {
    if (isUpdatingProjections) return;
    
    try {
      setIsUpdatingProjections(true);
      setLoadingProyecciones(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month transactions
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .gte('transaction_date', firstDay.toISOString().split('T')[0])
        .lte('transaction_date', lastDay.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });

      // Get ALL historical transactions
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      const periodLabel = getMonthName(0);

      const { data, error } = await supabase.functions.invoke('predict-savings', {
        body: {
          userId: user.id,
          transactions,
          allTransactions,
          totalIngresos: monthlyIncome,
          totalGastos: monthlyExpenses,
          balance: monthlyIncome - monthlyExpenses,
          viewMode: 'mensual',
          periodLabel
        }
      });

      if (error) throw error;
      setProyecciones(data);
    } catch (error) {
      console.error('Error fetching AI projections:', error);
      const balance = monthlyIncome - monthlyExpenses;
      setProyecciones({
        proyeccionAnual: balance * 12,
        proyeccionSemestral: balance * 6,
        confianza: 'baja',
        insights: [{
          titulo: 'Proyección Simple',
          metrica: 'Básica',
          descripcion: 'Proyección simple basada en balance actual',
          tipo: 'neutral'
        }]
      });
    } finally {
      setLoadingProyecciones(false);
      setIsUpdatingProjections(false);
    }
  };

  // Actualización en tiempo real de transacciones
  useEffect(() => {
    const channel = supabase.channel('schema-db-changes').on('postgres_changes', {
      event: '*',
      // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'transactions'
    }, () => {
      // Recargar transacciones cuando haya cambios
      const fetchRecentTransactions = async () => {
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
          } = await supabase.from('transactions').select('*, categories(name, color)').eq('user_id', user.id).order('transaction_date', {
            ascending: false
          }).limit(20);
          if (error) throw error;
          setRecentTransactions(data || []);
        } catch (error) {
          console.error('Error fetching recent transactions:', error);
        }
      };
      fetchRecentTransactions();
    }).subscribe();
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
          <Card className={`p-4 card-glow border-white/20 hover:scale-105 transition-transform duration-200 ${scoreMoni >= 70 ? 'bg-gradient-to-br from-success/90 to-success/70' : scoreMoni >= 40 ? 'bg-gradient-to-br from-warning/90 to-warning/70' : 'bg-gradient-to-br from-danger/90 to-danger/70'}`}>
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
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-success/30 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-success-foreground" />
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
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-warning/30 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <Target className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-warning-foreground" />
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

        {/* Presupuesto Mensual */}
        <Card className="p-5 bg-gradient-to-br from-[hsl(220,45%,18%)] to-[hsl(240,40%,12%)] card-glow shadow-2xl border-2 border-[hsl(220,50%,35%)]/40 relative overflow-hidden">
          {/* Efecto brillante de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" 
               style={{
                 backgroundSize: '200% 100%',
                 animation: 'shimmer 3s ease-in-out infinite',
               }}
          />
          
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white drop-shadow-lg">💰 Presupuesto Mensual</h3>
                <p className="text-xs text-white/80 font-medium">
                  Gastado: ${monthlyExpenses.toLocaleString('es-MX')} de ${(monthlyIncome * 0.8).toLocaleString('es-MX')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white drop-shadow-lg">
                  {monthlyIncome > 0 ? ((monthlyExpenses / (monthlyIncome * 0.8)) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-white/70 font-semibold">del presupuesto</p>
              </div>
            </div>
            
            <div className="relative">
              {/* Barra de fondo */}
              <div className="h-6 rounded-full bg-gradient-to-r from-[hsl(220,60%,10%)] to-[hsl(240,55%,8%)] border border-white/10 overflow-hidden shadow-inner">
                {/* Barra de progreso animada */}
                <div 
                  className={`h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out ${
                    monthlyIncome > 0 && (monthlyExpenses / (monthlyIncome * 0.8)) * 100 > 90 
                      ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600' 
                      : monthlyIncome > 0 && (monthlyExpenses / (monthlyIncome * 0.8)) * 100 > 75 
                      ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500' 
                      : 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500'
                  }`}
                  style={{ 
                    width: `${monthlyIncome > 0 ? Math.min((monthlyExpenses / (monthlyIncome * 0.8)) * 100, 100) : 0}%`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s ease-in-out infinite',
                    boxShadow: monthlyIncome > 0 && (monthlyExpenses / (monthlyIncome * 0.8)) * 100 > 90 
                      ? '0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)' 
                      : monthlyIncome > 0 && (monthlyExpenses / (monthlyIncome * 0.8)) * 100 > 75 
                      ? '0 0 20px rgba(251, 191, 36, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)' 
                      : '0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {/* Efecto de brillo superior */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent" />
                  {/* Animación de pulso/onda */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[slide_1.5s_ease-in-out_infinite]" 
                       style={{
                         backgroundSize: '50% 100%',
                         animation: 'slide 1.5s ease-in-out infinite',
                       }}
                  />
                </div>
              </div>
              
              {/* Texto sobre la barra */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm">
                  ${(monthlyIncome > 0 ? (monthlyIncome * 0.8) - monthlyExpenses : 0).toLocaleString('es-MX')} restantes
                </span>
              </div>
            </div>
            
            <p className="text-xs text-white/80 text-center font-semibold min-h-[32px] flex items-center justify-center">
              {loadingBudgetMessage ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                  Analizando patrón...
                </span>
              ) : (
                budgetMessage
              )}
            </p>
          </div>
          
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            @keyframes slide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}</style>
        </Card>

        {/* Grid de 2 columnas: Suscripciones y Deudas - Alineados horizontalmente siempre */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Widget de Suscripciones Próximas */}
          <Card className="p-3 bg-gradient-to-br from-[hsl(280,45%,18%)] to-[hsl(300,40%,12%)] card-glow shadow-2xl border-2 border-[hsl(280,50%,35%)]/40 relative overflow-hidden h-[220px] flex flex-col cursor-pointer hover:scale-105 transition-transform duration-200 active:scale-95">
            {/* Efecto brillante */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" 
                 style={{
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 3s ease-in-out infinite',
                 }}
            />
            
            <div className="space-y-2 relative z-10 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-bold text-white drop-shadow-lg">📅 Pagos Recurrentes</h3>
                <span className="text-[10px] text-white/70 font-semibold">{upcomingSubscriptions.length}</span>
              </div>

              {upcomingSubscriptions.length === 0 ? (
                <div className="text-center py-3 flex-1 flex flex-col justify-center">
                  <p className="text-[10px] text-white/70 mb-1">Analizando gastos...</p>
                  <p className="text-[9px] text-white/50">La IA detectará suscripciones</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 min-h-0 pr-1">
                    <div className="space-y-0.5">
                      {upcomingSubscriptions.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="flex items-center gap-0.5 sm:gap-2 py-0.5 sm:py-2 px-1 sm:px-3 bg-white/10 rounded backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all min-h-[18px] sm:min-h-[40px]"
                        >
                          <div className="w-3 h-3 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[6px] sm:text-base shadow-lg shrink-0">
                            {sub.icon}
                          </div>
                          <p className="text-[6px] sm:text-sm font-bold text-white truncate leading-none flex-1 min-w-0">{sub.name}</p>
                          <p className="text-[6px] sm:text-base font-black text-white shrink-0 leading-none">${sub.amount.toFixed(0)}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="pt-2 border-t border-white/20 mt-2 flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] text-white/70">Total mensual</p>
                      <p className="text-xs font-black text-white drop-shadow-lg">
                        ${upcomingSubscriptions.reduce((sum, s) => sum + s.amount, 0).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Widget de Deudas de Tarjetas */}
          <Card className="p-3 bg-gradient-to-br from-[hsl(0,45%,18%)] to-[hsl(15,40%,12%)] card-glow shadow-2xl border-2 border-[hsl(0,50%,35%)]/40 relative overflow-hidden h-[220px] flex flex-col cursor-pointer hover:scale-105 transition-transform duration-200 active:scale-95">
            {/* Efecto brillante */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" 
                 style={{
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 3s ease-in-out infinite',
                 }}
            />
            
            <div className="space-y-2 relative z-10 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-bold text-white drop-shadow-lg">💳 Deudas</h3>
              </div>

              {!hasBankConnections ? (
                <div className="text-center py-3 flex-1 flex flex-col justify-center">
                  <div className="mb-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-2">
                      <span className="text-xl">🏦</span>
                    </div>
                    <p className="text-[10px] text-white/80 mb-1 font-semibold">Conecta tus cuentas</p>
                    <p className="text-[9px] text-white/60 mb-3">Monitorea tu salud</p>
                  </div>
                  <Button 
                    onClick={() => navigate('/bank-connection')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold text-[9px] px-3 py-1.5 h-auto"
                  >
                    Conectar
                  </Button>
                </div>
              ) : creditCardDebts.length === 0 ? (
                <div className="text-center py-3 flex-1 flex flex-col justify-center">
                  <p className="text-sm font-bold text-green-400 drop-shadow-lg">✅ Sin deudas</p>
                  <p className="text-[10px] text-white/70 mt-1">¡Excelente!</p>
                </div>
              ) : (
                <>
                  <div className="text-center py-2 flex-shrink-0">
                    <p className="text-[9px] text-white/70 mb-1">Total adeudado</p>
                    <p className="text-xl font-black text-red-400 drop-shadow-lg">
                      ${creditCardDebts.reduce((sum, card) => sum + card.balance, 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                  
                  <ScrollArea className="flex-1 min-h-0 pr-1">
                    <div className="space-y-0.5">
                      {creditCardDebts.map((card, index) => (
                        <div key={index} className="bg-white/10 rounded py-0.5 sm:py-2 px-1 sm:px-3 backdrop-blur-sm border border-white/20 min-h-[18px] sm:min-h-[50px]">
                          <div className="flex items-center justify-between gap-0.5 sm:gap-2 mb-0 sm:mb-1">
                            <p className="text-[6px] sm:text-sm font-bold text-white truncate flex-1 min-w-0 leading-none">{card.name}</p>
                            <p className="text-[6px] sm:text-base font-black text-red-400 shrink-0 leading-none">${card.balance.toLocaleString('es-MX')}</p>
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                            <div className="flex-1 h-[1.5px] sm:h-2 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                                style={{ width: `${card.percentage}%` }}
                              />
                            </div>
                            <p className="text-[5px] sm:text-xs text-white/80 font-semibold leading-none">{card.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Proyecciones Inteligentes */}
        <Card className="p-5 bg-gradient-card card-glow shadow-elegant border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-card-foreground">Proyecciones Inteligentes</h3>
            {proyecciones && (
               <Badge className={`whitespace-nowrap px-3 ${
                 proyecciones.confianza === 'sin-datos' || proyecciones.proyeccionAnual <= 0
                   ? 'bg-red-500/20 text-red-200 border-red-500/30'
                   : proyecciones.confianza?.toLowerCase() === 'alta'
                   ? 'bg-green-500/20 text-green-200 border-green-500/30'
                   : proyecciones.confianza?.toLowerCase() === 'media'
                   ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
                   : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30'
               }`}>
                {proyecciones.confianza === 'sin-datos' 
                  ? 'Sin datos'
                  : `Confianza ${proyecciones.confianza}`
                }
              </Badge>
            )}
          </div>

          {loadingProyecciones ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-card-foreground"></div>
              <p className="text-card-foreground/70 mt-2 text-sm">Analizando patrones financieros...</p>
            </div>
          ) : proyecciones ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-card-foreground/70 mb-1">
                    Proyección Anual
                  </p>
                  <p className="text-xl font-bold text-card-foreground">
                    ${proyecciones.proyeccionAnual.toLocaleString('es-MX')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-card-foreground/70 mb-1">
                    Proyección Semestral
                  </p>
                  <p className="text-xl font-bold text-card-foreground">
                    ${proyecciones.proyeccionSemestral.toLocaleString('es-MX')}
                  </p>
                </div>
              </div>
              
              {(() => {
                // Generar insights dinámicos basados en métricas reales
                const dynamicInsights = [];
                
                // Insight mensual - Gastos
                const gastosMensuales = currentMonth.expenses;
                const ingresosMensuales = currentMonth.income;
                const ahorroMensual = ingresosMensuales - gastosMensuales;
                const porcentajeAhorro = ingresosMensuales > 0 ? (ahorroMensual / ingresosMensuales) * 100 : 0;
                
                dynamicInsights.push({
                  titulo: `💰 Resumen Mensual`,
                  descripcion: `Este mes has gastado $${gastosMensuales.toLocaleString('es-MX')} de $${ingresosMensuales.toLocaleString('es-MX')} de ingresos. ${porcentajeAhorro >= 20 ? `¡Excelente! Estás ahorrando ${porcentajeAhorro.toFixed(0)}% 🎉` : porcentajeAhorro >= 10 ? `Estás ahorrando ${porcentajeAhorro.toFixed(0)}% 👍` : `Intenta ahorrar más, actualmente ${porcentajeAhorro.toFixed(0)}% 📊`}`,
                  tipo: porcentajeAhorro >= 20 ? 'positivo' : porcentajeAhorro >= 10 ? 'consejo' : 'negativo'
                });

                // Insight anual - Proyección
                if (proyecciones.proyeccionAnual > 0) {
                  dynamicInsights.push({
                    titulo: `📈 Proyección Anual`,
                    descripcion: `Si mantienes tu ritmo actual, podrías ahorrar $${proyecciones.proyeccionAnual.toLocaleString('es-MX')} este año. ${proyecciones.proyeccionAnual > 50000 ? '¡Vas muy bien!' : proyecciones.proyeccionAnual > 20000 ? 'Buen progreso.' : 'Puedes mejorar tus ahorros.'}`,
                    tipo: proyecciones.proyeccionAnual > 50000 ? 'positivo' : 'consejo'
                  });
                }

                // Insight de metas
                const metasProgress = goals.length > 0 
                  ? goals.reduce((sum, g) => sum + (Number(g.current) / Number(g.target) * 100), 0) / goals.length 
                  : 0;
                
                if (goals.length > 0) {
                  dynamicInsights.push({
                    titulo: `🎯 Progreso de Metas`,
                    descripcion: `Tienes ${goals.length} meta${goals.length > 1 ? 's' : ''} activa${goals.length > 1 ? 's' : ''} con un promedio de ${metasProgress.toFixed(0)}% completado. ${metasProgress >= 60 ? '¡Estás cerca de lograrlas! 🌟' : metasProgress >= 30 ? 'Sigue avanzando poco a poco 💪' : 'Dale más impulso a tus objetivos 🚀'}`,
                    tipo: metasProgress >= 60 ? 'positivo' : 'consejo'
                  });
                }

                // Insight de balance
                const balanceActual = currentMonth.balance;
                dynamicInsights.push({
                  titulo: `💳 Balance Actual`,
                  descripcion: `Tu balance es de $${balanceActual.toLocaleString('es-MX')}. ${balanceActual > 10000 ? '¡Tienes un colchón financiero sólido! 💪' : balanceActual > 5000 ? 'Mantén un buen control de gastos 👍' : balanceActual > 0 ? 'Considera aumentar tu ahorro de emergencia 📋' : 'Trabaja en generar más ingresos o reducir gastos 🎯'}`,
                  tipo: balanceActual > 5000 ? 'positivo' : balanceActual > 0 ? 'consejo' : 'negativo'
                });

                // Insight de gastos fijos
                const porcentajeGastosFijos = ingresosMensuales > 0 ? (fixedExpenses / ingresosMensuales) * 100 : 0;
                dynamicInsights.push({
                  titulo: `🏠 Gastos Fijos`,
                  descripcion: `Tus gastos fijos representan ${porcentajeGastosFijos.toFixed(0)}% de tus ingresos ($${fixedExpenses.toLocaleString('es-MX')}). ${porcentajeGastosFijos <= 50 ? '¡Excelente control! 🎉' : porcentajeGastosFijos <= 70 ? 'Dentro de un rango aceptable 📊' : 'Intenta reducir gastos fijos para mayor flexibilidad ⚠️'}`,
                  tipo: porcentajeGastosFijos <= 50 ? 'positivo' : porcentajeGastosFijos <= 70 ? 'consejo' : 'negativo'
                });

                // Combinar insights dinámicos con insights de AI
                const allInsights = [
                  ...dynamicInsights,
                  ...(proyecciones.insights || [])
                ];

                return allInsights.length > 0 ? (
                  <Carousel 
                    className="w-full"
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    plugins={[
                      Autoplay({
                        delay: 5000,
                      }),
                    ]}
                  >
                    <CarouselContent>
                      {allInsights.map((insight, index) => (
                        <CarouselItem key={index}>
                          <div className={`bg-card/30 rounded-lg p-4 border transition-all duration-300 ${
                            insight.tipo === 'positivo' 
                              ? 'border-success/30 bg-success/5 hover:border-success/50'
                              : insight.tipo === 'negativo'
                              ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
                              : insight.tipo === 'consejo'
                              ? 'border-accent/30 bg-accent/5 hover:border-accent/50'
                             : 'border-border/20 hover:border-border/40'
                          }`}>
                            <div className="mb-2">
                              <h4 className="text-base font-semibold text-card-foreground">{insight.titulo}</h4>
                            </div>
                            <p className="text-sm text-card-foreground/80 leading-relaxed">{insight.descripcion}</p>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : null;
              })()}
            </>
          ) : (
            <p className="text-card-foreground/70 text-center py-4">
              Cargando proyecciones...
            </p>
          )}
        </Card>

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
            
            {/* Recent Transactions */}
            <Card className="p-3 bg-gradient-to-br from-[hsl(45,60%,25%)] to-[hsl(38,55%,15%)] card-glow shadow-2xl border-2 border-[hsl(45,70%,45%)]/40 relative overflow-hidden h-[220px] flex flex-col cursor-pointer hover:scale-105 transition-transform duration-200 active:scale-95">
              {/* Efecto brillante */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" 
                   style={{
                     backgroundSize: '200% 100%',
                     animation: 'shimmer 3s ease-in-out infinite',
                   }}
              />
              
              <div className="space-y-2 relative z-10 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-sm sm:text-xs font-bold text-white drop-shadow-lg">📊 Movimientos Recientes</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] sm:text-[9px] text-white hover:bg-white/10 hover:scale-105 transition-transform duration-200 h-6 px-2"
                    onClick={() => navigate('/gastos')}
                  >
                    Ver todas
                  </Button>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="text-center py-3 flex-1 flex flex-col justify-center">
                    <p className="text-xs sm:text-[10px] text-white/70 mb-1">Sin movimientos</p>
                    <p className="text-[10px] sm:text-[9px] text-white/50">Registra tu primer transacción</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <div className="space-y-1 sm:space-y-0.5">
                      {recentTransactions.map((transaction) => (
                        <div 
                          key={transaction.id}
                          className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2 px-2 sm:px-3 bg-white/10 rounded backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all min-h-[50px] sm:min-h-[40px]"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-700 flex items-center justify-center text-sm sm:text-base shadow-lg shrink-0">
                            {transaction.type === 'ingreso' ? '💰' : '💳'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] sm:text-[10px] text-white/60">
                                {new Date(transaction.transaction_date).toLocaleDateString('es-MX')}
                              </span>
                              {transaction.categories?.name && (
                                <>
                                  <span className="text-[10px] sm:text-[10px] text-white/60">•</span>
                                  <span className="text-[10px] sm:text-[10px] text-white/60 truncate">
                                    {transaction.categories.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <p className={`text-xs sm:text-base font-black shrink-0 leading-tight ${transaction.type === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                            {transaction.type === 'ingreso' ? '+' : '-'}${Number(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Achievements */}
            
          </div>
        </div>

      </div>

      <BottomNav />
    </div>;
};
export default Dashboard;