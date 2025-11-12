import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  unlocked: boolean;
  earnedAt?: string;
}

interface BadgesGalleryProps {
  badges: BadgeItem[];
}

const rarityColors: Record<string, string> = {
  common: "bg-slate-500/20 text-slate-300",
  rare: "bg-blue-500/20 text-blue-300",
  epic: "bg-purple-500/20 text-purple-300",
  legendary: "bg-amber-500/20 text-amber-300"
};

const rarityLabels: Record<string, string> = {
  common: "Común",
  rare: "Rara",
  epic: "Épica",
  legendary: "Legendaria"
};

export function BadgesGallery({ badges }: BadgesGalleryProps) {
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Insignias</h3>
        <Badge variant="secondary">
          {unlockedCount} / {badges.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`relative overflow-hidden ${!badge.unlocked && 'opacity-50'}`}>
              <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{badge.unlocked ? badge.icon : '🔒'}</div>
                  <Badge className={rarityColors[badge.rarity]}>
                    {rarityLabels[badge.rarity]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardTitle className="text-sm mb-1 line-clamp-1">
                  {badge.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {badge.description}
                </CardDescription>
                {badge.unlocked && badge.earnedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Desbloqueada {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                )}
                {!badge.unlocked && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>Bloqueada</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}