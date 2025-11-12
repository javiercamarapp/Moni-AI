import { motion } from "framer-motion";
import { Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RankingUser {
  user_id: string;
  full_name: string;
  total_points: number;
  rank_position?: number;
  league: string;
}

interface MonthlyRankingProps {
  currentUser: {
    rank_position?: number;
    rank_global_position?: number;
    total_points: number;
    league: string;
  };
  friendsRanking: RankingUser[];
  topGlobal: RankingUser[];
}

const leagueConfig: Record<string, { name: string; icon: string; gradient: string }> = {
  diamond: { 
    name: "Liga Diamante", 
    icon: "💎", 
    gradient: "from-cyan-500/20 to-blue-500/20" 
  },
  gold: { 
    name: "Liga Oro", 
    icon: "🥇", 
    gradient: "from-amber-500/20 to-yellow-500/20" 
  },
  silver: { 
    name: "Liga Plata", 
    icon: "🥈", 
    gradient: "from-slate-400/20 to-gray-500/20" 
  },
  bronze: { 
    name: "Liga Bronce", 
    icon: "🥉", 
    gradient: "from-orange-800/20 to-amber-700/20" 
  }
};

export function MonthlyRanking({ currentUser, friendsRanking, topGlobal }: MonthlyRankingProps) {
  const league = leagueConfig[currentUser.league] || leagueConfig.bronze;

  return (
    <div className="space-y-6">
      {/* Liga actual del usuario - Mini con listón */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-visible rounded-xl bg-gradient-to-br from-background via-background to-muted/20 p-2.5 border border-border/40"
      >
        {/* Listón de la medalla */}
        <div className="absolute -top-6 right-8 w-0.5 h-14 bg-gradient-to-b from-primary/40 via-primary/30 to-primary/10" />
        <div className="absolute -top-6 right-10 w-0.5 h-14 bg-gradient-to-b from-primary/30 via-primary/20 to-primary/5" />
        
        {/* Medalla animada */}
        <motion.div 
          className="absolute top-6 right-6 text-5xl"
          animate={{ 
            rotate: [-2, 2, -2],
            y: [0, -2, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ opacity: 0.7 }}
        >
          {league.icon}
        </motion.div>
        
        <div className="relative space-y-0 pr-12">
          <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
            Tu liga
          </p>
          <h4 className="text-xs font-semibold text-foreground">
            {league.name}
          </h4>
          <p className="text-sm font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {currentUser.total_points.toLocaleString()} <span className="text-[8px] text-muted-foreground font-normal">XP</span>
          </p>
        </div>
      </motion.div>

      {/* Ranking entre Amigos - Minimalista */}
      {friendsRanking.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amigos
            </h3>
          </div>
          <div className="space-y-1">
            {friendsRanking.slice(0, 5).map((friend, index) => (
              <motion.div
                key={friend.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-muted/30 transition-all duration-200 group"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  index === 0 ? 'bg-amber-500/10 text-amber-600' :
                  index === 1 ? 'bg-slate-300/10 text-slate-500' :
                  index === 2 ? 'bg-orange-600/10 text-orange-600' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {friend.full_name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate leading-tight">
                    {friend.full_name || 'Usuario'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {friend.total_points.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Ranking Global - Minimalista */}
      {topGlobal.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Top Global
            </h3>
          </div>
          <div className="space-y-1">
            {topGlobal.slice(0, 10).map((user, index) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-muted/30 transition-all duration-200 group"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  index === 0 ? 'bg-amber-500/10 text-amber-600' :
                  index === 1 ? 'bg-slate-300/10 text-slate-500' :
                  index === 2 ? 'bg-orange-600/10 text-orange-600' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {user.full_name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate leading-tight">
                    {user.full_name || 'Usuario'}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {leagueConfig[user.league]?.icon} {leagueConfig[user.league]?.name || 'Bronce'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                  {user.total_points.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}