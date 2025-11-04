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
import { motion } from "framer-motion";
import { useRef } from 'react';
import { BlurFade } from '@/components/ui/blur-fade';
import { addDays, addMonths, isBefore, startOfDay } from "date-fns";
import bannerInvestment from '@/assets/banner-investment.jpg';
import bannerGoals from '@/assets/banner-goals.jpg';
import bannerGroups from '@/assets/banner-groups.jpg';
import bannerHalloween from '@/assets/banner-halloween.png';
import heroAuth from '@/assets/moni-ai-logo.png';
import whatsappLogo from '@/assets/whatsapp-logo.png';
import { Target, TrendingUp, Wallet, Trophy, Zap, Users, MessageCircle, Settings, Bell, Plus, LogOut, Home, User, BarChart3, AlertCircle, CreditCard, RefreshCw, Sparkles } from 'lucide-react';
import moniLogo from '/moni-logo.png';
import SafeToSpendWidget from '@/components/analysis/SafeToSpendWidget';
import AICoachInsightsWidget from '@/components/analysis/AICoachInsightsWidget';
import FutureCalendarWidget from '@/components/analysis/FutureCalendarWidget';
import WeeklyIncomeExpenseWidget from '@/components/analysis/WeeklyIncomeExpenseWidget';
import BottomNav from '@/components/BottomNav';
import { CreateGoalModal } from '@/components/goals/CreateGoalModal';
import { CreateGroupGoalModal } from '@/components/goals/CreateGroupGoalModal';
import confetti from 'canvas-confetti';

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
    hasBankConnections
  } = dashboardData;
  
  // Keep local state for things that update independently
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState(0);
  const [futureEvents, setFutureEvents] = useState<any[]>([]);
  const [last7DaysData, setLast7DaysData] = useState<any[]>([]);
  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);
  const [isCreateGroupGoalModalOpen, setIsCreateGroupGoalModalOpen] = useState(false);
  const [userCircles, setUserCircles] = useState<Array<{ id: string; name: string }>>([]);
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );
  
  // Sync recentTransactions when dashboardData updates - use ref to avoid infinite loop
  useEffect(() => {
    if (JSON.stringify(recentTransactions) !== JSON.stringify(dashboardData.recentTransactions)) {
      setRecentTransactions(dashboardData.recentTransactions);
    }
  }, [dashboardData.recentTransactions]);

  // Calcular últimos 7 días con ingresos y gastos - MOVIDO A useEffect CON DEPENDENCIAS
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchLast7Days = async () => {
      try {
        // Obtener transacciones de los últimos 7 días
        const todayDate = new Date();
        const sevenDaysAgo = new Date(todayDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('transaction_date', sevenDaysAgo.toISOString().split('T')[0])
          .lte('transaction_date', todayDate.toISOString().split('T')[0]);

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

          const dayTransactions = transactions?.filter(
            tx => tx.transaction_date === dateString
          ) || [];

          const dayIncome = dayTransactions
            .filter(tx => tx.type === 'income' || tx.type === 'ingreso')
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

          const dayExpense = dayTransactions
            .filter(tx => tx.type === 'expense' || tx.type === 'gasto')
            .reduce((sum, tx) => sum + Number(tx.amount), 0);

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }
        
        setUser(user);

        // Fetch user's circles for group goal modal
        const { data: circleMembers } = await supabase
          .from('circle_members')
          .select('circle_id, circles:circle_id(id, name)')
          .eq('user_id', user.id);

        if (circleMembers) {
          const circles = circleMembers
            .map(cm => ({
              id: (cm.circles as any)?.id || '',
              name: (cm.circles as any)?.name || 'Círculo'
            }))
            .filter(c => c.id);
          setUserCircles(circles);
        }
        
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

        // Recalcular score automáticamente
        recalculateScore();
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    getUserData();
  }, [navigate]);

  // Recalcular score automáticamente
  const recalculateScore = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
        // Get total monthly budget from category_budgets
        const { data: budgetData, error: budgetError } = await supabase
          .from('category_budgets')
          .select('monthly_budget')
          .eq('user_id', user.id);

        if (budgetError) {
          console.error('❌ Error al cargar presupuestos:', budgetError);
          return;
        }

        if (budgetData && budgetData.length > 0) {
          const total = budgetData.reduce((sum, b) => sum + Number(b.monthly_budget), 0);
          setTotalBudget(total);
        } else {
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('notification_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'sent');

        if (error) {
          console.error('Error loading unread notifications:', error);
          return;
        }

        // Get count from response
        const { count } = await supabase
          .from('notification_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'sent');

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
        const { data: whatsappUser, error: userError } = await supabase
          .from('whatsapp_users')
          .select('is_active')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (userError && userError.code !== 'PGRST116') throw userError;
        
        // Verificar si tiene mensajes enviados
        const { data: messages, error: messagesError } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get last 6 months of transactions for pattern detection
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: allTx, error: allError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('transaction_date', sixMonthsAgo.toISOString().split('T')[0])
          .order('transaction_date', { ascending: false });

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
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction change detected:', payload);
          // Reload future events when transactions change
          loadFutureEvents();
        }
      )
      .subscribe();

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
    const allowedCategories = [
      'suscripciones', 'subscripciones', 'subscription', 'servicios',
      'utilidades', 'utilities', 'renta', 'rent', 'alquiler',
      'internet', 'telefono', 'celular', 'telefonía', 'luz', 'agua',
      'gas', 'cfe', 'telmex', 'izzi', 'netflix', 'spotify', 'disney',
      'hbo', 'amazon prime', 'gym', 'gimnasio', 'seguro', 'insurance'
    ];
    
    // Palabras clave que NO deben estar (gastos variables)
    const excludedKeywords = [
      'bar', 'antro', 'club', 'restaurante', 'restaurant', 'cafe', 'coffee',
      'starbucks', 'oxxo', '7-eleven', 'entretenimiento', 'entertainment',
      'cine', 'cinema', 'uber', 'didi', 'rappi', 'didi food', 'uber eats',
      'amazon', 'mercado libre', 'liverpool', 'walmart', 'soriana', 'costco',
      'farmacia', 'gasolina', 'gas station'
    ];
    
    // Filtrar solo transacciones de tipo gasto
    const expenses = transactions.filter(tx => 
      tx.type === 'gasto' || tx.type === 'expense'
    );
    
    // Group transactions by similar descriptions (normalize text)
    const groupedByDescription: Record<string, any[]> = {};
    
    expenses.forEach(tx => {
      const normalizedDesc = tx.description
        .toLowerCase()
        .replace(/\d+/g, '') // Remove numbers
        .replace(/[^\w\s]/g, '') // Remove special chars
        .trim();
      
      // Verificar si contiene palabras excluidas
      const isExcluded = excludedKeywords.some(keyword => 
        normalizedDesc.includes(keyword.toLowerCase())
      );
      
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
      const sortedTxs = txs.sort((a, b) => 
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      );

      // Verificar consistencia del monto (no debe variar más del 20%)
      const amounts = sortedTxs.map(tx => Number(tx.amount));
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const maxVariation = Math.max(...amounts.map(amt => Math.abs(amt - avgAmount) / avgAmount));
      
      if (maxVariation > 0.2) return; // Skip if amount varies more than 20%

      // Verificar si tiene frequency definida O si es una categoría permitida
      const hasFrequency = sortedTxs.some(tx => 
        tx.frequency && tx.frequency !== 'once'
      );
      
      const isAllowedCategory = allowedCategories.some(category => 
        desc.includes(category.toLowerCase())
      );
      
      if (!hasFrequency && !isAllowedCategory) return; // Skip if not recurring

      // Calculate average interval between transactions (in days)
      const intervals: number[] = [];
      const dayOfMonths: number[] = [];
      
      for (let i = 1; i < sortedTxs.length; i++) {
        const daysDiff = Math.round(
          (new Date(sortedTxs[i].transaction_date).getTime() - 
           new Date(sortedTxs[i-1].transaction_date).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
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

        // Detectar suscripciones siempre
        console.log('[Subscriptions] Starting detection...');
        
        // Fetch all expense transactions for AI analysis
        const { data: allExpenses } = await supabase
          .from('transactions')
          .select('*, categories(name)')
          .eq('user_id', user.id)
          .eq('type', 'gasto')
          .order('transaction_date', { ascending: false });

        console.log('[Subscriptions] Found transactions:', allExpenses?.length || 0);

        if (allExpenses && allExpenses.length > 0) {
          try {
            // Use AI to detect subscriptions
            console.log('[Subscriptions] Calling detect-subscriptions function...');
            const { data: aiResult, error: aiError } = await supabase.functions.invoke('detect-subscriptions', {
              body: { transactions: allExpenses }
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
                  await supabase
                    .from('notification_history')
                    .insert({
                      user_id: user.id,
                      notification_type: 'price_increase',
                      message: `${sub.description}: aumentó de $${sub.oldAmount?.toFixed(2)} a $${sub.newAmount?.toFixed(2)}. ¿Es el nuevo precio de tu suscripción?`,
                      status: 'sent',
                      metadata: {
                        subscription: sub.description,
                        oldAmount: sub.oldAmount,
                        newAmount: sub.newAmount,
                      }
                    });
                }
              }
            }

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
              frequency: sub.frequency,
              dueDate: calculateNextDueDate(sub.frequency),
            }));

            console.log('[Subscriptions] Detected subscriptions:', detectedSubs.length);
            setUpcomingSubscriptions(detectedSubs);
            
            // Cache the results
            localStorage.setItem('cachedSubscriptions', JSON.stringify(detectedSubs));
            localStorage.setItem('subscriptionsLastUpdate', Date.now().toString());
          } catch (aiError) {
            console.error('[Subscriptions] Error calling AI:', aiError);
          }
        } else {
          console.log('[Subscriptions] No transactions found for detection');
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
    <>
      <div className="min-h-screen pb-20">
      {/* Header superior con logo y notificaciones */}
      <div className="p-2 flex justify-between items-start">
        {/* Logo banner - esquina superior izquierda */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden w-16 h-10">
          <img src={heroAuth} alt="Moni" className="w-full h-full object-cover" />
        </div>
        
        {/* Puntos y nivel + Notificaciones */}
        <div className="flex gap-2 items-center">
          {/* Botón de nivel financiero */}
          <Button 
            variant="ghost" 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md text-gray-900 h-10 px-3 gap-2 transition-all border-0"
            onClick={() => {
              sessionStorage.setItem('dashboardScrollPosition', window.scrollY.toString());
              navigate("/financial-journey");
            }}
          >
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-semibold">
              Nivel {totalAspiration > 0 ? Math.floor((netWorth / totalAspiration) * 10000) : 0}
            </span>
          </Button>
          
          {/* Botón de notificaciones */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/notifications")}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white hover:shadow-md text-gray-900 h-10 w-10 transition-all border-0"
            >
              <Bell className="h-5 w-5" />
            </Button>
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-[10px] font-bold text-white">{unreadNotifications}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header con saludo */}
      <div className="p-4 pt-2 flex items-start justify-between gap-3">
        <BlurFade delay={0.1} inView>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight tracking-tight">
              ¡Hola, {user?.user_metadata?.full_name || user?.email}! 👋
            </h1>
            <p className="text-sm text-gray-600">Vas excelente con tus metas financieras</p>
          </div>
        </BlurFade>
        
        {/* Botón de cuentas y tarjetas */}
        <Card 
          className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex-shrink-0 border-0"
          onClick={() => navigate('/accounts-cards')}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-gray-900" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-600 leading-tight whitespace-nowrap">Mis cuentas</p>
              <p className="text-xs font-semibold text-gray-900 leading-tight whitespace-nowrap">y tarjetas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Score Moni - Compacto */}
      {scoreMoni !== null && (
        <div className="mx-4 mb-4">
          <BlurFade delay={0.25} inView>
            <Card 
              className="p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer border-0"
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
                    {/* Círculo de progreso que se llena en 0.8s */}
                    <motion.circle 
                      cx="40" 
                      cy="40" 
                      r="34" 
                      stroke="currentColor" 
                      strokeWidth="6" 
                      fill="none" 
                      strokeDasharray={213.628}
                      initial={{ strokeDashoffset: 213.628 }}
                      animate={{ strokeDashoffset: 213.628 - (213.628 * scoreMoni) / 100 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`${
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
          </BlurFade>
        </div>
      )}

      {/* AI Coach Insights - Carousel de recomendaciones */}
      <div className="mx-4 mb-4">
        <AICoachInsightsWidget monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} fixedExpenses={fixedExpenses} savingsGoals={goals.reduce((sum, g) => sum + (Number(g.target) - Number(g.current)), 0) / 12} balance={monthlyIncome - monthlyExpenses} />
      </div>

      <div className="px-3 sm:px-4 space-y-6 overflow-x-hidden max-w-full">
        {/* Quick Stats - Primera fila: 4 botones */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <button 
            className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer animate-fade-in border-0" 
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
            className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer animate-fade-in border-0" 
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
            onClick={() => navigate('/goals')}
            className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer animate-fade-in border-0" 
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
            className="p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer animate-fade-in border-0" 
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex flex-col sm:flex-row items-center sm:gap-2">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-blue-500/40 flex items-center justify-center flex-shrink-0 mb-1 sm:mb-0">
                <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-[9px] sm:text-xs text-foreground/80 leading-tight">Presupuesto Mensual</p>
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
          savingsGoals={goals.reduce((sum, g) => sum + (Number(g.required_weekly_saving || 0) * 4), 0)}
          groupGoalsSavings={groupGoals.reduce((sum: number, g: any) => {
            if (!g.deadline || !g.user_progress) return sum;
            
            const currentAmount = Number(g.user_progress.current_amount || 0);
            const targetAmount = Number(g.target_amount || 0);
            const remaining = targetAmount - currentAmount;
            
            if (remaining <= 0) return sum;
            
            // Calculate weeks remaining until deadline
            const deadlineDate = new Date(g.deadline);
            const today = new Date();
            const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const weeksRemaining = Math.ceil(daysRemaining / 7);
            
            if (weeksRemaining <= 0) return sum;
            
            // Calculate required weekly and monthly savings
            const requiredWeeklySaving = Math.ceil(remaining / weeksRemaining);
            const requiredMonthlySaving = requiredWeeklySaving * 4;
            
            return sum + requiredMonthlySaving;
          }, 0)}
          actualExpenses={monthlyExpenses}
          budgetExcesses={0}
          unbudgetedExpenses={0}
          totalBudget={totalBudget}
          goalsCount={goals.length}
          groupGoalsCount={groupGoals.length}
        />

        {/* Presupuesto Mensual */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden">
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
          <Card className="p-3 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden h-[220px] flex flex-col cursor-pointer hover:shadow-md transition-all">
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
                    <p className="text-[9px] text-foreground/70">Detectando suscripciones...</p>
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
                          ${upcomingSubscriptions.reduce((sum, s) => {
                            const amount = s.amount;
                            const freq = s.frequency?.toLowerCase() || 'mensual';
                            switch (freq) {
                              case 'anual':
                                return sum + (amount / 12);
                              case 'semanal':
                                return sum + (amount * 4);
                              case 'quincenal':
                                return sum + (amount * 2);
                              default:
                                return sum + amount;
                            }
                          }, 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
          <Card className="p-3 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden h-[220px] flex flex-col cursor-pointer hover:shadow-md transition-all">
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
        {showWhatsAppBanner && (
          <Card className="p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden animate-fade-in hover:shadow-md transition-all cursor-pointer" style={{
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
        )}


        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Main Goals Section */}
          <div className="lg:col-span-2 space-y-6 w-full min-w-0" data-section="goals">
            {/* Personal Goals */}
            <div>
              <div className="flex flex-row justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Tus Metas</h3>
                  <Button 
                    size="sm" 
                    onClick={() => setIsCreateGoalModalOpen(true)} 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white/80 hover:scale-[1.03] text-gray-900 text-xs sm:text-sm transition-all duration-200 font-semibold border-0"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Nueva Meta
                  </Button>
              </div>

              {goals.length === 0 ? (
                <Card className="w-full p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden text-center animate-fade-in min-w-0">
                  <div className="relative z-10">
                    <p className="text-sm sm:text-base text-foreground/90">No tienes metas creadas aún</p>
                  </div>
                </Card>
              ) : (
                <Carousel 
                  className="w-full"
                  opts={{
                    align: "start",
                    loop: goals.length > 1,
                  }}
                  plugins={[autoplayPlugin.current]}
                >
                  <CarouselContent className="-ml-3">
                    {goals.map((goal, index) => {
                      const goalProgress = goal.current / goal.target * 100;
                      
                      return (
                        <CarouselItem key={goal.id} className="pl-3 md:basis-1/2">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card 
                              className="w-full p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition-all duration-300 min-w-0"
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center flex-wrap space-x-1 mb-0.5 gap-0.5">
                                    <h4 className="text-xs font-semibold text-gray-900">{goal.title}</h4>
                                    {goal.type === 'group' && <Badge variant="outline" className="text-[10px] text-gray-700 border-gray-300 px-1 py-0">
                                        <Users className="w-2.5 h-2.5 mr-0.5" />
                                        {goal.members}
                                      </Badge>}
                                  </div>
                                  <p className="text-[10px] text-gray-500">{goal.deadline}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-semibold text-gray-900">
                                    ${Number(goal.current).toLocaleString()}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    de ${Number(goal.target).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full relative"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(goalProgress, 100)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                  >
                                    <motion.div 
                                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                      animate={{ x: ['-100%', '200%'] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                  </motion.div>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] mt-1.5">
                                  <span className="text-gray-600">
                                    ${(Number(goal.target) - Number(goal.current)).toLocaleString()} restante
                                  </span>
                                  <motion.span 
                                    className="text-gray-900 font-semibold"
                                    key={goalProgress}
                                    initial={{ scale: 1 }}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {Math.round(goalProgress)}%
                                  </motion.span>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                </Carousel>
              )}
            </div>

            {/* Group Goals Section */}
            {groupGoals.length > 0 && (
              <div>
                <div className="flex flex-row justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">Tus Metas Grupales</h3>
                  <Button 
                    size="sm" 
                    onClick={() => setIsCreateGroupGoalModalOpen(true)} 
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:bg-white/80 hover:scale-[1.03] text-gray-900 text-xs sm:text-sm transition-all duration-200 font-semibold border-0"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Nueva Meta Grupal
                  </Button>
                </div>

                <Carousel 
                  className="w-full"
                  opts={{
                    align: "start",
                    loop: groupGoals.length > 1,
                  }}
                  plugins={[autoplayPlugin.current]}
                >
                  <CarouselContent className="-ml-3">
                    {groupGoals.map((goal, index) => {
                      const userProgress = goal.user_progress?.current_amount || 0;
                      const goalProgress = userProgress / goal.target_amount * 100;
                      
                      return (
                        <CarouselItem key={goal.id} className="pl-3 md:basis-1/2">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card 
                              className="w-full p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition-all duration-300 min-w-0 cursor-pointer"
                              onClick={() => navigate(`/group-goals/${goal.id}`)}
                            >
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center flex-wrap space-x-1 mb-0.5 gap-0.5">
                                    <h4 className="text-xs font-semibold text-gray-900">{goal.title}</h4>
                                    <Badge variant="outline" className="text-[10px] text-gray-700 border-gray-300 px-1 py-0">
                                      <Users className="w-2.5 h-2.5 mr-0.5" />
                                      Grupal
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] text-gray-500">{goal.deadline ? new Date(goal.deadline).toLocaleDateString('es-MX') : 'Sin fecha'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-semibold text-gray-900">
                                    ${Number(userProgress).toLocaleString()}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    de ${Number(goal.target_amount).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full relative"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(goalProgress, 100)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                  >
                                    <motion.div 
                                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                      animate={{ x: ['-100%', '200%'] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                  </motion.div>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] mt-1.5">
                                  <span className="text-gray-600">
                                    ${(Number(goal.target_amount) - Number(userProgress)).toLocaleString()} restante
                                  </span>
                                  <motion.span 
                                    className="text-gray-900 font-semibold"
                                    key={goalProgress}
                                    initial={{ scale: 1 }}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {Math.round(goalProgress)}%
                                  </motion.span>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                </Carousel>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 w-full min-w-0">

            {/* Recent Transactions */}
            <Card className="w-full p-3 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-0 relative overflow-hidden h-[220px] flex flex-col cursor-pointer min-w-0">
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
                    onClick={() => navigate('/movimientos')}
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
                      {recentTransactions.map((transaction) => {
                        const isIncome = transaction.type === 'ingreso';
                        return (
                          <div 
                            key={transaction.id}
                            className="flex items-center gap-2 py-1.5 transition-colors hover:bg-gray-50/50"
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
                              isIncome
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`}>
                              <span className="text-white">{isIncome ? '💰' : '💳'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {transaction.description}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-muted-foreground">
                                  {new Date(transaction.transaction_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                </span>
                                {transaction.categories?.name && (
                                  <>
                                    <span className="text-[9px] text-muted-foreground">•</span>
                                    <span className="text-[9px] text-muted-foreground truncate">
                                      {transaction.categories.name}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className={`text-xs font-black shrink-0 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                              {isIncome ? '+' : '-'}${Number(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Future Calendar Widget - Próximos Movimientos */}
            {futureEvents.length > 0 && (
              <FutureCalendarWidget events={futureEvents} />
            )}

            {/* Achievements */}
            
          </div>
        </div>

      </div>

      <BottomNav />
      
      <CreateGoalModal
        isOpen={isCreateGoalModalOpen}
        onClose={() => setIsCreateGoalModalOpen(false)}
        onSuccess={() => {
          setIsCreateGoalModalOpen(false);
          navigate('/goals');
        }}
      />

      <CreateGroupGoalModal
        isOpen={isCreateGroupGoalModalOpen}
        onClose={() => setIsCreateGroupGoalModalOpen(false)}
        circles={userCircles}
        onSuccess={() => {
          // Confeti personalizado con colores elegantes
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#6ee7b7', '#ffffff', '#fbbf24', '#d1d5db'], // verde menta, blanco, dorado, gris claro
            ticks: 200,
            gravity: 0.8,
            scalar: 1.2
          });
          setIsCreateGroupGoalModalOpen(false);
          navigate('/goals');
        }}
      />
    </div>
    </>
  );
};

export default Dashboard;