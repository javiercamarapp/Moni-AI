
import React from "react";

const AnimatedRobotIcon: React.FC = () => {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <style>
        {`
          @keyframes float-robot {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          @keyframes blink-eyes {
            0%, 48%, 52%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.1); }
          }
          @keyframes glow-pulse-core {
            0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); opacity: 0.8; }
            50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.8); opacity: 1; }
          }
          @keyframes levitate-hand-left {
            0%, 100% { transform: translateY(0) rotate(-10deg); }
            50% { transform: translateY(-5px) rotate(-5deg); }
          }
          @keyframes levitate-hand-right {
            0%, 100% { transform: translateY(0) rotate(10deg); }
            50% { transform: translateY(-5px) rotate(5deg); }
          }
          @keyframes scan-line {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}
      </style>

      {/* The Robot Container */}
      <div className="relative z-10 flex flex-col items-center" style={{ animation: 'float-robot 4s ease-in-out infinite' }}>

        {/* Antenna */}
        <div className="relative z-0 -mb-2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-pulse z-10"></div>
            <div className="w-1 h-5 bg-gray-300"></div>
        </div>

        {/* Head */}
        <div className="relative z-20 w-24 h-16 bg-white rounded-[1.2rem] shadow-lg flex items-center justify-center">
           {/* Face Screen */}
           <div className="w-20 h-10 bg-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center gap-3 shadow-inner">
              {/* Reflection */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-xl pointer-events-none"></div>
              
              {/* Eyes */}
              <div className="w-3.5 h-5 bg-blue-400 rounded-full shadow-[0_0_8px_#60A5FA]" style={{ animation: 'blink-eyes 3.5s infinite 0.2s' }}></div>
              <div className="w-3.5 h-5 bg-blue-400 rounded-full shadow-[0_0_8px_#60A5FA]" style={{ animation: 'blink-eyes 3.5s infinite 0.2s' }}></div>
           </div>
        </div>

        {/* Neck Connection */}
        <div className="w-12 h-4 bg-gray-200 -mt-1 relative z-10 rounded-b-lg shadow-inner"></div>

        {/* Body */}
        <div className="relative z-20 w-28 h-20 bg-white rounded-[1.8rem] shadow-xl flex flex-col items-center pt-4 -mt-2">
           {/* Core Reactor */}
           <div className="w-10 h-10 rounded-full bg-blue-50 shadow-inner flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-blue-500" style={{ animation: 'glow-pulse-core 2s infinite' }}></div>
           </div>
           
           {/* Detail Stripes */}
           <div className="flex gap-2 mt-3 opacity-50">
             <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
             <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
           </div>
        </div>

        {/* Floating Hands (Rayman Style) */}
        <div className="absolute top-24 -left-8 w-8 h-10 bg-white rounded-full shadow-md flex items-center justify-center" style={{ animation: 'levitate-hand-left 3s ease-in-out infinite' }}>
            <div className="w-4 h-4 rounded-full bg-gray-100"></div>
        </div>
        <div className="absolute top-24 -right-8 w-8 h-10 bg-white rounded-full shadow-md flex items-center justify-center" style={{ animation: 'levitate-hand-right 3s ease-in-out infinite reverse' }}>
            <div className="w-4 h-4 rounded-full bg-gray-100"></div>
        </div>

      </div>
    </div>
  );
};

export default AnimatedRobotIcon;
