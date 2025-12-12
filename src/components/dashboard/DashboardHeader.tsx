import React, { useEffect, useState } from 'react';
import { Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
interface DashboardHeaderProps {
  userName?: string;
  unreadNotifications?: number;
}
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName = "Usuario",
  unreadNotifications = 0
}) => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<number>(1);
  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data: profile
        } = await supabase.from('profiles').select('avatar_url, level').eq('id', user.id).single();
        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setUserLevel(profile.level || 1);
        }
      }
    };
    fetchUserProfile();
  }, []);
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };
  return <header className="relative px-6 py-4 pt-8">
            {/* Botón de notificaciones - Top Right */}
            <div className="absolute top-4 right-6 flex items-center gap-2">
                <div className="relative">
                    <button onClick={() => navigate("/notifications")} className="inline-flex items-center justify-center bg-white rounded-full text-gray-600 h-9 w-9 sm:h-10 sm:w-10 shadow-sm hover:shadow-md transition-all border border-gray-100">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {unreadNotifications > 0 && <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse"></div>}
                </div>

                {/* Ajustes */}
                <button onClick={() => navigate("/settings")} className="inline-flex items-center justify-center bg-white rounded-full text-gray-600 h-9 w-9 sm:h-10 sm:w-10 shadow-sm hover:shadow-md transition-all border border-gray-100">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            </div>

            {/* Avatar and Name */}
            
        </header>;
};
export default DashboardHeader;