
import React from "react";

const AnimatedTargetIcon: React.FC = () => {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <style>
        {`
          @keyframes pulse-target {
            0%, 100% { transform: scale(1); }
            40% { transform: scale(1); }
            45% { transform: scale(0.95); } /* Impact absorption */
            50% { transform: scale(1.02); }
            55% { transform: scale(1); }
          }
          @keyframes dart-throw {
            0% { 
              transform: translate(60px, -60px) rotate(45deg) scale(0.5); 
              opacity: 0; 
            }
            10% { opacity: 1; }
            40% { 
              transform: translate(0, 0) rotate(0deg) scale(1); 
            } 
            80% { opacity: 1; }
            100% { 
              transform: translate(0, 0) rotate(0deg) scale(1); 
              opacity: 0; 
            }
          }
          @keyframes shadow-move {
            0% { transform: translate(60px, -60px); opacity: 0; }
            40% { transform: translate(4px, 4px); opacity: 0.3; }
            100% { transform: translate(4px, 4px); opacity: 0; }
          }
        `}
      </style>

      {/* Glow Background */}
      <div className="absolute w-24 h-24 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>

      {/* Target Board */}
      <div className="relative z-10 w-24 h-24 rounded-full border-4 border-white bg-white shadow-xl flex items-center justify-center" style={{ animation: 'pulse-target 3s ease-in-out infinite' }}>
        {/* Outer Red Ring */}
        <div className="absolute inset-0 rounded-full border-[10px] border-[#EF4444]"></div>
        {/* Inner White Ring */}
        <div className="absolute inset-[10px] rounded-full border-[10px] border-white"></div>
        {/* Inner Red Ring */}
        <div className="absolute inset-[20px] rounded-full border-[10px] border-[#EF4444]"></div>
        {/* Bullseye */}
        <div className="absolute w-4 h-4 bg-[#EF4444] rounded-full"></div>
      </div>

      {/* Dart Shadow */}
      <div 
        className="absolute z-10 w-2 h-8 bg-black/30 rounded-full blur-sm"
        style={{ animation: 'shadow-move 3s cubic-bezier(0.1, 0.7, 0.1, 1) infinite' }}
      ></div>

      {/* The Dart */}
      <div 
        className="absolute z-20"
        style={{ animation: 'dart-throw 3s cubic-bezier(0.1, 0.7, 0.1, 1) infinite' }}
      >
        {/* Dart Tip (stuck in board) */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-gray-400"></div>
        
        {/* Dart Body */}
        <div className="relative -top-2">
             {/* Shaft */}
             <div className="w-2 h-10 bg-gray-700 mx-auto rounded-sm"></div>
             {/* Flights (Feathers) */}
             <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex">
                <div className="w-3 h-6 bg-blue-500 rounded-tl-lg skew-y-12 border-r border-black/10"></div>
                <div className="w-3 h-6 bg-blue-600 rounded-tr-lg -skew-y-12 border-l border-black/10"></div>
             </div>
             <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-gray-800"></div>
        </div>
      </div>

    </div>
  );
};

export default AnimatedTargetIcon;
