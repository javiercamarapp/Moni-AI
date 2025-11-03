import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface UserBadgesProps {
  totalXP: number;
  className?: string;
}

const badges = [
  { threshold: 100, name: "💰 Ahorrista Nivel 1", description: "Primeros 100 XP" },
  { threshold: 300, name: "📊 Finanzas al Día", description: "300 XP alcanzados" },
  { threshold: 500, name: "🔥 Constancia", description: "500 XP totales" },
  { threshold: 600, name: "🧠 Estratega", description: "600 XP alcanzados" },
  { threshold: 1000, name: "👑 Maestro del Dinero", description: "1000 XP totales" },
];

export default function UserBadges({ totalXP, className = "" }: UserBadgesProps) {
  const earnedBadges = badges.filter(badge => totalXP >= badge.threshold);
  
  return (
    <div className={className}>
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>🏅</span>
        <span>Insignias</span>
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {earnedBadges.length > 0 ? (
          earnedBadges.map((badge, index) => (
            <motion.div
              key={badge.threshold}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Badge 
                className="text-sm py-1 px-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                title={badge.description}
              >
                {badge.name}
              </Badge>
            </motion.div>
          ))
        ) : (
          <Badge variant="secondary" className="text-sm">
            Sin insignias aún - Completa retos para desbloquear
          </Badge>
        )}
      </div>
      
      {/* Próxima insignia */}
      {earnedBadges.length < badges.length && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Próxima insignia:
          </p>
          <p className="text-sm font-medium">
            {badges[earnedBadges.length].name}
          </p>
          <p className="text-xs text-muted-foreground">
            Faltan {badges[earnedBadges.length].threshold - totalXP} XP
          </p>
        </div>
      )}
    </div>
  );
}
