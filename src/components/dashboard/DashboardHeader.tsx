import React, { useEffect, useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface DashboardHeaderProps {
  userName?: string;
  unreadNotifications?: number;
  variant?: 'light' | 'dark';
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName = "Usuario",
  unreadNotifications = 0,
  variant = 'dark'
}) => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<number>(1);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, level')
          .eq('id', user.id)
          .single();
        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setUserLevel(profile.level || 1);
        }
      }
    };
    fetchUserProfile();
  }, []);

  const isDark = variant === 'dark';
  const buttonBg = isDark ? 'bg-white/20 hover:bg-white/30' : 'bg-white hover:shadow-md';
  const iconColor = isDark ? 'text-white' : 'text-gray-600';
  const borderColor = isDark ? 'border-white/20' : 'border-gray-100';

  return (
    <header 
      className="relative px-6 py-4 pt-6 rounded-t-none"
      style={isDark ? {
        background: 'linear-gradient(135deg, #8D6E63 0%, #6D4C41 50%, #5D4037 100%)'
      } : undefined}
    >
      {/* Botón de notificaciones - Top Right */}
      <div className="absolute top-4 right-6 flex items-center gap-3">
        <div className="relative">
          <button 
            onClick={() => navigate("/notifications")} 
            className={`relative inline-flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-200 ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/10 hover:border-white/20' 
                : 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-[#5D4037] shadow-sm hover:shadow-md border border-gray-100/50'
            }`}
          >
            <Bell className="h-4 w-4" strokeWidth={2} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Ajustes */}
        <button 
          onClick={() => navigate("/settings")} 
          className={`inline-flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-200 ${
            isDark 
              ? 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/10 hover:border-white/20' 
              : 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-[#5D4037] shadow-sm hover:shadow-md border border-gray-100/50'
          }`}
        >
          <Settings className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;