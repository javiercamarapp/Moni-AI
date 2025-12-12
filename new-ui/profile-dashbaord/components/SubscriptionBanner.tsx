import React from 'react';
import { UserTier } from '../types';
import { IconCrown, IconChevronRight } from './Icons';

interface SubscriptionBannerProps {
  tier: UserTier;
  points: number;
  onCycleTier: () => void;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ tier, points, onCycleTier }) => {
  
  const getBannerContent = () => {
    switch (tier) {
      case UserTier.BLACK:
        return {
          bg: 'bg-[#4a4542]',
          textPrimary: 'text-[#EFEBE9]',
          textSecondary: 'text-[#BCAAA4]',
          accent: 'bg-[#D7CCC8]/10',
          iconColor: 'text-[#D7CCC8]',
          description: 'Membresía Black Activa'
        };
      case UserTier.PREMIUM:
        return {
          bg: 'bg-[#C19A6B]', // darker gold/coffee for premium
          textPrimary: 'text-white',
          textSecondary: 'text-[#F5F5F4]',
          accent: 'bg-white/20',
          iconColor: 'text-white',
          description: 'Suscripción Prime Activa'
        };
      default: // Free - The "Light Coffee" requested
        return {
          bg: 'bg-[#EAE0D5]', // Light Coffee / Beige
          textPrimary: 'text-[#5D4037]', // Dark Coffee Brown
          textSecondary: 'text-[#8D6E63]', // Lighter Brown
          accent: 'bg-[#5D4037]/5',
          iconColor: 'text-[#5D4037]',
          description: 'Nivel Estándar'
        };
    }
  };

  const style = getBannerContent();

  return (
    <div 
      onClick={onCycleTier}
      className={`w-full rounded-2xl p-5 ${style.bg} relative overflow-hidden shadow-sm cursor-pointer transition-colors duration-300`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${style.accent}`}>
                <IconCrown className={`w-6 h-6 ${style.iconColor}`} />
            </div>
            <div>
                <h3 className={`text-lg font-bold ${style.textPrimary}`}>{tier}</h3>
                <p className={`text-sm font-medium ${style.textSecondary}`}>{style.description}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="text-right mr-2">
             <span className={`block text-xs font-bold ${style.textPrimary}`}>{points} pts</span>
             <span className={`block text-[10px] ${style.textSecondary}`}>Recompensas</span>
           </div>
           <IconChevronRight className={`w-5 h-5 ${style.iconColor} opacity-50`} />
        </div>
      </div>
      
      {/* Decorative circle */}
      <div className={`absolute -right-6 -bottom-10 w-32 h-32 rounded-full ${style.accent} pointer-events-none`}></div>
    </div>
  );
};

export default SubscriptionBanner;