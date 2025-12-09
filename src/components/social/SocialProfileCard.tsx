import React, { useRef } from 'react';
import { Camera, Trophy, Zap, Star } from 'lucide-react';
import { useScoreMoni } from '@/hooks/useFinancialData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
    name: string;
    username?: string;
    avatarUrl: string;
    level: number;
    currentXP: number;
    xpForNextLevel: number;
    rank?: number;
}

interface Badge {
    id: string;
    name: string;
    icon: string;
    unlocked: boolean;
}

interface SocialProfileCardProps {
    user: UserProfile;
    badges: Badge[];
    onAvatarUpdate?: () => void;
}

export const SocialProfileCard: React.FC<SocialProfileCardProps> = ({
    user,
    badges,
    onAvatarUpdate
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: scoreMoni = 0 } = useScoreMoni();

    // Get unlocked badges (top 3)
    const unlockedBadges = badges.filter(b => b.unlocked).slice(0, 3);

    // Calculate XP progress percentage
    const xpProgress = user.xpForNextLevel > 0
        ? Math.min((user.currentXP / user.xpForNextLevel) * 100, 100)
        : 0;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen es muy grande. Máximo 5MB');
            return;
        }

        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return;

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUser.id}/avatar.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // Update profile with new avatar URL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', currentUser.id);

            if (updateError) throw updateError;

            toast.success('Foto de perfil actualizada');
            onAvatarUpdate?.();
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Error al subir la foto');
        }
    };

    // Get level title based on XP
    const getLevelTitle = (level: number) => {
        if (level >= 20) return 'Maestro';
        if (level >= 15) return 'Experto';
        if (level >= 10) return 'Avanzado';
        if (level >= 5) return 'Intermedio';
        return 'Explorador';
    };

    return (
        <div className="bg-white rounded-[2rem] p-4 shadow-sm border-b-4 border-stone-100 flex items-center justify-between gap-4 group hover:shadow-md transition-all duration-300 mb-6 animate-in slide-in-from-bottom duration-300">

            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 flex-shrink-0">
                    <div className="w-full h-full rounded-full border-[2px] border-stone-100 shadow-sm overflow-hidden group-hover:border-stone-200 transition-colors">
                        <img
                            src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name}
                            alt={user.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Hidden Input for Native Camera/Gallery Access */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-0.5 -right-0.5 bg-[#292524] p-0.5 rounded-full border border-white cursor-pointer hover:scale-110 transition-transform"
                        title="Cambiar foto de perfil"
                    >
                        <Camera size={6} className="text-white" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Text Info */}
                <div className="text-left">
                    <h3 className="text-sm md:text-base lg:text-lg font-bold text-[#292524] leading-tight">{user.name}</h3>
                    {user.username ? (
                        <p className="text-[10px] md:text-xs text-[#8D6E63] font-bold mt-0.5">@{user.username}</p>
                    ) : (
                        <p className="text-[9px] md:text-[10px] text-[#A8A29E] italic">Sin usuario</p>
                    )}

                    <div className="flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-500" fill="currentColor" />
                        <span className="text-xs md:text-sm lg:text-base font-bold text-[#A8A29E]">Nivel {user.level}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Trophy size={14} className="text-yellow-600" fill="currentColor" />
                        <span className="text-xs md:text-sm lg:text-base font-bold text-[#B45309]">#{user.rank}</span>
                    </div>
                    <div className="flex gap-2">
                        <div className="inline-flex items-center gap-1 bg-stone-50 px-1.5 py-0.5 rounded-full border border-stone-100">
                            <Star size={8} className="text-[#15803d] fill-current" />
                            <span className="text-[8px] font-bold text-[#78716C]">Score:</span>
                            <span className="text-[8px] font-black text-[#15803d]">{scoreMoni}</span>
                        </div>

                        {/* Mini Badges Preview */}
                        {unlockedBadges.length > 0 && (
                            <div className="flex -space-x-1.5">
                                {unlockedBadges.map((badge) => (
                                    <div
                                        key={badge.id}
                                        className="w-4 h-4 rounded-full bg-[#FFFBEB] border border-white flex items-center justify-center text-[#B45309] shadow-sm"
                                        title={badge.name}
                                    >
                                        <span className="text-[8px]">{badge.icon}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Gamification Badges Stacked */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 min-w-[90px]">

                <div className="flex gap-1.5 md:gap-2 w-full justify-end">
                    {/* Rank Badge */}
                    <div className="bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] px-2 md:px-3 py-0.5 md:py-1 rounded-md flex items-center justify-center gap-1 shadow-sm flex-1">
                        <Trophy size={8} className="fill-current md:w-3 md:h-3" />
                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold whitespace-nowrap">
                            #{user.rank || '—'}
                        </span>
                    </div>

                    {/* Level Badge */}
                    <div className="bg-[#F5F5F4] text-[#57534E] px-2 md:px-3 py-0.5 md:py-1 rounded-md flex items-center justify-center gap-1 shadow-sm flex-1">
                        <Zap size={8} className="fill-current md:w-3 md:h-3" />
                        <span className="text-[8px] md:text-[10px] lg:text-xs font-bold whitespace-nowrap">Nv. {user.level}</span>
                    </div>
                </div>

                {/* XP Progress Bar */}
                <div className="w-full">
                    <div className="h-1.5 md:h-2 lg:h-2.5 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                        <div
                            className="h-full bg-[#292524] rounded-full transition-all duration-300"
                            style={{ width: `${xpProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center mt-0.5 md:mt-1">
                        <span className="text-[7px] md:text-[8px] lg:text-[9px] text-[#A8A29E] font-bold">
                            {getLevelTitle(user.level)}
                        </span>
                        <span className="text-[7px] md:text-[8px] lg:text-[9px] text-[#A8A29E] font-bold">
                            {user.currentXP} / {user.xpForNextLevel} XP
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};
