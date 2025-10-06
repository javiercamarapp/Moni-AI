import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight } from "lucide-react";

interface AICoachInsightsProps {
  monthStatus: "stable" | "overspending" | "improved";
  mainMessage: string;
  details?: string[];
}

export default function AICoachInsightsWidget({ 
  monthStatus, 
  mainMessage,
  details = []
}: AICoachInsightsProps) {
  
  const getStatusConfig = () => {
    switch (monthStatus) {
      case "stable":
        return {
          emoji: "🪴",
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
    <Card className={`p-3 bg-gradient-to-r ${config.gradient} card-glow ${config.border} hover:scale-105 transition-transform duration-200`}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-white" />
          <p className="text-xs font-medium text-white">💬 Moni Coach</p>
        </div>

        <p className={`text-xs ${config.textColor} leading-snug`}>
          {config.emoji} <span className="font-medium">{mainMessage}</span>
        </p>

        {details.length > 0 && (
          <div className="space-y-1 pl-5">
            {details.map((detail, index) => (
              <p key={index} className={`text-[10px] ${config.textColor} leading-snug`}>
                • {detail}
              </p>
            ))}
          </div>
        )}

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between text-white hover:bg-white/20 h-7 text-xs"
        >
          Ver detalle completo
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
