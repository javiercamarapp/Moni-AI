
import React from "react";

const AnimatedSocialIcon: React.FC = () => {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <style>
        {`
          @keyframes float-social {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes float-avatar-1 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-4px) translateX(-2px); }
          }
          @keyframes float-avatar-2 {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-6px) translateX(2px); }
          }
          @keyframes bubble-rise {
            0% { opacity: 0; transform: translateY(10px) scale(0.5); }
            20% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-30px) scale(1.1); }
          }
          @keyframes glow-social {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
          }
        `}
      </style>
      
      {/* Background Glow */}
       <div className="absolute w-32 h-32 bg-earth-primary/20 rounded-full blur-2xl" style={{ animation: 'glow-social 4s infinite' }}></div>

      {/* Main Group Container */}
      <div className="relative z-10" style={{ animation: 'float-social 4s ease-in-out infinite' }}>
         
         {/* Back Avatar (Left) */}
         <div className="absolute top-2 -left-8 w-14 h-14 rounded-full bg-gradient-to-br from-[#DCC9BC] to-[#A68B76] shadow-lg border-2 border-white flex items-center justify-center z-0" style={{ animation: 'float-avatar-1 5s ease-in-out infinite' }}>
            <div className="w-5 h-5 rounded-full bg-white/30 backdrop-blur-sm"></div>
         </div>
         
         {/* Back Avatar (Right) */}
         <div className="absolute top-2 -right-8 w-14 h-14 rounded-full bg-gradient-to-br from-[#DCC9BC] to-[#8C705F] shadow-lg border-2 border-white flex items-center justify-center z-0" style={{ animation: 'float-avatar-2 4.5s ease-in-out infinite' }}>
            <div className="w-5 h-5 rounded-full bg-white/30 backdrop-blur-sm"></div>
         </div>

         {/* Main Avatar (Center) */}
         <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-white to-gray-50 shadow-[0_10px_25px_rgba(166,139,118,0.25)] border-[3px] border-white z-10 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white opacity-80"></div>
             {/* Abstract Face */}
             <div className="flex flex-col items-center gap-1 mt-1 opacity-90">
                <div className="w-8 h-8 rounded-full bg-earth-primary shadow-inner"></div>
                <div className="w-12 h-5 rounded-full bg-earth-primary/50"></div>
             </div>
         </div>
         
         {/* Floating Interaction Bubbles */}
         <div className="absolute -top-5 -right-5 bg-white px-2.5 py-1.5 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-50 animate-in fade-in zoom-in duration-500 delay-300 transform rotate-6">
            <span className="text-xs">💬</span>
         </div>
         <div className="absolute bottom-0 -left-6 bg-white w-9 h-9 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-center animate-in fade-in zoom-in duration-500 delay-700 transform -rotate-12">
            <span className="text-xs">❤️</span>
         </div>
      </div>
      
      {/* Rising Bubbles Effect */}
      <div className="absolute top-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-2.5 h-2.5 bg-earth-primary/40 rounded-full" style={{ animation: 'bubble-rise 3s infinite 0.5s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-earth-primary/30 rounded-full" style={{ animation: 'bubble-rise 4s infinite 1.2s' }}></div>
          <div className="absolute top-1/2 left-2/3 w-2 h-2 bg-earth-primary/20 rounded-full" style={{ animation: 'bubble-rise 3.5s infinite 2s' }}></div>
      </div>
    </div>
  );
};

export default AnimatedSocialIcon;
