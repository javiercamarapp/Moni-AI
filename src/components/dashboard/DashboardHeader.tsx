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
      <div className="absolute top-4 right-6 flex items-center gap-2">
        <div className="relative">
          <button 
            onClick={() => navigate("/notifications")} 
            className={`inline-flex items-center justify-center ${buttonBg} backdrop-blur-sm rounded-full ${iconColor} h-9 w-9 sm:h-10 sm:w-10 shadow-sm transition-all border ${borderColor}`}
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          {unreadNotifications > 0 && (
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          )}
        </div>

        {/* Ajustes */}
        <button 
          onClick={() => navigate("/settings")} 
          className={`inline-flex items-center justify-center ${buttonBg} backdrop-blur-sm rounded-full ${iconColor} h-9 w-9 sm:h-10 sm:w-10 shadow-sm transition-all border ${borderColor}`}
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;