import { Card } from "@/components/ui/card";

interface AICoachInsightsProps {
  monthStatus: "stable" | "overspending" | "improved";
  mainMessage: string;
  improvementTip?: string;
}

export default function AICoachInsightsWidget({ 
  monthStatus, 
  mainMessage,
  improvementTip
}: AICoachInsightsProps) {
  
  const getStatusConfig = () => {
    switch (monthStatus) {
      case "stable":
        return {
          emoji: "🌿",
          gradient: "from-emerald-600/90 to-teal-600/90",
          border: "border-emerald-500/30",
          textColor: "text-emerald-200"
        };
      case "overspending":
        return {
          emoji: "🔥",
          gradient: "from-red-600/90 to-orange-600/90",
          border: "border-red-500/30",
          textColor: "text-red-200"
        };
      case "improved":
        return {
          emoji: "🚀",
          gradient: "from-purple-600/90 to-pink-600/90",
          border: "border-purple-500/30",
          textColor: "text-purple-200"
        };
      default:
        return {
          emoji: "💡",
          gradient: "from-blue-600/90 to-cyan-600/90",
          border: "border-blue-500/30",
          textColor: "text-blue-200"
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`p-2 bg-gradient-to-r ${config.gradient} card-glow ${config.border}`}>
      <p className={`text-[10px] ${config.textColor} leading-snug`}>
        {config.emoji} <span className="font-medium">{mainMessage}</span>
        {improvementTip && ` ${improvementTip}`}
      </p>
    </Card>
  );
}
