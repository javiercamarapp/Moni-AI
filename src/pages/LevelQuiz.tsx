import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHasNetWorthData } from "@/hooks/useNetWorth";
import JourneyTypeSelector, { JourneyType } from "@/components/journey/JourneyTypeSelector";
import FinancialLifeQuiz from "@/components/journey/FinancialLifeQuiz";
import FirstMillionQuiz from "@/components/journey/FirstMillionQuiz";
import FirstPropertyQuiz from "@/components/journey/FirstPropertyQuiz";

export default function LevelQuiz() {
  const navigate = useNavigate();
  const [selectedJourney, setSelectedJourney] = useState<JourneyType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const { data: hasNetWorthData, isLoading: checkingNetWorth } = useHasNetWorthData();

  // Check if user already has a journey path or aspirations
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check for existing journey path
        const { data: journeyPath } = await supabase
          .from("user_journey_paths")
          .select("id, journey_type")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (journeyPath) {
          // User already has a journey, redirect to analysis
          navigate("/aspirations-analysis");
          return;
        }

        // Check for existing aspirations (legacy)
        const { data: aspirations } = await supabase
          .from("user_aspirations")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (aspirations && aspirations.length > 0) {
          navigate("/aspirations-analysis");
          return;
        }
      } catch (error) {
        console.error("Error checking existing data:", error);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExisting();
  }, [navigate]);

  if (checkingNetWorth || isCheckingExisting) {
    return null;
  }

  const handleFinancialLifeComplete = async (answers: Record<number, number>) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Error de autenticación");
        return;
      }

      // Save aspirations
      const aspirationsToSave = Object.entries(answers).map(([questionId, value]) => ({
        user_id: user.id,
        question_id: parseInt(questionId),
        value: value
      }));

      const { error: aspirationsError } = await supabase
        .from("user_aspirations")
        .upsert(aspirationsToSave, { 
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false 
        });

      if (aspirationsError) throw aspirationsError;

      // Calculate total aspirations
      const totalAspirations = Object.values(answers).reduce((sum, val) => sum + val, 0);

      // Generate milestones for financial life journey
      const milestones = generateLifetimeMilestones(totalAspirations);

      // Save journey path
      const { error: journeyError } = await supabase
        .from("user_journey_paths")
        .insert({
          user_id: user.id,
          journey_type: 'financial_life',
          target_amount: totalAspirations,
          milestones: milestones as any,
          is_active: true
        } as any);

      if (journeyError) throw journeyError;

      // Mark quiz as completed
      await supabase
        .from("profiles")
        .update({ level_quiz_completed: true })
        .eq("id", user.id);

      if (hasNetWorthData) {
        toast.success("¡Journey creado!");
        navigate("/aspirations-analysis");
      } else {
        toast.success("¡Journey creado! Ahora completa tu patrimonio");
        navigate("/initial-net-worth");
      }
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error("Error al guardar: " + (error.message || "Error desconocido"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFirstMillionComplete = async (data: {
    currentInvested: number;
    totalAssets: number;
    totalLiabilities: number;
    monthlyInvestmentCapacity: number;
    breakdown: Record<string, number>;
  }) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Error de autenticación");
        return;
      }

      const targetAmount = 1000000;
      const remaining = targetAmount - data.currentInvested;
      
      // Calculate years to reach goal (assuming 10% annual return)
      const monthlyReturn = 0.10 / 12;
      const monthlyInvestment = data.monthlyInvestmentCapacity;
      let months = 0;
      let balance = data.currentInvested;
      
      while (balance < targetAmount && months < 600) { // Max 50 years
        balance = balance * (1 + monthlyReturn) + monthlyInvestment;
        months++;
      }
      
      const years = Math.ceil(months / 12);

      // Generate milestones
      const milestones = generateMillionMilestones(data.currentInvested, targetAmount, years);

      // Generate AI plan
      const aiPlan = {
        currentInvested: data.currentInvested,
        netWorth: data.totalAssets - data.totalLiabilities,
        monthlyCapacity: monthlyInvestment,
        estimatedYears: years,
        estimatedMonthlyReturn: monthlyReturn,
        strategy: monthlyInvestment >= 10000 ? 'aggressive' : monthlyInvestment >= 5000 ? 'moderate' : 'conservative',
        breakdown: data.breakdown
      };

      // Save journey path
      const { error: journeyError } = await supabase
        .from("user_journey_paths")
        .insert({
          user_id: user.id,
          journey_type: 'first_million',
          target_amount: targetAmount,
          target_years: years,
          current_invested: data.currentInvested,
          monthly_investment_capacity: monthlyInvestment,
          milestones: milestones as any,
          ai_generated_plan: aiPlan as any,
          is_active: true
        } as any);

      if (journeyError) throw journeyError;

      await supabase
        .from("profiles")
        .update({ level_quiz_completed: true })
        .eq("id", user.id);

      toast.success(`¡Plan generado! Alcanzarás tu millón en ~${years} años`);
      navigate("/financial-journey");
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error("Error al guardar: " + (error.message || "Error desconocido"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFirstPropertyComplete = async (data: {
    propertyValue: number;
    downPaymentPercent: number;
    currentSavings: number;
    monthlySavingsCapacity: number;
    monthlyIncome: number;
    totalDebts: number;
    location?: string;
    breakdown: Record<string, number | string>;
  }) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Error de autenticación");
        return;
      }

      const downPaymentNeeded = data.propertyValue * (data.downPaymentPercent / 100);
      const remaining = downPaymentNeeded - data.currentSavings;
      
      // Calculate months to save for down payment
      const monthsToSave = remaining > 0 ? Math.ceil(remaining / data.monthlySavingsCapacity) : 0;
      const years = Math.ceil(monthsToSave / 12);

      // Generate milestones
      const milestones = generatePropertyMilestones(data.currentSavings, downPaymentNeeded, years);

      // Calculate debt-to-income ratio
      const dti = (data.totalDebts / data.monthlyIncome) * 100;

      // Generate AI plan
      const aiPlan = {
        propertyValue: data.propertyValue,
        downPaymentPercent: data.downPaymentPercent,
        downPaymentNeeded: downPaymentNeeded,
        currentSavings: data.currentSavings,
        remaining: remaining,
        monthlyCapacity: data.monthlySavingsCapacity,
        estimatedMonths: monthsToSave,
        estimatedYears: years,
        monthlyIncome: data.monthlyIncome,
        debtToIncomeRatio: dti,
        mortgageReady: dti < 35,
        location: data.location,
        breakdown: data.breakdown
      };

      // Save journey path
      const { error: journeyError } = await supabase
        .from("user_journey_paths")
        .insert({
          user_id: user.id,
          journey_type: 'first_property',
          target_amount: downPaymentNeeded,
          target_years: years,
          current_invested: data.currentSavings,
          monthly_investment_capacity: data.monthlySavingsCapacity,
          milestones: milestones as any,
          ai_generated_plan: aiPlan as any,
          is_active: true
        } as any);

      if (journeyError) throw journeyError;

      await supabase
        .from("profiles")
        .update({ level_quiz_completed: true })
        .eq("id", user.id);

      if (years > 0) {
        toast.success(`¡Plan generado! Tendrás tu enganche en ~${years} año${years > 1 ? 's' : ''}`);
      } else {
        toast.success("¡Ya tienes el enganche! Estás listo para comprar");
      }
      navigate("/financial-journey");
    } catch (error: any) {
      console.error("Error saving:", error);
      toast.error("Error al guardar: " + (error.message || "Error desconocido"));
    } finally {
      setIsSaving(false);
    }
  };

  // If no journey selected, show selector
  if (!selectedJourney) {
    return <JourneyTypeSelector onSelect={setSelectedJourney} />;
  }

  // Render appropriate quiz based on selection
  const handleBack = () => setSelectedJourney(null);

  switch (selectedJourney) {
    case 'financial_life':
      return <FinancialLifeQuiz onComplete={handleFinancialLifeComplete} onBack={handleBack} isSaving={isSaving} />;
    case 'first_million':
      return <FirstMillionQuiz onComplete={handleFirstMillionComplete} onBack={handleBack} isSaving={isSaving} />;
    case 'first_property':
      return <FirstPropertyQuiz onComplete={handleFirstPropertyComplete} onBack={handleBack} isSaving={isSaving} />;
    default:
      return <JourneyTypeSelector onSelect={setSelectedJourney} />;
  }
}

// Helper functions to generate milestones
function generateLifetimeMilestones(totalAspirations: number): object[] {
  const percentages = [10, 25, 50, 75, 100];
  return percentages.map((pct, index) => ({
    id: index + 1,
    percentage: pct,
    amount: Math.round(totalAspirations * (pct / 100)),
    title: getMilestoneTitle(pct),
    status: 'locked',
    icon: getMilestoneIcon(pct)
  }));
}

function generateMillionMilestones(current: number, target: number, years: number): object[] {
  const amounts = [100000, 250000, 500000, 750000, 1000000];
  return amounts.map((amount, index) => ({
    id: index + 1,
    amount: amount,
    percentage: (amount / target) * 100,
    title: `$${(amount / 1000).toFixed(0)}K invertidos`,
    status: current >= amount ? 'completed' : 'locked',
    estimatedYear: Math.ceil((index + 1) * (years / 5)),
    icon: getInvestmentIcon(amount)
  }));
}

function generatePropertyMilestones(current: number, target: number, years: number): object[] {
  const percentages = [20, 40, 60, 80, 100];
  return percentages.map((pct, index) => {
    const amount = Math.round(target * (pct / 100));
    return {
      id: index + 1,
      percentage: pct,
      amount: amount,
      title: `${pct}% del enganche`,
      status: current >= amount ? 'completed' : 'locked',
      estimatedMonths: Math.ceil((index + 1) * (years * 12 / 5)),
      icon: getPropertyIcon(pct)
    };
  });
}

function getMilestoneTitle(pct: number): string {
  switch (pct) {
    case 10: return "Primer paso";
    case 25: return "En camino";
    case 50: return "Mitad del camino";
    case 75: return "Casi llegamos";
    case 100: return "¡Meta alcanzada!";
    default: return `${pct}% completado`;
  }
}

function getMilestoneIcon(pct: number): string {
  switch (pct) {
    case 10: return "🌱";
    case 25: return "🚀";
    case 50: return "⭐";
    case 75: return "🏆";
    case 100: return "👑";
    default: return "📍";
  }
}

function getInvestmentIcon(amount: number): string {
  switch (amount) {
    case 100000: return "💰";
    case 250000: return "📈";
    case 500000: return "🎯";
    case 750000: return "🔥";
    case 1000000: return "👑";
    default: return "💵";
  }
}

function getPropertyIcon(pct: number): string {
  switch (pct) {
    case 20: return "🔑";
    case 40: return "🏗️";
    case 60: return "🏠";
    case 80: return "🎯";
    case 100: return "🏡";
    default: return "📍";
  }
}
