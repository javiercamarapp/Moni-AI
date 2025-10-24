import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { ScrollArea } from '@/components/ui/scroll-area';
import Autoplay from 'embla-carousel-autoplay';
import { useToast } from "@/hooks/use-toast";
import { useDashboardData } from "@/hooks/useDashboardData";
import bannerInvestment from '@/assets/banner-investment.jpg';
import bannerGoals from '@/assets/banner-goals.jpg';
import bannerGroups from '@/assets/banner-groups.jpg';
import bannerHalloween from '@/assets/banner-halloween.png';
import heroAuth from '@/assets/moni-ai-logo.png';
import whatsappLogo from '@/assets/whatsapp-logo.png';
import { Target, TrendingUp, Wallet, Trophy, Zap, Users, MessageCircle, Settings, Bell, Plus, LogOut, Home, User, BarChart3, AlertCircle, CreditCard, RefreshCw } from 'lucide-react';
import moniLogo from '/moni-logo.png';
import SafeToSpendWidget from '@/components/analysis/SafeToSpendWidget';
import AICoachInsightsWidget from '@/components/analysis/AICoachInsightsWidget';
import BottomNav from '@/components/BottomNav';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [currentXP, setCurrentXP] = useState(0);
  const [nextLevelXP] = useState(100);
  const [level, setLevel] = useState(1);
  const [levelQuizCompleted, setLevelQuizCompleted] = useState(false);
  const [hasAspirations, setHasAspirations] = useState(false);
  const [hasNetWorthData, setHasNetWorthData] = useState(false);
  const [totalAspiration, setTotalAspiration] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  
  // Use optimized hook for all dashboard data
  const dashboardData = useDashboardData(selectedMonthOffset);
  
  // Destructure data directly from the hook
  const {
    goals,
    scoreMoni,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    fixedExpenses,
    hasBankConnections
  } = dashboardData;
  
  // Keep local state for things that update independently
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);
  
  // Sync recentTransactions when dashboardData updates - use ref to avoid infinite loop
  useEffect(() => {
    if (JSON.stringify(recentTransactions) !== JSON.stringify(dashboardData.recentTransactions)) {
      setRecentTransactions(dashboardData.recentTransactions);
    }
  }, [dashboardData.recentTransactions]);
  
  const [loading, setLoading] = useState(false);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [budgetMessage, setBudgetMessage] = useState<string>("✅ Dentro del presupuesto del mes");
  const [loadingBudgetMessage, setLoadingBudgetMessage] = useState(false);
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<any[]>([]);
  const [creditCardDebts, setCreditCardDebts] = useState<any[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [loadingScore, setLoadingScore] = useState(false);
  const [dailyExpenses, setDailyExpenses] = useState<Array<{name: string, amount: number, icon: string}>>([]);
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
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
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

  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }
        
        setUser(user);
        
        // Get profile data including xp, level, and quiz completion
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, xp, level, level_quiz_completed")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setCurrentXP(profile.xp || 0);
          setLevel(profile.level || 1);
          setLevelQuizCompleted(profile.level_quiz_completed || false);
        }

        // Check if user has aspirations and calculate total
        const { data: aspirationsData } = await supabase
          .from("user_aspirations")
          .select("*")
          .eq("user_id", user.id);
        
        setHasAspirations((aspirationsData?.length || 0) > 0);
        
        if (aspirationsData && aspirationsData.length > 0) {
          const total = aspirationsData.reduce((sum, asp) => sum + Number(asp.value), 0);
          setTotalAspiration(total);
        }

        // Check if user has net worth data
        const { data: assetsData } = await supabase
          .from("assets")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);
        
        const { data: liabilitiesData } = await supabase
          .from("liabilities")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);
        
        setHasNetWorthData((assetsData?.length || 0) > 0 || (liabilitiesData?.length || 0) > 0);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    getUserData();
  }, [navigate]);

  // Load budget data from category_budgets
  useEffect(() => {
    const loadBudgetData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('🔍 Cargando presupuestos para usuario:', user.id);

        // Get total monthly budget from category_budgets
        const { data: budgetData, error: budgetError } = await supabase
          .from('category_budgets')
          .select('monthly_budget')
          .eq('user_id', user.id);

        console.log('📊 Presupuestos encontrados:', budgetData);
        if (budgetError) console.error('❌ Error al cargar presupuestos:', budgetError);

        if (budgetData && budgetData.length > 0) {
          const total = budgetData.reduce((sum, b) => sum + Number(b.monthly_budget), 0);
          console.log('💰 Total presupuesto:', total);
          setTotalBudget(total);
        } else {
          console.log('⚠️ No se encontraron presupuestos configurados');
          setTotalBudget(0);
        }

        // Get current month expenses
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const { data: expenseData, error: expenseError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'gasto')
          .gte('transaction_date', firstDay.toISOString().split('T')[0])
          .lte('transaction_date', lastDay.toISOString().split('T')[0]);

        console.log('💸 Gastos del mes encontrados:', expenseData?.length || 0);
        if (expenseError) console.error('❌ Error al cargar gastos:', expenseError);

        if (expenseData) {
          const total = expenseData.reduce((sum, t) => sum + Number(t.amount), 0);
          console.log('📈 Total gastos del mes:', total);
          setCurrentMonthExpenses(total);
        }
      } catch (error) {
        console.error('❌ Error general cargando datos de presupuesto:', error);
      }
    };

    loadBudgetData();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  // REMOVED: Multiple separate useEffect calls for goals, score, netWorth, transactions
  // Now using optimized useDashboardData hook

  // Fetch upcoming subscriptions and bank connections
  useEffect(() => {
    const fetchSubscriptionsAndDebts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for bank connections (already handled by dashboardData hook, no need to set)
        const { data: bankData } = await supabase
          .from('bank_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        // Calculate daily expenses for current month - get specific transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const { data: dailyExpensesData } = await supabase
          .from('transactions')
          .select('*, categories(name)')
          .eq('user_id', user.id)
          .eq('type', 'gasto')
          .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
          .lte('transaction_date', endOfMonth.toISOString().split('T')[0])
          .order('amount', { ascending: false });

        if (dailyExpensesData && dailyExpensesData.length > 0) {
          // Group by category and sum amounts
          const categoryMap = new Map<string, {name: string, total: number, icon: string}>();
          
          dailyExpensesData.forEach((transaction) => {
            const categoryName = transaction.categories?.name || transaction.description || 'Otros';
            const icon = getCategoryIcon(categoryName);
            
            if (categoryMap.has(categoryName)) {
              const existing = categoryMap.get(categoryName)!;
              existing.total += Number(transaction.amount);
            } else {
              categoryMap.set(categoryName, {
                name: categoryName,
                total: Number(transaction.amount),
                icon
              });
            }
          });
          
          // Convert to array and sort by total
          const expenses = Array.from(categoryMap.values())
            .sort((a, b) => b.total - a.total)
            .map(e => ({
              name: e.name,
              amount: e.total,
              icon: e.icon
            }));
          
          setDailyExpenses(expenses);
        }

        // Load cached subscriptions immediately for instant display
        const cachedSubs = localStorage.getItem('cachedSubscriptions');
        const lastUpdate = localStorage.getItem('subscriptionsLastUpdate');
        
        if (cachedSubs) {
          setUpcomingSubscriptions(JSON.parse(cachedSubs));
        }

        // Check if we need to update (once per day)
        const now2 = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        const shouldUpdate = !lastUpdate || (now2 - parseInt(lastUpdate)) > ONE_DAY;

        if (shouldUpdate) {
          // Ejecutar AI en background sin bloquear la UI
          setTimeout(async () => {
            try {
              // Fetch last 100 expense transactions for AI analysis (instead of all)
              const { data: allExpenses } = await supabase
                .from('transactions')
                .select('*, categories(name)')
                .eq('user_id', user.id)
                .eq('type', 'gasto')
                .order('transaction_date', { ascending: false })
                .limit(100);

              if (allExpenses && allExpenses.length > 0) {
                // Use AI to detect subscriptions
                const { data: aiResult } = await supabase.functions.invoke('detect-subscriptions', {
                  body: { transactions: allExpenses }
                });

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

                setUpcomingSubscriptions(detectedSubs);
                // Cache the results
                localStorage.setItem('cachedSubscriptions', JSON.stringify(detectedSubs));
                localStorage.setItem('subscriptionsLastUpdate', now2.toString());
              }
            } catch (aiError) {
              console.error('Error calling AI:', aiError);
            }
          }, 100); // Ejecutar después de 100ms para no bloquear
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

  const getCategoryIcon = (categoryName: string): string => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('comida') || lower.includes('restaurante') || lower.includes('alimento')) return '🍔';
    if (lower.includes('transporte') || lower.includes('uber') || lower.includes('taxi')) return '🚗';
    if (lower.includes('entretenimiento') || lower.includes('cine')) return '🎬';
    if (lower.includes('compras') || lower.includes('ropa')) return '🛍️';
    if (lower.includes('salud') || lower.includes('farmacia')) return '💊';
    if (lower.includes('café') || lower.includes('cafetería')) return '☕';
    if (lower.includes('super') || lower.includes('despensa')) return '🛒';
    if (lower.includes('gasolina') || lower.includes('combustible')) return '⛽';
    return '💰';
  };

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

      // Mostrar mensaje inmediato basado en lógica simple
      const budget = monthlyIncome * 0.8;
      const percentageSpent = (monthlyExpenses / budget) * 100;
      if (percentageSpent > 90) {
        setBudgetMessage("⚠️ Hay que mejorar o no lograremos el presupuesto del mensual");
      } else if (percentageSpent > 75) {
        setBudgetMessage("⚡ Se debe de ahorrar un poco más");
      } else {
        setBudgetMessage("✅ Dentro del presupuesto del mes");
      }

      // Luego, en background, obtener análisis AI más detallado
      try {
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

        if (!error && data?.message) {
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

      // Get todas las transacciones históricas para análisis completo
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

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'active' })
        .eq('id', challengeId);

      if (error) throw error;

      // Refresh challenges list to show the newly active challenge
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: activeData } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const activeChallenges = activeData || [];
      const slotsAvailable = 2 - activeChallenges.length;

      if (slotsAvailable > 0) {
        const { data: pendingData } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(slotsAvailable);

        setChallenges([...activeChallenges, ...(pendingData || [])]);
      } else {
        setChallenges(activeChallenges);
      }
      
      toast({
        title: "¡Reto aceptado!",
        description: "Empieza hoy mismo tu reto semanal"
      });
    } catch (error) {
      console.error('Error accepting challenge:', error);
      toast({
        title: "Error",
        description: "No se pudo aceptar el reto",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateChallenges = async () => {
    try {
      setLoadingChallenges(true);
      
      // Delete current pending challenges
      const { error: deleteError } = await supabase
        .from('challenges')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'pending');
      
      if (deleteError) throw deleteError;
      
      // Generate new challenges (always 2 - current pending count)
      const challengesToGenerate = 2 - challenges.length;
      
      const { data, error } = await supabase.functions.invoke('generate-challenges', {
        body: { count: 2 } // Always generate 2 new ones
      });
      
      if (error) {
        if (error.message?.includes('429')) {
          toast({
            title: "Límite alcanzado",
            description: "Demasiadas solicitudes. Intenta más tarde.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Refresh challenges list
      const { data: updatedChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(2);

      setChallenges(updatedChallenges || []);
      toast({
        title: "Nuevos retos generados",
        description: "Se generaron 2 nuevos retos personalizados"
      });
    } catch (error: any) {
      console.error('Error regenerating challenges:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar nuevos retos",
        variant: "destructive"
      });
    } finally {
      setLoadingChallenges(false);
    }
  };

  const handleGenerateChallenges = async () => {
    try {
      setLoadingChallenges(true);
      
      // Calculate how many challenges to generate
      const challengesToGenerate = 2 - challenges.length;
      
      const { data, error } = await supabase.functions.invoke('generate-challenges', {
        body: { count: challengesToGenerate }
      });
      
      if (error) {
        if (error.message?.includes('429')) {
          toast({
            title: "Límite alcanzado",
            description: "Demasiadas solicitudes. Intenta más tarde.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      // Refresh challenges list
      const { data: updatedChallenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(2);

      setChallenges(updatedChallenges || []);
      toast({
        title: "Retos generados",
        description: challengesToGenerate === 1 ? "Se generó 1 nuevo reto" : "Se generaron 2 nuevos retos"
      });
    } catch (error: any) {
      console.error('Error generating challenges:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar los retos",
        variant: "destructive"
      });
    } finally {
      setLoadingChallenges(false);
    }
  };

  // Verify challenge progress daily
  useEffect(() => {
    const verifyDailyChallenges = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Call edge function to verify challenges
        await supabase.functions.invoke('verify-challenge-progress');
        
        // Refresh challenges after verification
        const { data: activeData } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        const activeChallenges = activeData || [];
        const slotsAvailable = 2 - activeChallenges.length;

        if (slotsAvailable > 0) {
          const { data: pendingData } = await supabase
            .from('challenges')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(slotsAvailable);

          setChallenges([...activeChallenges, ...(pendingData || [])]);
        } else {
          setChallenges(activeChallenges);
        }
      } catch (error) {
        console.error('Error verifying challenges:', error);
      }
    };

    if (user && challenges.some(c => c.status === 'active')) {
      verifyDailyChallenges();
    }
  }, [user]);

  // Fetch challenges (active + pending suggestions)
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch active challenges (accepted and in progress)
        const { data: activeData, error: activeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (activeError) throw activeError;

        const activeChallenges = activeData || [];
        const slotsAvailable = 2 - activeChallenges.length;

        // If we need more challenges to fill 2 slots, fetch pending suggestions
        if (slotsAvailable > 0) {
          const { data: pendingData, error: pendingError } = await supabase
            .from('challenges')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(slotsAvailable);

          if (pendingError) throw pendingError;

          const pendingSuggestions = pendingData || [];

          // If no pending suggestions exist, auto-generate them
          if (pendingSuggestions.length === 0) {
            console.log('No pending suggestions found, auto-generating...');
            await handleGenerateChallenges();
            return;
          }

          setChallenges([...activeChallenges, ...pendingSuggestions]);
        } else {
          // We already have 2 active challenges
          setChallenges(activeChallenges);
        }
      } catch (error) {
        console.error('Error fetching challenges:', error);
      }
    };
    
    if (user) {
      fetchChallenges();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      navigate("/auth");
    }
  };
  const progressPercentage = currentXP / nextLevelXP * 100;
  const achievements: any[] = []; // Los logros se implementarán en el futuro basados en la actividad del usuario
  
  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header superior con logo y notificaciones */}
      <div className="p-2 flex justify-between items-start">
        {/* Logo banner - esquina superior izquierda */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden w-16 h-10">
          <img src={heroAuth} alt="Moni" className="w-full h-full object-cover" />
        </div>
        
        {/* Puntos y nivel + Notificaciones */}
        <div className="flex gap-2 items-center">
          {/* Botón de nivel financiero */}
          <Button 
            variant="ghost" 
            className="bg-white rounded-[20px] shadow-xl hover:bg-white/20 text-foreground h-10 px-3 gap-2 hover:scale-105 transition-all border border-blue-100"
            onClick={() => navigate("/financial-journey")}
          >
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-bold">
              Nivel {totalAspiration > 0 ? Math.floor((netWorth / totalAspiration) * 10000) : 0}
            </span>
          </Button>
          
          {/* Botón de notificaciones */}
          <Button variant="ghost" size="icon" className="bg-white rounded-[20px] shadow-xl hover:bg-white/20 text-foreground h-10 w-10 hover:scale-105 transition-all border border-blue-100">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Header con saludo */}
      <div className="p-4 pt-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
            ¡Hola, {user?.user_metadata?.full_name || user?.email}! 👋
          </h1>
          <p className="text-sm text-foreground">Vas excelente con tus metas financieras</p>
        </div>
        
        {/* Botón de cuentas y tarjetas */}
        <Card 
          className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all cursor-pointer flex-shrink-0 border border-blue-100"
          onClick={() => navigate('/net-worth')}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-xs text-foreground/80 leading-tight whitespace-nowrap">Mis cuentas</p>
              <p className="text-xs font-bold text-foreground leading-tight whitespace-nowrap">y tarjetas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Score Moni - Compacto */}
      {scoreMoni !== null && <div className="mx-4 mb-4">
          <Card className="p-4 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all cursor-pointer border border-blue-100 animate-fade-in"
            onClick={() => {
              navigate('/score-moni');
              window.scrollTo(0, 0);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground/80 mb-1 font-medium">Score Moni</p>
                <p className="text-3xl font-bold text-foreground">{scoreMoni}<span className="text-sm text-foreground/60">/100</span></p>
                <p className="text-xs text-foreground/80 mt-1">
                  {scoreMoni >= 90 ? '✅ Excelente' : 
                   scoreMoni >= 80 ? '✅ Muy Bueno' :
                   scoreMoni >= 70 ? '✅ Bueno' :
                   scoreMoni >= 60 ? '⚠️ Medio' :
                   scoreMoni >= 40 ? '⚠️ Malo' :
                   scoreMoni >= 20 ? '❌ Malo' :
                   '❌ Muy Malo'}
                </p>
              </div>
              <div className="relative">
                <svg className="w-20 h-20 transform -rotate-90">
                  {/* Círculo de fondo */}
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="34" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="none" 
                    className="text-muted/30" 
                  />
                  {/* Círculo de progreso que se llena según el score */}
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="34" 
                    stroke="currentColor" 
                    strokeWidth="6" 
                    fill="none" 
                    strokeDasharray={213.628} 
                    strokeDashoffset={213.628 - (213.628 * scoreMoni) / 100} 
                    className={`transition-all duration-1000 ${
                      scoreMoni >= 90 ? 'text-emerald-700' :
                      scoreMoni >= 80 ? 'text-emerald-600' :
                      scoreMoni >= 70 ? 'text-emerald-500' :
                      scoreMoni >= 60 ? 'text-yellow-500' :
                      scoreMoni >= 40 ? 'text-orange-500' :
                      scoreMoni >= 20 ? 'text-red-600' :
                      'text-red-700'
                    }`}
                    strokeLinecap="round" 
                  />
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
          <button 
            className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all cursor-pointer animate-fade-in border border-blue-100" 
            onClick={() => navigate('/balance')} 
            style={{ animationDelay: '100ms' }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-primary/40 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <BarChart3 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-foreground/80 leading-tight">Ingreso vs Gasto</p>
                <p className="text-xs sm:text-base font-bold text-foreground leading-tight">
                  ${(currentMonth.balance / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </button>

          <button 
            className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all cursor-pointer animate-fade-in border border-blue-100" 
            style={{ animationDelay: '200ms' }}
            onClick={() => navigate('/net-worth')}
          >
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-success/50 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-success-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-foreground/80 leading-tight">Net Worth</p>
                <p className="text-xs sm:text-base font-bold text-foreground leading-tight">
                  {netWorth >= 1000000 
                    ? `$${(netWorth / 1000000).toFixed(1)}M`
                    : `$${(netWorth / 1000).toFixed(0)}k`
                  }
                </p>
              </div>
            </div>
          </button>

          <button 
            className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all cursor-pointer animate-fade-in border border-blue-100" 
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-warning/50 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <Target className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-warning-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-foreground/80 leading-tight">Metas</p>
                <p className="text-xs sm:text-base font-bold text-foreground leading-tight">{goals.length}</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => navigate('/budgets')}
            className="p-3 bg-white rounded-[20px] shadow-xl hover:scale-105 transition-all cursor-pointer animate-fade-in border border-blue-100" 
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-blue-500/40 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-foreground/80 leading-tight">Presupuestos</p>
                <p className="text-xs sm:text-base font-bold text-foreground leading-tight">
                  ${totalBudget > 0 ? (totalBudget / 1000).toFixed(0) : 0}k
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Safe to Spend Widget */}
        <SafeToSpendWidget 
          monthlyIncome={monthlyIncome} 
          fixedExpenses={fixedExpenses} 
          budgetedExpenses={0} 
          savingsGoals={goals.reduce((sum, g) => sum + (Number(g.target) - Number(g.current)), 0) / 12}
          actualExpenses={monthlyExpenses}
          budgetExcesses={0}
          unbudgetedExpenses={0}
          totalBudget={totalBudget}
          goalsCount={goals.length}
        />

        {/* Presupuesto Mensual */}
        <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground leading-tight">💰 Presupuesto Mensual</h3>
                <p className="text-[10px] break-words leading-tight">
                  {totalBudget > 0 ? (
                    <>
                      <span className="text-red-600 font-bold">Gastado: ${currentMonthExpenses.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      {' de '}
                      <span className="text-blue-600 font-bold">${totalBudget.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </>
                  ) : (
                    <span className="text-foreground/80 font-medium">No hay presupuesto configurado</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-foreground leading-tight">
                  {totalBudget > 0 ? ((currentMonthExpenses / totalBudget) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-[9px] text-foreground/70 font-semibold leading-tight">del presupuesto</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="h-4 rounded-full bg-gradient-to-r from-[hsl(220,60%,10%)] to-[hsl(240,55%,8%)] border border-white/10 overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full relative overflow-hidden transition-all duration-1000 ease-out ${
                    totalBudget > 0 && (currentMonthExpenses / totalBudget) * 100 > 90 
                      ? 'bg-gradient-to-r from-[hsl(0,55%,35%)] via-[hsl(0,60%,40%)] to-[hsl(0,55%,35%)]' 
                      : totalBudget > 0 && (currentMonthExpenses / totalBudget) * 100 > 75 
                      ? 'bg-gradient-to-r from-[hsl(0,50%,40%)] via-[hsl(0,55%,45%)] to-[hsl(0,50%,40%)]' 
                      : 'bg-gradient-to-r from-[hsl(0,45%,45%)] via-[hsl(0,50%,50%)] to-[hsl(0,45%,45%)]'
                  }`}
                  style={{ 
                    width: `${totalBudget > 0 ? Math.min((currentMonthExpenses / totalBudget) * 100, 100) : 0}%`,
                    boxShadow: totalBudget > 0 && (currentMonthExpenses / totalBudget) * 100 > 90 
                      ? '0 2px 12px hsla(0, 55%, 35%, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                      : totalBudget > 0 && (currentMonthExpenses / totalBudget) * 100 > 75 
                      ? '0 2px 12px hsla(0, 50%, 40%, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                      : '0 2px 12px hsla(0, 45%, 45%, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[slideIn_2s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-black text-center font-bold min-h-[20px] flex items-center justify-center leading-tight">
              {totalBudget === 0 ? (
                <Button
                  onClick={() => navigate('/budget-quiz')}
                  variant="ghost"
                  className="text-[10px] h-auto py-1 px-2 text-primary hover:text-primary/80"
                >
                  👉 Configura tu presupuesto aquí
                </Button>
              ) : loadingBudgetMessage ? (
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block animate-spin rounded-full h-2 w-2 border-b-2 border-foreground"></span>
                  Analizando patrón...
                </span>
              ) : (
                totalBudget > 0 && currentMonthExpenses <= totalBudget
                  ? `✅ Quedan $${(totalBudget - currentMonthExpenses).toLocaleString('es-MX')} disponibles`
                  : `⚠️ Has excedido el presupuesto por $${(currentMonthExpenses - totalBudget).toLocaleString('es-MX')}`
              )}
            </p>
          </div>
        </Card>

        {/* Grid de 2 columnas: Suscripciones y Deudas - Alineados horizontalmente siempre */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Widget combinado: Suscripciones + Gastos Cotidianos */}
          <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 relative overflow-hidden h-[220px] flex flex-col cursor-pointer hover:scale-105 transition-all active:scale-95">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="space-y-2 relative z-10 flex-1 flex flex-col min-h-0">
              {/* Suscripciones - Mitad superior */}
              <div 
                className="flex-1 flex flex-col min-h-0 cursor-pointer"
                onClick={() => navigate('/subscriptions', { state: { from: '/dashboard' } })}
              >
                <div className="flex items-center justify-between flex-shrink-0 mb-1">
                  <h3 className="text-[10px] font-bold text-foreground">📅 Suscripciones</h3>
                  <span className="text-[9px] text-foreground/70 font-semibold">{upcomingSubscriptions.length}</span>
                </div>

                {upcomingSubscriptions.length === 0 ? (
                  <div className="text-center py-1 flex-1 flex flex-col justify-center">
                    <p className="text-[9px] text-foreground/70">Sin suscripciones</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      <style>{`
                        .flex-1.min-h-0.overflow-y-auto::-webkit-scrollbar {
                          width: 3px;
                        }
                        .flex-1.min-h-0.overflow-y-auto::-webkit-scrollbar-track {
                          background: rgba(0,0,0,0.05);
                          border-radius: 10px;
                        }
                        .flex-1.min-h-0.overflow-y-auto::-webkit-scrollbar-thumb {
                          background: rgba(0,0,0,0.2);
                          border-radius: 10px;
                        }
                      `}</style>
                      <div className="space-y-1">
                        {upcomingSubscriptions.map((sub) => (
                          <div 
                            key={sub.id} 
                            className="flex items-center gap-1 py-1 px-2 bg-white/10 rounded backdrop-blur-sm border border-white/20"
                          >
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[8px] shadow-lg shrink-0">
                              {sub.icon}
                            </div>
                            <p className="text-[8px] font-bold text-foreground truncate flex-1 min-w-0">{sub.name}</p>
                            <p className="text-[8px] font-black text-foreground shrink-0">${sub.amount.toFixed(0)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-1 border-t border-white/20 mt-1 flex-shrink-0">
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] text-foreground/70 font-semibold">Total mensual</p>
                        <p className="text-[9px] font-black text-foreground">
                          ${upcomingSubscriptions.reduce((sum, s) => sum + s.amount, 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Separador */}
              <div className="border-t-2 border-dashed border-white/30 my-1"></div>

              {/* Gastos Cotidianos - Mitad inferior */}
              <div 
                className="flex-1 flex flex-col min-h-0 cursor-pointer"
                onClick={() => navigate('/daily-expenses', { state: { from: '/dashboard' } })}
              >
                <div className="flex items-center justify-between flex-shrink-0 mb-1">
                  <h3 className="text-[10px] font-bold text-foreground">☕ Gastos Cotidianos</h3>
                  <span className="text-[9px] text-foreground/70 font-semibold">{dailyExpenses.length}</span>
                </div>

                {dailyExpenses.length === 0 ? (
                  <div className="text-center py-1 flex-1 flex flex-col justify-center">
                    <p className="text-[9px] text-foreground/70">Sin gastos</p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      <style>{`
                        .flex-1.min-h-0.overflow-y-auto::-webkit-scrollbar {
                          width: 3px;
                        }
                        .flex-1.min-h-0.overflow-y-auto::-webkit-scrollbar-track {
                          background: rgba(0,0,0,0.05);
                          border-radius: 10px;
                        }
                        .flex-1.min-h-0.overflow-y-auto::-webkit-scrollbar-thumb {
                          background: rgba(0,0,0,0.2);
                          border-radius: 10px;
                        }
                      `}</style>
                      <div className="space-y-1">
                        {dailyExpenses.map((expense, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-1 py-1 px-2 bg-white/10 rounded backdrop-blur-sm border border-white/20"
                          >
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[8px] shadow-lg shrink-0">
                              {expense.icon}
                            </div>
                            <p className="text-[8px] font-bold text-foreground truncate flex-1 min-w-0">{expense.name}</p>
                            <p className="text-[8px] font-black text-foreground shrink-0">${expense.amount.toFixed(0)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-1 border-t border-white/20 mt-1 flex-shrink-0">
                      <div className="flex justify-between items-center">
                        <p className="text-[8px] text-foreground/70 font-semibold">Total mensual</p>
                        <p className="text-[9px] font-black text-foreground">
                          ${dailyExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Widget de Deudas de Tarjetas */}
          <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 relative overflow-hidden h-[220px] flex flex-col cursor-pointer hover:scale-105 transition-all active:scale-95">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="space-y-2 relative z-10 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between flex-shrink-0">
                <h3 className="text-xs font-bold text-foreground">💳 Deudas</h3>
              </div>

              {!hasBankConnections ? (
                <div className="text-center py-3 flex-1 flex flex-col justify-center">
                  <div className="mb-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-2">
                      <span className="text-xl">🏦</span>
                    </div>
                    <p className="text-[10px] text-foreground/80 mb-1 font-semibold">Conecta tus cuentas</p>
                    <p className="text-[9px] text-foreground/60 mb-3">Monitorea tu salud</p>
                  </div>
                  <Button 
                    onClick={() => navigate('/bank-connection')}
                    className="bg-gray-900 hover:bg-black text-white border-0 font-semibold text-[9px] px-3 py-1.5 h-auto shadow-lg"
                  >
                    Conectar
                  </Button>
                </div>
              ) : creditCardDebts.length === 0 ? (
                <div className="text-center py-3 flex-1 flex flex-col justify-center">
                  <p className="text-sm font-bold text-green-600">✅ Sin deudas</p>
                  <p className="text-[10px] text-foreground/70 mt-1">¡Excelente!</p>
                </div>
              ) : (
                <>
                  <div className="text-center py-2 flex-shrink-0">
                    <p className="text-[9px] text-foreground/70 mb-1">Total adeudado</p>
                    <p className="text-base sm:text-xl font-black text-red-600 break-words">
                      ${creditCardDebts.reduce((sum, card) => sum + card.balance, 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                      .flex-1.min-h-0.overflow-y-auto::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <div className="space-y-0.5">
                      {creditCardDebts.map((card, index) => (
                        <div key={index} className="bg-white/10 rounded py-0.5 sm:py-2 px-1 sm:px-3 backdrop-blur-sm border border-white/20 min-h-[18px] sm:min-h-[50px]">
                          <div className="flex items-center justify-between gap-0.5 sm:gap-2 mb-0 sm:mb-1">
                            <p className="text-[6px] sm:text-sm font-bold text-foreground truncate flex-1 min-w-0 leading-none">{card.name}</p>
                            <p className="text-[6px] sm:text-sm font-black text-red-600 shrink-0 leading-none break-words">${card.balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                            <div className="flex-1 h-[1.5px] sm:h-2 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                                style={{ width: `${card.percentage}%` }}
                              />
                            </div>
                            <p className="text-[5px] sm:text-xs text-foreground/80 font-semibold leading-none">{card.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* WhatsApp Banner */}
        <Card className="p-3 sm:p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 relative overflow-hidden animate-fade-in hover:scale-105 transition-all cursor-pointer" style={{
        animationDelay: '500ms'
      }}>
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={2}
          />
            <div className="flex items-center gap-2 sm:gap-3 relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full bg-green-100 backdrop-blur-sm flex items-center justify-center p-2">
                <img src={whatsappLogo} alt="WhatsApp" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground mb-2 leading-relaxed">
                  Registra tus ingresos y gastos enviando mensajes a WhatsApp. ¡La IA los interpreta automáticamente!
                </p>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0 text-xs h-8 font-semibold" onClick={() => navigate('/whatsapp')}>
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
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Tus Metas</h3>
                <Button size="sm" onClick={() => navigate('/new-goal')} className="bg-white rounded-[20px] shadow-xl border border-blue-100 text-foreground hover:bg-gray-50 text-xs sm:text-sm hover:scale-105 transition-all">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Nueva Meta
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {goals.length === 0 ? (
                  <Card className="p-6 bg-white rounded-[20px] shadow-xl border border-blue-100 relative overflow-hidden text-center animate-fade-in">
                    <div className="relative z-10">
                      <p className="text-foreground/90">No tienes metas creadas aún</p>
                    </div>
                  </Card>
                ) : goals.map((goal, index) => {
                const goalProgress = goal.current / goal.target * 100;
                const gradients = [
                  'from-[hsl(280,60%,25%)] to-[hsl(280,55%,15%)] border-[hsl(280,70%,45%)]/40',
                  'from-[hsl(200,60%,25%)] to-[hsl(200,55%,15%)] border-[hsl(200,70%,45%)]/40',
                  'from-[hsl(340,60%,25%)] to-[hsl(340,55%,15%)] border-[hsl(340,70%,45%)]/40',
                  'from-[hsl(145,60%,25%)] to-[hsl(145,55%,15%)] border-[hsl(145,70%,45%)]/40',
                ];
                const gradient = gradients[index % gradients.length];
                return <Card key={goal.id} className={`p-4 sm:p-6 bg-gradient-to-br ${gradient} card-glow shadow-2xl border-2 relative overflow-hidden hover:scale-105 transition-transform duration-200 animate-fade-in`} style={{
                  animationDelay: `${index * 100}ms`
                }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-4 relative z-10">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap space-x-2 mb-2 gap-1">
                              <h4 className="text-base sm:text-lg font-semibold text-white drop-shadow-lg">{goal.title}</h4>
                              {goal.type === 'group' && <Badge variant="outline" className="text-xs text-white border-white/30 bg-white/10 backdrop-blur-sm">
                                  <Users className="w-3 h-3 mr-1" />
                                  {goal.members} personas
                                </Badge>}
                            </div>
                            <p className="text-xs sm:text-sm text-white/90 drop-shadow">Meta: {goal.deadline}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-base sm:text-lg font-semibold text-white drop-shadow-lg">
                              ${Number(goal.current).toLocaleString()}
                            </p>
                            <p className="text-xs sm:text-sm text-white/90 drop-shadow">
                              de ${Number(goal.target).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="relative z-10">
                          <div className="relative h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/20 mb-2">
                            <div 
                              className="h-full bg-gradient-to-r from-white/60 to-white/90 rounded-full transition-all duration-1000 ease-out relative"
                              style={{ 
                                width: `${Math.min(goalProgress, 100)}%`,
                                animation: 'slide-in-right 1s ease-out'
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs sm:text-sm">
                            <span className="text-white/90 drop-shadow">
                              ${(Number(goal.target) - Number(goal.current)).toLocaleString()} restante
                            </span>
                            <span className="text-white font-bold text-sm sm:text-base drop-shadow-lg">
                              {Math.round(goalProgress)}%
                            </span>
                          </div>
                        </div>
                      </Card>;
              })}
              </div>
            </div>

            {/* Tus Retos Semanales Section */}
            <div>
              <div className="flex flex-row justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Tus Retos Semanales</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate("/mis-retos")}
                    size="sm"
                    className="bg-white/80 backdrop-blur-md hover:bg-white text-foreground text-xs h-8 px-3 rounded-full shadow-md hover:shadow-lg transition-all border border-gray-200/50 font-semibold"
                  >
                    Ver mis retos
                  </Button>
                  {challenges.filter(c => c.status === 'active').length < 2 && challenges.some(c => c.status === 'pending') && (
                    <Button 
                      size="sm" 
                      onClick={handleRegenerateChallenges} 
                      disabled={loadingChallenges}
                      className="bg-gray-700 hover:bg-gray-800 text-white border-0 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      {loadingChallenges ? "..." : "Otros retos"}
                    </Button>
                  )}
                </div>
              </div>

              {challenges.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                  <p className="text-gray-700">Generando tus primeros 2 retos semanales...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {challenges.slice(0, 2).map((challenge, index) => {
                    const progress = (challenge.current_amount / challenge.target_amount) * 100;
                    const daysStatus = JSON.parse(challenge.days_status || '[]');
                    const dayNames = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
                    
                    const gradients = [
                      'from-[hsl(45,60%,35%)] to-[hsl(38,55%,25%)] border-[hsl(45,70%,45%)]/40',
                      'from-[hsl(200,60%,25%)] to-[hsl(200,55%,15%)] border-[hsl(200,70%,45%)]/40',
                    ];
                    const gradient = gradients[index % gradients.length];
                    
                    return (
                      <Card 
                        key={challenge.id} 
                        className="p-2.5 bg-white rounded-[20px] shadow-xl border border-blue-100 relative overflow-hidden"
                        style={{ transform: 'translate3d(0, 0, 0)' }}
                      >
                        <div className="relative z-10">
                          <div className="mb-2">
                            <h4 className="text-sm font-bold text-foreground drop-shadow-sm mb-0.5 line-clamp-1 leading-tight">
                              {challenge.title}
                            </h4>
                            <p className="text-[10px] text-foreground/70 drop-shadow-sm line-clamp-2 leading-tight">
                              {challenge.description}
                            </p>
                          </div>
                          
                          <div className="mb-2">
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="text-base font-bold text-foreground drop-shadow-sm">
                                ${challenge.current_amount.toFixed(0)}
                              </span>
                              <span className="text-[10px] text-foreground/70 drop-shadow-sm">
                                de ${challenge.target_amount}
                              </span>
                            </div>
                            
                            <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-600 rounded-full"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="bg-gray-100 backdrop-blur-sm rounded p-1.5 border border-gray-200 mb-2">
                            <div className="flex justify-between gap-0.5">
                              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                                const dayStatus = daysStatus[dayIndex];
                                const isCompleted = dayStatus?.completed === true;
                                const isFailed = dayStatus?.completed === false;
                                const isPending = !dayStatus;
                                
                                return (
                                  <div 
                                    key={dayIndex} 
                                    className="flex flex-col items-center"
                                  >
                                    <span className="text-[8px] text-foreground/70 mb-0.5">
                                      {dayNames[dayIndex]}
                                    </span>
                                    <div 
                                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                        isCompleted 
                                          ? 'bg-green-500/80 text-white' 
                                          : isFailed 
                                          ? 'bg-red-500/80 text-white'
                                          : 'bg-gray-200 text-gray-400'
                                      }`}
                                    >
                                      {isCompleted && '✓'}
                                      {isFailed && '✗'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {challenge.status === 'pending' ? (
                            <Button 
                              size="sm" 
                              className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-7 text-[10px] font-medium"
                              onClick={() => handleAcceptChallenge(challenge.id)}
                            >
                              Aceptar reto
                            </Button>
                          ) : (
                            <div className="text-center py-1">
                              <Badge className="bg-green-500/20 text-green-700 text-[9px] border-green-500/30">
                                En progreso
                              </Badge>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Recent Transactions */}
            <Card className="p-3 bg-white rounded-[20px] shadow-xl border border-blue-100 relative overflow-hidden h-[220px] flex flex-col cursor-pointer">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <div className="space-y-2 relative z-10 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h3 className="text-sm sm:text-xs font-bold text-foreground drop-shadow-sm">📊 Movimientos Recientes</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] sm:text-[9px] text-foreground hover:bg-gray-100 hover:scale-105 transition-transform duration-200 h-6 px-2"
                    onClick={() => navigate('/gastos')}
                  >
                    Ver todas
                  </Button>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="text-center py-3 flex-1 flex flex-col justify-center">
                    <p className="text-xs sm:text-[10px] text-foreground/70 mb-1">Sin movimientos</p>
                    <p className="text-[10px] sm:text-[9px] text-foreground/50">Registra tu primer transacción</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`
                      .flex-1.min-h-0.overflow-y-auto::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    <div className="space-y-1 sm:space-y-0.5">
                      {recentTransactions.map((transaction) => (
                        <div 
                          key={transaction.id}
                          className="flex items-center gap-1.5 sm:gap-2 py-2 sm:py-2 px-3 bg-white rounded-[16px] shadow-lg border border-blue-100 hover:scale-105 transition-all min-h-[50px] sm:min-h-[40px]"
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-700 flex items-center justify-center text-sm sm:text-base shadow-lg shrink-0">
                            {transaction.type === 'ingreso' ? '💰' : '💳'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-foreground truncate leading-tight">
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] sm:text-[10px] text-foreground/60">
                                {new Date(transaction.transaction_date).toLocaleDateString('es-MX')}
                              </span>
                              {transaction.categories?.name && (
                                <>
                                  <span className="text-[10px] sm:text-[10px] text-foreground/60">•</span>
                                  <span className="text-[10px] sm:text-[10px] text-foreground/60 truncate">
                                    {transaction.categories.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <p className={`text-xs sm:text-base font-black shrink-0 leading-tight ${transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
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
    </div>
  );
};

export default Dashboard;