
import React from "react";
import { Trophy } from "lucide-react";

const AnimatedTrophyIcon: React.FC = () => {
  // Generamos varias monedas con retrasos aleatorios para el efecto loop
  const coins = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    delay: i * 0.4,
    leftDir: i % 2 === 0 ? -1 : 1, // Alternar izquierda/derecha
  }));

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <style>
        {`
          @keyframes float-trophy {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
          }
          @keyframes shine-sweep {
            0% { transform: translateX(-150%) rotate(45deg); }
            100% { transform: translateX(150%) rotate(45deg); }
          }
          @keyframes coin-erupt {
            0% { 
              transform: translateY(0) scale(0.5) rotate(0deg); 
              opacity: 0; 
            }
            20% { 
              opacity: 1; 
              transform: translateY(-20px) scale(1) rotate(90deg);
            }
            100% { 
              transform: translateY(10px) translateX(var(--x-dir)) scale(0.8) rotate(360deg); 
              opacity: 0; 
            }
          }
        `}
      </style>

      {/* Background Glow */}
      <div className="absolute w-28 h-28 bg-yellow-500/20 rounded-full blur-2xl animate-pulse"></div>

      {/* The Trophy */}
      <div 
        className="relative z-10 filter drop-shadow-xl"
        style={{ animation: 'float-trophy 4s ease-in-out infinite' }}
      >
        {/* Main Cup Shape constructed with SVG/Icon for better control or using Lucide with advanced styling */}
        <div className="relative text-yellow-400">
             {/* We use a large Lucide icon as base, but layer it for 3D effect */}
             {/* Darker shadow layer */}
             <Trophy size={90} className="text-yellow-700 absolute top-1 left-0 opacity-50" strokeWidth={2.5} />
             {/* Main Gold Layer */}
             <Trophy size={90} className="text-yellow-400 fill-yellow-400/20" strokeWidth={2} />
             
             {/* Shine Effect on Trophy */}
             <div className="absolute inset-0 overflow-hidden rounded-full opacity-30">
                <div className="w-full h-10 bg-white blur-md absolute top-1/2 -left-10" style={{ animation: 'shine-sweep 3s infinite linear' }}></div>
             </div>
        </div>
        
        {/* Star Badge on Cup */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center shadow-inner border border-yellow-100">
            <div className="text-[10px]">⭐️</div>
        </div>
      </div>

      {/* Erupting Coins */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full h-full pointer-events-none">
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="absolute top-0 left-1/2 w-4 h-4 bg-yellow-300 border border-yellow-500 rounded-full flex items-center justify-center shadow-sm text-[8px] font-bold text-yellow-700"
            style={{
              '--x-dir': `${coin.leftDir * (20 + Math.random() * 30)}px`,
              animation: `coin-erupt 2.5s ease-out infinite`,
              animationDelay: `${coin.delay}s`,
            } as React.CSSProperties}
          >
            $
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default AnimatedTrophyIcon;
