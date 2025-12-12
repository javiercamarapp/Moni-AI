import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
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
import { useSecurityAudit } from "@/hooks/useSecurityAudit";
import { motion } from "framer-motion";
import { useRef } from 'react';
import { BlurFade } from '@/components/ui/blur-fade';
import { addDays, addMonths, isBefore, startOfDay } from "date-fns";
import bannerInvestment from '@/assets/banner-investment.webp';
import bannerGoals from '@/assets/banner-goals.webp';
import bannerGroups from '@/assets/banner-groups.webp';
import bannerHalloween from '@/assets/banner-halloween.png';
import heroAuth from '@/assets/moni-ai-logo.png';
import whatsappLogo from '@/assets/whatsapp-logo.png';
import { Target, TrendingUp, Wallet, Trophy, Zap, Users, MessageCircle, Settings, Bell, Plus, LogOut, Home, User, BarChart3, AlertCircle, CreditCard, RefreshCw, Sparkles } from 'lucide-react';
import moniLogo from '/moni-logo.png';
import WeeklyIncomeExpenseWidget from '@/components/analysis/WeeklyIncomeExpenseWidget';
import BottomNav from '@/components/BottomNav';
import { CreateGoalModal } from '@/components/goals/CreateGoalModal';
import { CreateGroupGoalModal } from '@/components/goals/CreateGroupGoalModal';
import confetti from 'canvas-confetti';
import DashboardHeroSection from '@/components/dashboard/DashboardHeroSection';
import QuickStats from '@/components/dashboard/QuickStats';
import BudgetCard from '@/components/dashboard/BudgetCard';
import BudgetProgressBar from '@/components/dashboard/BudgetProgressBar';
import AccountsCarousel from '@/components/dashboard/AccountsCarousel';
import GoalsWidget from '@/components/dashboard/GoalsWidget';
// import RecentTransactionsWidget from '@/components/dashboard/RecentTransactionsWidget';
import BudgetWidget from '@/components/dashboard/BudgetWidget';
import QuickRecordFAB from '@/components/dashboard/QuickRecordFAB';
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    groupGoals,
    scoreMoni,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    fixedExpenses,
    bankConnections,
    hasBankConnections,
    accounts
  } = dashboardData;

  // Keep local state for things that update independently
  // const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);
  const [futureEvents, setFutureEvents] = useState<any[]>([]);
  const [last7DaysData, setLast7DaysData] = useState<any[]>([]);
  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);
  const [isCreateGroupGoalModalOpen, setIsCreateGroupGoalModalOpen] = useState(false);
  const [userCircles, setUserCircles] = useState<Array<{
    id: string;
    name: string;
  }>>([]);

  // SEGURIDAD: Auditoría automática de seguridad y detección de anomalías
  const {
    status: securityStatus
  } = useSecurityAudit({
    runOnMount: true,
    autoClean: true,
    showToasts: false // No mostrar toasts para no molestar al usuario
  });

  // Crear nuevas instancias de autoplay para cada carrusel
  const autoplayPersonalGoals = useRef(Autoplay({
    delay: 4000,
    stopOnInteraction: false
  }));
  const autoplayGroupGoals = useRef(Autoplay({
    delay: 4000,
    stopOnInteraction: false
  }));

  // Sync recentTransactions when dashboardData updates - DISABLED (we are not showing recent transactions for now)
  // useEffect(() => {
  //   if (JSON.stringify(recentTransactions) !== JSON.stringify(dashboardData.recentTransactions)) {
  //     setRecentTransactions(dashboardData.recentTransactions);
  //   }
  // }, [dashboardData.recentTransactions]);

  // Calcular últimos 7 días con ingresos y gastos - MOVIDO A useEffect CON DEPENDENCIAS
  useEffect(() => {
    if (!user?.id) return;
    const fetchLast7Days = async () => {
      try {
        // Obtener transacciones de los últimos 7 días
        const todayDate = new Date();
        const sevenDaysAgo = new Date(todayDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const {
          data: transactions,
          error
        } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('transaction_date', sevenDaysAgo.toISOString().split('T')[0]).lte('transaction_date', todayDate.toISOString().split('T')[0]);
        if (error) throw error;

        // Calcular datos por día
        const weekDayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const last7Days: any[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(todayDate);
          date.setDate(date.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          const dayName = weekDayNames[date.getDay()];
          const dayNumber = date.getDate();
          const dayTransactions = transactions?.filter(tx => tx.transaction_date === dateString) || [];
          const dayIncome = dayTransactions.filter(tx => tx.type === 'income' || tx.type === 'ingreso').reduce((sum, tx) => sum + Number(tx.amount), 0);
          const dayExpense = dayTransactions.filter(tx => tx.type === 'expense' || tx.type === 'gasto').reduce((sum, tx) => sum + Number(tx.amount), 0);
          last7Days.push({
            date: dateString,
            day: `${dayName} ${dayNumber}`,
            income: dayIncome,
            expense: dayExpense,
            balance: dayIncome - dayExpense
          });
        }
        setLast7DaysData(last7Days);
      } catch (error) {
        console.error('Error fetching last 7 days data:', error);
      }
    };
    fetchLast7Days();
  }, [user?.id]); // Solo ejecutar cuando cambie el usuario

  const [loading, setLoading] = useState(false);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [budgetMessage, setBudgetMessage] = useState<string>("✅ Dentro del presupuesto del mes");
  const [loadingBudgetMessage, setLoadingBudgetMessage] = useState(false);
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<any[]>([]);
  const [creditCardDebts, setCreditCardDebts] = useState<any[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [loadingScore, setLoadingScore] = useState(false);
  const [dailyExpenses, setDailyExpenses] = useState<Array<{
    name: string;
    amount: number;
    icon: string;
  }>>([]);
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showWhatsAppBanner, setShowWhatsAppBanner] = useState(false);
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

  // Restaurar posición del scroll cuando se regresa de Financial Journey
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('dashboardScrollPosition');
    if (savedScrollPosition && location.state?.fromFinancialJourney) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition));
        sessionStorage.removeItem('dashboardScrollPosition');
      }, 100);
    }
  }, [location]);
  useEffect(() => {
    const getUserData = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }
        setUser(user);

        // Fetch user's circles for group goal modal
        const {
          data: circleMembers
        } = await supabase.from('circle_members').select('circle_id, circles:circle_id(id, name)').eq('user_id', user.id);
        if (circleMembers) {
          const circles = circleMembers.map(cm => ({
            id: (cm.circles as any)?.id || '',
            name: (cm.circles as any)?.name || 'Círculo'
          })).filter(c => c.id);
          setUserCircles(circles);
        }

        // Get profile data including xp, level, and quiz completion
        const {
          data: profile
        } = await supabase.from("profiles").select("id, xp, level, level_quiz_completed").eq("id", user.id).maybeSingle();
        if (profile) {
          setCurrentXP(profile.xp || 0);
          setLevelQuizCompleted(profile.level_quiz_completed || false);
        }

        // Get user level from user_levels table (more accurate)
        const {
          data: userLevel
        } = await supabase.from("user_levels").select("current_level, total_xp").eq("user_id", user.id).maybeSingle();
        if (userLevel) {
          setLevel(userLevel.current_level || 1);
          setCurrentXP(userLevel.total_xp || 0);
        } else if (profile) {
          setLevel(profile.level || 1);
        }

        // Check if user has aspirations and calculate total
        const {
          data: aspirationsData
        } = await supabase.from("user_aspirations").select("*").eq("user_id", user.id);
        setHasAspirations((aspirationsData?.length || 0) > 0);
        if (aspirationsData && aspirationsData.length > 0) {
          const total = aspirationsData.reduce((sum, asp) => sum + Number(asp.value), 0);
          setTotalAspiration(total);
        }

        // Check if user has net worth data
        const {
          data: assetsData
        } = await supabase.from("assets").select("id").eq("user_id", user.id).limit(1);

        // NOTE: useBankConnections and useFinancialData are React hooks and cannot be called inside this async function.
        // They should be called at the top level of the functional component.
        // The provided diff snippet for these lines is syntactically incorrect in this context.
        // For now, I'm keeping the original liabilities fetch.
        const {
          data: liabilitiesData
        } = await supabase.from("liabilities").select("id").eq("user_id", user.id).limit(1);
        setHasNetWorthData((assetsData?.length || 0) > 0 || (liabilitiesData?.length || 0) > 0);

        // Removed automatic score recalculation - it was causing infinite reload loop
        // Score is recalculated when needed (e.g., after adding transactions)
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    getUserData();
  }, [navigate]);

  // Recalcular score automáticamente
  const recalculateScore = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.functions.invoke('financial-analysis', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      // Esperar un momento y recargar la página para mostrar el nuevo score
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error recalculando score:', error);
    }
  };

  // Load budget data from category_budgets - OPTIMIZADO
  useEffect(() => {
    if (!user?.id) return;
    const loadBudgetData = async () => {
      try {
        // Get total monthly budget from category_budgets (only parent categories, excluding savings)
        const {
          data: budgetData,
          error: budgetError
        } = await supabase.from('category_budgets').select(`
            monthly_budget,
            category_id,
            categories!inner(name, parent_id)
          `).eq('user_id', user.id).is('categories.parent_id', null); // Only get parent categories

        if (budgetError) {
          console.error('❌ Error al cargar presupuestos:', budgetError);
          return;
        }
        if (budgetData && budgetData.length > 0) {
          // Filter out savings/investment categories
          const filteredBudgets = budgetData.filter(b => {
            const categoryName = b.categories?.name || '';
            // Exclude savings category
            return !categoryName.includes('Ahorro') && !categoryName.includes('Inversión') && !categoryName.includes('emergencia');
          });
          const total = filteredBudgets.reduce((sum, b) => sum + Number(b.monthly_budget), 0);
          setTotalBudget(total);
          console.log('💰 Presupuesto mensual (solo categorías padre):', total);
        } else {
          setTotalBudget(0);
        }

        // Get current month expenses
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const {
          data: expenseData,
          error: expenseError
        } = await supabase.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'gasto').gte('transaction_date', firstDay.toISOString().split('T')[0]).lte('transaction_date', lastDay.toISOString().split('T')[0]);
        if (expenseError) {
          console.error('❌ Error al cargar gastos:', expenseError);
          return;
        }
        if (expenseData) {
          const total = expenseData.reduce((sum, t) => sum + Number(t.amount), 0);
          setCurrentMonthExpenses(total);
        }
      } catch (error) {
        console.error('❌ Error general cargando datos de presupuesto:', error);
      }
    };
    loadBudgetData();
  }, [user?.id]); // Solo ejecutar cuando cambie el usuario

  // Load unread notifications count
  useEffect(() => {
    const loadUnreadNotifications = async () => {
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
        } = await supabase.from('notification_history').select('id', {
          count: 'exact',
          head: true
        }).eq('user_id', user.id).eq('status', 'sent');
        if (error) {
          console.error('Error loading unread notifications:', error);
          return;
        }

        // Get count from response
        const {
          count
        } = await supabase.from('notification_history').select('*', {
          count: 'exact',
          head: true
        }).eq('user_id', user.id).eq('status', 'sent');
        setUnreadNotifications(count || 0);
      } catch (error) {
        console.error('Error loading unread notifications:', error);
      }
    };
    loadUnreadNotifications();

    // Refresh count every minute
    const interval = setInterval(loadUnreadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Verificar si debe mostrar el banner de WhatsApp
  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      if (!user?.id) return;
      try {
        // Verificar si tiene conexión activa de WhatsApp
        const {
          data: whatsappUser,
          error: userError
        } = await supabase.from('whatsapp_users').select('is_active').eq('user_id', user.id).maybeSingle();
        if (userError && userError.code !== 'PGRST116') throw userError;

        // Verificar si tiene mensajes enviados
        const {
          data: messages,
          error: messagesError
        } = await supabase.from('whatsapp_messages').select('id').eq('user_id', user.id).limit(1);
        if (messagesError) throw messagesError;

        // Mostrar banner solo si NO tiene WhatsApp activo Y NO ha enviado mensajes
        const hasActiveWhatsApp = whatsappUser?.is_active === true;
        const hasMessages = messages && messages.length > 0;
        setShowWhatsAppBanner(!hasActiveWhatsApp && !hasMessages);
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
      }
    };
    checkWhatsAppStatus();
  }, [user?.id]);

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [api]);

  // Load future events (recurring payments predictions) with real-time updates
  useEffect(() => {
    const loadFutureEvents = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get last 6 months of transactions for pattern detection
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const {
          data: allTx,
          error: allError
        } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0]).order('transaction_date', {
          ascending: false
        });
        if (allError) throw allError;

        // Detect recurring payments and predict future events
        const predicted = detectRecurringPayments(allTx || []);
        setFutureEvents(predicted);
      } catch (error) {
        console.error('Error loading future events:', error);
      }
    };
    loadFutureEvents();

    // Subscribe to real-time changes in transactions table
    const channel = supabase.channel('transactions-changes').on('postgres_changes', {
      event: '*',
      // Listen to all events (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'transactions'
    }, payload => {
      console.log('Transaction change detected:', payload);
      // Reload future events when transactions change
      loadFutureEvents();
    }).subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Function to detect recurring payment patterns - SOLO gastos fijos, suscripciones y servicios recurrentes
  const detectRecurringPayments = (transactions: any[]) => {
    const today = startOfDay(new Date());
    const futurePayments: any[] = [];

    // Categorías permitidas para próximos movimientos
    const allowedCategories = ['suscripciones', 'subscripciones', 'subscription', 'servicios', 'utilidades', 'utilities', 'renta', 'rent', 'alquiler', 'internet', 'telefono', 'celular', 'telefonía', 'luz', 'agua', 'gas', 'cfe', 'telmex', 'izzi', 'netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'gym', 'gimnasio', 'seguro', 'insurance'];

    // Palabras clave que NO deben estar (gastos variables)
    const excludedKeywords = ['bar', 'antro', 'club', 'restaurante', 'restaurant', 'cafe', 'coffee', 'starbucks', 'oxxo', '7-eleven', 'entretenimiento', 'entertainment', 'cine', 'cinema', 'uber', 'didi', 'rappi', 'didi food', 'uber eats', 'amazon', 'mercado libre', 'liverpool', 'walmart', 'soriana', 'costco', 'farmacia', 'gasolina', 'gas station'];

    // Filtrar solo transacciones de tipo gasto
    const expenses = transactions.filter(tx => tx.type === 'gasto' || tx.type === 'expense');

    // Group transactions by similar descriptions (normalize text)
    const groupedByDescription: Record<string, any[]> = {};
    expenses.forEach(tx => {
      const normalizedDesc = tx.description.toLowerCase().replace(/\d+/g, '') // Remove numbers
      .replace(/[^\w\s]/g, '') // Remove special chars
      .trim();

      // Verificar si contiene palabras excluidas
      const isExcluded = excludedKeywords.some(keyword => normalizedDesc.includes(keyword.toLowerCase()));
      if (isExcluded) return; // Skip this transaction

      if (!groupedByDescription[normalizedDesc]) {
        groupedByDescription[normalizedDesc] = [];
      }
      groupedByDescription[normalizedDesc].push(tx);
    });

    // Analyze each group for patterns
    Object.entries(groupedByDescription).forEach(([desc, txs]) => {
      if (txs.length < 3) return; // Need at least 3 occurrences to confirm pattern

      // Sort by date
      const sortedTxs = txs.sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

      // Verificar consistencia del monto (no debe variar más del 20%)
      const amounts = sortedTxs.map(tx => Number(tx.amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const maxVariation = Math.max(...amounts.map(amt => Math.abs(amt - avgAmount) / avgAmount));
      if (maxVariation > 0.2) return; // Skip if amount varies more than 20%

      // Verificar si tiene frequency definida O si es una categoría permitida
      const hasFrequency = sortedTxs.some(tx => tx.frequency && tx.frequency !== 'once');
      const isAllowedCategory = allowedCategories.some(category => desc.includes(category.toLowerCase()));
      if (!hasFrequency && !isAllowedCategory) return; // Skip if not recurring

      // Calculate average interval between transactions (in days)
      const intervals: number[] = [];
      const dayOfMonths: number[] = [];
      for (let i = 1; i < sortedTxs.length; i++) {
        const daysDiff = Math.round((new Date(sortedTxs[i].transaction_date).getTime() - new Date(sortedTxs[i - 1].transaction_date).getTime()) / (1000 * 60 * 60 * 24));
        intervals.push(daysDiff);

        // Track day of month for consistency
        const dayOfMonth = new Date(sortedTxs[i].transaction_date).getDate();
        dayOfMonths.push(dayOfMonth);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // Verificar consistencia de fecha (mismo día del mes)
      const avgDayOfMonth = Math.round(dayOfMonths.reduce((a, b) => a + b, 0) / dayOfMonths.length);
      const dayVariation = Math.max(...dayOfMonths.map(day => Math.abs(day - avgDayOfMonth)));

      // Si es mensual, debe ser consistente en el día del mes (±3 días)
      if (avgInterval >= 25 && avgInterval <= 35 && dayVariation > 3) {
        return; // Skip if day of month is not consistent
      }

      // Detect if it's a recurring pattern (only monthly for now)
      let frequency: string | null = null;
      let predictInterval = 30;
      if (avgInterval >= 25 && avgInterval <= 35) {
        frequency = 'Mensual';
        predictInterval = 30;
      } else if (avgInterval >= 360 && avgInterval <= 370) {
        frequency = 'Anual';
        predictInterval = 365;
      }

      // Only predict if we detected a clear monthly or annual pattern
      if (frequency) {
        const lastTx = sortedTxs[sortedTxs.length - 1];
        const lastDate = new Date(lastTx.transaction_date);
        let nextDate = addDays(lastDate, predictInterval);

        // Ajustar al día del mes promedio para mensuales
        if (frequency === 'Mensual') {
          nextDate.setDate(avgDayOfMonth);
        }

        // Generate next 3 occurrences
        const nextThreeMonths = addMonths(today, 3);
        let count = 0;
        while (isBefore(nextDate, nextThreeMonths) && count < 3) {
          if (!isBefore(nextDate, today)) {
            futurePayments.push({
              date: new Date(nextDate),
              type: lastTx.type,
              description: `${lastTx.description} (${frequency})`,
              amount: Math.round(avgAmount),
              risk: calculatePaymentRisk(nextDate, avgAmount)
            });
            count++;
          }
          nextDate = addDays(nextDate, predictInterval);
          if (frequency === 'Mensual') {
            nextDate.setDate(avgDayOfMonth);
          }
        }
      }
    });
    return futurePayments.sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  const calculatePaymentRisk = (date: Date, amount: number): "low" | "medium" | "high" => {
    const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 3 && amount > 1000) return "high";
    if (daysUntil <= 7 && amount > 500) return "medium";
    return "low";
  };

  // REMOVED: Multiple separate useEffect calls for goals, score, netWorth, transactions
  // Now using optimized useDashboardData hook

  // Fetch upcoming subscriptions and bank connections
  useEffect(() => {
    const fetchSubscriptionsAndDebts = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) return;

        // Check for bank connections (already handled by dashboardData hook, no need to set)
        const {
          data: bankData
        } = await supabase.from('bank_connections').select('*').eq('user_id', user.id).eq('is_active', true);

        // Calculate daily expenses for current month - get specific transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const {
          data: dailyExpensesData
        } = await supabase.from('transactions').select('*, categories(name)').eq('user_id', user.id).eq('type', 'gasto').gte('transaction_date', startOfMonth.toISOString().split('T')[0]).lte('transaction_date', endOfMonth.toISOString().split('T')[0]).order('amount', {
          ascending: false
        });
        if (dailyExpensesData && dailyExpensesData.length > 0) {
          // Group by category and sum amounts
          const categoryMap = new Map<string, {
            name: string;
            total: number;
            icon: string;
          }>();
          dailyExpensesData.forEach(transaction => {
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
          const expenses = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total).map(e => ({
            name: e.name,
            amount: e.total,
            icon: e.icon
          }));
          setDailyExpenses(expenses);
        }

        // Load cached subscriptions immediately for instant display (USER-SPECIFIC)
        if (user?.id) {
          const cachedSubs = localStorage.getItem(`cachedSubscriptions_${user.id}`);
          const lastUpdate = localStorage.getItem(`subscriptionsLastUpdate_${user.id}`);
          if (cachedSubs) {
            setUpcomingSubscriptions(JSON.parse(cachedSubs));
          }
        }

        // Detectar suscripciones siempre
        console.log('[Subscriptions] Starting detection...');

        // Fetch all expense transactions for AI analysis
        const {
          data: allExpenses
        } = await supabase.from('transactions').select('*, categories(name)').eq('user_id', user.id).eq('type', 'gasto').order('transaction_date', {
          ascending: false
        });
        console.log('[Subscriptions] Found transactions:', allExpenses?.length || 0);
        if (allExpenses && allExpenses.length > 0) {
          try {
            // Use AI to detect subscriptions
            console.log('[Subscriptions] Calling detect-subscriptions function...');
            const {
              data: aiResult,
              error: aiError
            } = await supabase.functions.invoke('detect-subscriptions', {
              body: {
                transactions: allExpenses
              }
            });
            if (aiError) {
              console.error('[Subscriptions] Error from function:', aiError);
            } else {
              console.log('[Subscriptions] AI Result:', aiResult);

              // Check for price increases and create notifications in database
              const subscriptionsWithIncrease = aiResult?.subscriptions?.filter((sub: any) => sub.priceIncrease) || [];
              if (subscriptionsWithIncrease.length > 0) {
                // Insert notifications into database
                for (const sub of subscriptionsWithIncrease) {
                  await supabase.from('notification_history').insert({
                    user_id: user.id,
                    notification_type: 'price_increase',
                    message: `${sub.description}: aumentó de $${sub.oldAmount?.toFixed(2)} a $${sub.newAmount?.toFixed(2)}. ¿Es el nuevo precio de tu suscripción?`,
                    status: 'sent',
                    metadata: {
                      subscription: sub.description,
                      oldAmount: sub.oldAmount,
                      newAmount: sub.newAmount
                    }
                  });
                }
              }
            }

            // Agrupar por nombre de concepto para mostrar solo UNO por tipo
            const uniqueSubs = new Map();
            (aiResult?.subscriptions || []).forEach((sub: any) => {
              const normalizedName = sub.description.toLowerCase().replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '').replace(/\s*\d{4}$/g, '').trim();
              if (!uniqueSubs.has(normalizedName)) {
                uniqueSubs.set(normalizedName, {
                  name: sub.description.replace(/\s*(oct|sept|ago|jul|jun|may|abr|mar|feb|ene)\s*\d{2}/gi, '').trim(),
                  amount: Number(sub.amount),
                  icon: getSubscriptionIcon(sub.description),
                  frequency: sub.frequency || 'mensual'
                });
              }
            });
            const detectedSubs = Array.from(uniqueSubs.values()).map((sub: any, index: number) => ({
              id: `ai-sub-${index}`,
              name: sub.name,
              amount: sub.amount,
              icon: sub.icon,
              frequency: sub.frequency,
              dueDate: calculateNextDueDate(sub.frequency)
            }));
            console.log('[Subscriptions] Detected subscriptions:', detectedSubs.length);
            setUpcomingSubscriptions(detectedSubs);

            // Cache the results (USER-SPECIFIC)
            if (user?.id) {
              localStorage.setItem(`cachedSubscriptions_${user.id}`, JSON.stringify(detectedSubs));
              localStorage.setItem(`subscriptionsLastUpdate_${user.id}`, Date.now().toString());
            }
          } catch (aiError) {
            console.error('[Subscriptions] Error calling AI:', aiError);
          }
        } else {
          console.log('[Subscriptions] No transactions found for detection');
        }

        // Mock credit card debts (esto se obtendría de la conexión bancaria real)
        if (bankData && bankData.length > 0) {
          setCreditCardDebts([{
            name: 'Tarjeta Principal',
            balance: 15420.50,
            limit: 30000,
            percentage: 51.4
          }, {
            name: 'Tarjeta Oro',
            balance: 8250.00,
            limit: 20000,
            percentage: 41.3
          }, {
            name: 'Tarjeta Platino',
            balance: 3100.00,
            limit: 15000,
            percentage: 20.7
          }]);
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
      const percentageSpent = monthlyExpenses / budget * 100;
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
        const {
          data,
          error
        } = await supabase.functions.invoke('analyze-budget', {
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month transactions
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const {
        data: transactions
      } = await supabase.from('transactions').select('*, categories(name)').eq('user_id', user.id).gte('transaction_date', firstDay.toISOString().split('T')[0]).lte('transaction_date', lastDay.toISOString().split('T')[0]).order('transaction_date', {
        ascending: false
      });

      // Get todas las transacciones históricas para análisis completo
      const {
        data: allTransactions
      } = await supabase.from('transactions').select('*, categories(name)').eq('user_id', user.id).order('transaction_date', {
        ascending: false
      });
      const periodLabel = getMonthName(0);
      const {
        data,
        error
      } = await supabase.functions.invoke('predict-savings', {
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
          await supabase.from('transactions').select('id').eq('user_id', user.id).order('transaction_date', {
            ascending: false
          }).limit(1);
          // Recent transactions fetching is disabled for now; data is intentionally ignored.
        } catch (error) {
          console.error('Error fetching recent transactions (disabled widget):', error);
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
      // Limpiar datos específicos del usuario en localStorage antes de cerrar sesión
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user?.id) {
        localStorage.removeItem(`cachedSubscriptions_${user.id}`);
        localStorage.removeItem(`subscriptionsLastUpdate_${user.id}`);
        localStorage.removeItem(`scoreMoni`); // También limpiar el score
      }
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      navigate("/auth");
    }
  };
  const progressPercentage = currentXP / nextLevelXP * 100;
  const achievements: any[] = []; // Los logros se implementarán en el futuro basados en la actividad del usuario

  return <>
      <div className="min-h-screen bg-[#faf9f8] text-gray-800 font-sans pb-20">
        {/* Hero Section with Brown Background */}
        <div className="relative">
          {/* Brown background - extended to fit budget bar */}
          <div className="absolute inset-x-0 top-0 h-44 rounded-b-[2rem]" style={{
          background: 'linear-gradient(135deg, #8D6E63 0%, #6D4C41 50%, #5D4037 100%)'
        }} />
          
          {/* Header with remaining amount and buttons */}
          <header className="relative z-20 px-6 py-2 pt-4">
            <div className="flex items-center justify-between">
              {/* Remaining Amount - Large */}
              <div className="cursor-pointer group" onClick={() => navigate('/budgets')}>
                <span className="text-2xl font-bold text-white group-hover:text-white/90 transition-colors">
                  {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(Math.max(0, totalBudget - currentMonthExpenses))}
                </span>
                <p className="text-xs text-white/70 flex items-center gap-1">
                  Disponible este mes
                  <span className="text-white/50 group-hover:text-white/80 transition-colors">›</span>
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button onClick={() => navigate("/notifications")} className="inline-flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white h-7 w-7 shadow-sm transition-all border border-white/20">
                    <Bell className="h-3.5 w-3.5" />
                  </button>
                  {unreadNotifications > 0 && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-white animate-pulse" />}
                </div>
                <button onClick={() => navigate("/settings")} className="inline-flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white h-7 w-7 shadow-sm transition-all border border-white/20">
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </header>

          {/* Budget Progress Bar - over the brown background */}
          <div className="relative z-10 px-4 pb-2">
            <BudgetProgressBar spent={currentMonthExpenses} totalBudget={totalBudget} />
          </div>
          
          {/* Score and Net Worth Cards - moved up */}
          <div className="relative z-10 px-4 pb-4 mt-1">
            <DashboardHeroSection scoreMoni={scoreMoni} />
          </div>
        </div>

        <div className="page-container pt-2 py-0">
          {/* Balance Card - links to resumen */}
          <div className="mb-3">
            <BudgetCard income={monthlyIncome} expenses={monthlyExpenses} totalBudget={totalBudget} />
          </div>

          {/* Goals Section - Personal & Group */}
          <div className="mt-4">
            <GoalsWidget personalGoals={goals.map(g => ({
            id: g.id,
            name: g.title || 'Meta',
            target: Number(g.target),
            current: Number(g.current),
            deadline: g.deadline,
            is_group: false
          }))} groupGoals={groupGoals.map((g: any) => ({
            id: g.id,
            name: g.title || 'Meta Grupal',
            target: Number(g.target_amount || 0),
            current: Number(g.user_progress?.current_amount || 0),
            deadline: g.deadline,
            is_group: true
          }))} />
          </div>

          {/* Accounts Carousel */}
          <div className="mb-6 bg-[#faf9f8]">
            
          </div>

          {/* Recent Transactions - disabled for now */}
          {false && <div className="max-w-5xl mx-auto px-6">
              {/* <RecentTransactionsWidget transactions={recentTransactions} /> */}
            </div>}
        </div>

        <QuickRecordFAB />
        <BottomNav />




        <CreateGoalModal isOpen={isCreateGoalModalOpen} onClose={() => setIsCreateGoalModalOpen(false)} onSuccess={() => {
        setIsCreateGoalModalOpen(false);
        navigate('/goals');
      }} />

        <CreateGroupGoalModal isOpen={isCreateGroupGoalModalOpen} onClose={() => setIsCreateGroupGoalModalOpen(false)} circles={userCircles} onSuccess={() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: {
            y: 0.6
          },
          colors: ['#6ee7b7', '#ffffff', '#fbbf24', '#d1d5db'],
          ticks: 200,
          gravity: 0.8,
          scalar: 1.2
        });
        setIsCreateGroupGoalModalOpen(false);
        navigate('/goals');
      }} />
      </div>
    </>;
};
export default Dashboard;