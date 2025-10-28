import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Social = () => {
  const [user, setUser] = useState<User | null>(null);
  const [scoreMoni, setScoreMoni] = useState<number>(40);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch score from user_scores table
        const { data: scoreData } = await supabase
          .from('user_scores')
          .select('score_moni')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (scoreData) {
          setScoreMoni(scoreData.score_moni);
        }
      }
    };

    fetchUserData();
  }, []);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bueno";
    if (score >= 40) return "Regular";
    return "Necesita Mejora";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <>
      <div className="min-h-screen animated-wave-bg pb-24 animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-[#E5DEFF]/80 to-transparent backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Social
              </h1>
              <p className="text-xs text-gray-600">
                Encuentra tus amigos y disfruta de tus finanzas
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 py-6 space-y-4" style={{ maxWidth: '600px' }}>
          {/* User Profile Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {user?.email ? getInitials(user.email) : "US"}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuario"}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {user?.email || "usuario@ejemplo.com"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-500">Score Moni:</span>
                  <span className={`text-xs font-semibold ${getScoreColor(scoreMoni)}`}>
                    {scoreMoni}/100
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 ${getScoreColor(scoreMoni)}`}>
                    {getScoreLabel(scoreMoni)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio/Description */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                {user?.user_metadata?.bio || "Mejorando mis finanzas con Moni AI 🚀"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
};

export default Social;
