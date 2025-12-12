import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import JourneyTypeSelector, { JourneyType } from "@/components/journey/JourneyTypeSelector";
import UnifiedJourneyQuiz from "@/components/journey/UnifiedJourneyQuiz";

export default function LevelQuiz() {
  const navigate = useNavigate();
  const [selectedJourney, setSelectedJourney] = useState<JourneyType | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data: journeyPath } = await supabase
          .from("user_journey_paths")
          .select("id, journey_type")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (journeyPath) {
          navigate("/financial-journey");
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

  if (isCheckingExisting) {
    return null;
  }

  const handleQuizComplete = () => {
    navigate("/financial-journey");
  };

  if (!selectedJourney) {
    return <JourneyTypeSelector onSelect={setSelectedJourney} />;
  }

  return (
    <UnifiedJourneyQuiz
      journeyType={selectedJourney}
      onComplete={handleQuizComplete}
      onBack={() => setSelectedJourney(null)}
    />
  );
}

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
