import React, { useEffect, useState } from 'react';
import { Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface DashboardHeaderProps {
    userName?: string;
    unreadNotifications?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName = "Usuario", unreadNotifications = 0 }) => {
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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="relative px-6 py-4 pt-8">
            {/* Botón de notificaciones - Top Right */}
            <div className="absolute top-4 right-6 flex items-center gap-2">
                <div className="relative">
                    <button
                        onClick={() => navigate("/notifications")}
                        className="inline-flex items-center justify-center bg-white rounded-full text-gray-600 h-9 w-9 sm:h-10 sm:w-10 shadow-sm hover:shadow-md transition-all border border-gray-100"
                    >
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    {unreadNotifications > 0 && (
                        <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse"></div>
                    )}
                </div>

                {/* Perfil */}
                <button
                    onClick={() => navigate("/profile")}
                    className="inline-flex items-center justify-center bg-white rounded-full text-gray-600 h-9 w-9 sm:h-10 sm:w-10 shadow-sm hover:shadow-md transition-all border border-gray-100"
                >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            </div>

            {/* Avatar and Name */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate("/profile")}
                    className="relative group"
                >
                    
                    {/* Avatar container */}
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-[#8D6E63] to-[#5D4037] p-[3px]">
                        <Avatar className="h-full w-full border-2 border-white">
                            <AvatarImage 
                                src={avatarUrl || undefined} 
                                alt={userName}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-[#F5F0EE] text-[#5D4037] font-bold text-lg sm:text-xl">
                                {getInitials(userName)}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Level badge */}
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#5D4037] to-[#8D6E63] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-md border-2 border-white">
                        Nv.{userLevel}
                    </div>
                </button>

                <div className="flex flex-col">
                    <span className="text-gray-400 text-xs sm:text-sm font-medium">Buenos días,</span>
                    <span className="text-gray-800 font-bold text-lg sm:text-xl leading-tight">{userName}</span>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
