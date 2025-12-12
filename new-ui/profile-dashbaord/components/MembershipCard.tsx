import React from 'react';
import { UserTier } from '../types';

interface MembershipCardProps {
  tier: UserTier;
  memberName: string;
  memberId: string;
  onCycle: () => void;
  showGraph?: boolean;
}

const MembershipCard: React.FC<MembershipCardProps> = ({ tier, memberName, memberId, onCycle, showGraph = false }) => {
  const getCardTheme = () => {
    switch (tier) {
      case UserTier.BLACK:
        return {
          container: 'bg-[#292524] text-[#E7E5E4] shadow-[0_20px_40px_-12px_rgba(41,37,36,0.5)] border-[#44403C]',
          label: 'text-[#D6D3D1]',
          subLabel: 'text-[#A8A29E]',
          accent: 'bg-[#B45309]', // Amber for detail
          border: 'border-[#57534E]'
        };
      case UserTier.PREMIUM:
        return {
          container: 'bg-gradient-to-br from-[#A1887F] to-[#8D6E63] text-white shadow-[0_20px_40px_-12px_rgba(141,110,99,0.4)] border-[#BCAAA4]',
          label: 'text-white',
          subLabel: 'text-[#EFEBE9]',
          accent: 'bg-[#F5F5F4]', 
          border: 'border-[#D7CCC8]'
        };
      default: // Free
        return {
          container: 'bg-[#F5F5F4] text-[#44403C] shadow-[0_10px_30px_-10px_rgba(120,113,108,0.15)] border-[#E7E5E4]',
          label: 'text-[#57534E]',
          subLabel: 'text-[#A8A29E]',
          accent: 'bg-[#78716C]',
          border: 'border-[#E7E5E4]'
        };
    }
  };

  const theme = getCardTheme();
  
  // Graph Logic
  const isPaidTier = tier === UserTier.PREMIUM || tier === UserTier.BLACK;
  const cost = tier === UserTier.PREMIUM ? 69 : 99;
  const savings = tier === UserTier.PREMIUM 
    ? { total: 950, challenge: 450, coaching: 300, promos: 200 }
    : { total: 2200, challenge: 800, coaching: 900, promos: 500 };
  const roiMultiplier = Math.floor(savings.total / cost);

  // Calculate percentages for the stacked bar
  const challengePct = (savings.challenge / savings.total) * 100;
  const coachingPct = (savings.coaching / savings.total) * 100;
  const promosPct = (savings.promos / savings.total) * 100;

  return (
    <div className="space-y-6">
        {/* Card Visual */}
        <div 
            onClick={onCycle}
            className={`relative w-full aspect-[1.586/1] rounded-[24px] p-6 flex flex-col justify-between overflow-hidden transition-all duration-500 cursor-pointer border ${theme.container} ${theme.border} hover:scale-[1.02]`}
        >
          {/* Texture/Grain effect overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>
          
          {/* Top Section */}
          <div className="flex justify-between items-start z-10">
            <div>
               <span className={`text-[10px] uppercase tracking-[0.2em] font-medium ${theme.subLabel}`}>Membresía</span>
               <h3 className={`text-2xl font-serif italic mt-1 ${theme.label}`}>{tier}</h3>
            </div>
            
            {/* Abstract chip/logo */}
            <div className="flex gap-2">
                <div className={`w-8 h-5 rounded-md opacity-80 ${tier === UserTier.FREE ? 'bg-[#D6D3D1]' : 'bg-[#FDE68A]/20 backdrop-blur-md border border-white/20'}`}></div>
            </div>
          </div>

          {/* Middle/Bottom */}
          <div className="z-10 mt-auto">
            <div className="flex items-end justify-between">
                <div>
                    <p className={`text-[10px] uppercase tracking-wider mb-1 opacity-70 ${theme.subLabel}`}>Titular</p>
                    <p className={`font-medium text-sm tracking-wide ${theme.label}`}>{memberName}</p>
                </div>
                 <div className="text-right">
                    <p className={`text-[10px] uppercase tracking-wider mb-1 opacity-70 ${theme.subLabel}`}>ID Miembro</p>
                    <p className={`font-mono text-xs opacity-80 ${theme.label}`}>{memberId}</p>
                </div>
            </div>
          </div>

          {/* Button overlay prompt */}
          <div className="absolute bottom-4 right-1/2 translate-x-1/2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
             <span className="bg-black/20 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full">Toca para cambiar</span>
          </div>
        </div>

        {/* ROI Graph Section */}
        {showGraph && isPaidTier && (
             <div className="bg-white rounded-2xl p-6 shadow-sm overflow-hidden relative border border-gray-100">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h3 className="font-bold text-[#5D4037] text-lg">Balance de Valor</h3>
                        <p className="text-xs text-gray-500 mt-1">Tu ahorro mensual vs costo</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-bold text-green-600">+{roiMultiplier}x</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Retorno</span>
                    </div>
                </div>

                <div className="flex items-end gap-6 h-40">
                     {/* Cost Bar */}
                     <div className="w-1/4 flex flex-col items-center gap-2 group">
                        <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">${cost}</span>
                        <div className="w-full bg-gray-200 rounded-t-lg relative transition-all duration-500 hover:bg-gray-300" style={{height: '15%'}}></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Costo</span>
                     </div>

                     {/* Value Bar (Stacked) */}
                     <div className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-lg font-bold text-[#5D4037] group-hover:scale-110 transition-transform">${savings.total}</span>
                        <div className="w-full bg-gray-100 rounded-t-lg relative flex flex-col-reverse overflow-hidden shadow-lg transition-all duration-500 hover:shadow-xl" style={{height: '100%'}}>
                            {/* Promos Segment */}
                            <div 
                              className="w-full bg-[#A1887F]/80 border-t border-white/20 transition-all hover:bg-[#A1887F]" 
                              style={{height: `${promosPct}%`}}
                              title={`Beneficios: $${savings.promos}`}
                            ></div>
                            {/* Coaching Segment */}
                            <div 
                              className="w-full bg-[#8D6E63] border-t border-white/20 transition-all hover:bg-[#795548]" 
                              style={{height: `${coachingPct}%`}}
                              title={`Coaching: $${savings.coaching}`}
                            ></div>
                             {/* Challenge Segment */}
                            <div 
                              className="w-full bg-[#5D4037] transition-all hover:bg-[#4E342E]" 
                              style={{height: `${challengePct}%`}}
                              title={`Retos: $${savings.challenge}`}
                            ></div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[#5D4037]">Valor Recibido</span>
                     </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Retos</p>
                        <p className="font-bold text-[#5D4037]">${savings.challenge}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Coacheo</p>
                        <p className="font-bold text-[#5D4037]">${savings.coaching}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Beneficios</p>
                        <p className="font-bold text-[#5D4037]">${savings.promos}</p>
                    </div>
                </div>
                
                <div className="mt-4 bg-[#5D4037]/5 p-3 rounded-xl text-center">
                     <p className="text-xs text-[#5D4037] font-medium">
                         Moni se ha pagado sola <span className="font-bold">{roiMultiplier} veces</span> este mes.
                     </p>
                </div>
             </div>
        )}
    </div>
  );
};

export default MembershipCard;