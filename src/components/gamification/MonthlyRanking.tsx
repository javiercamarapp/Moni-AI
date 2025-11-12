import { motion } from "framer-motion";
import { Trophy, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-4">
      {/* Liga actual del usuario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${league.gradient} p-4 rounded-xl border border-border/50`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tu liga este mes</p>
            <h4 className="text-xl font-bold text-foreground flex items-center gap-2">
              {league.icon} {league.name}
            </h4>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Puntos</p>
            <p className="text-2xl font-bold text-primary">
              {currentUser.total_points.toLocaleString()}
            </p>
          </div>
        </div>
        
        {currentUser.rank_global_position && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Posición global: <span className="font-semibold text-foreground">#{currentUser.rank_global_position}</span>
            </p>
          </div>
        )}
      </motion.div>

      {/* Ranking de amigos */}
      {friendsRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5" />
              Ranking entre Amigos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {friendsRanking.slice(0, 5).map((friend, index) => (
              <motion.div
                key={friend.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-amber-500/20 text-amber-500' :
                  index === 1 ? 'bg-slate-400/20 text-slate-400' :
                  index === 2 ? 'bg-orange-700/20 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {friend.full_name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {friend.full_name || 'Usuario'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {friend.total_points.toLocaleString()} XP
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top global */}
      {topGlobal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top 10 Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topGlobal.slice(0, 10).map((user, index) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-amber-500/20 text-amber-500' :
                  index === 1 ? 'bg-slate-400/20 text-slate-400' :
                  index === 2 ? 'bg-orange-700/20 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {user.full_name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {leagueConfig[user.league]?.name || 'Liga Bronce'}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {user.total_points.toLocaleString()} XP
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}