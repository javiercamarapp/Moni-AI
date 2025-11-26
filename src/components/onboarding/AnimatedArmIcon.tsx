
import React from "react";

const AnimatedArmIcon: React.FC = () => {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <style>
        {`
          @keyframes flex-arm {
            0%, 100% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(-10deg) scale(1.1); }
          }
          @keyframes sweat-drop {
            0% { opacity: 0; transform: translate(0, 0); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: translate(-10px, 20px); }
          }
          @keyframes energy-pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.4); }
            70% { box-shadow: 0 0 0 20px rgba(255, 165, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 165, 0, 0); }
          }
        `}
      </style>

      {/* Energy Aura */}
      <div 
        className="absolute w-24 h-24 bg-orange-400/20 rounded-full blur-xl"
        style={{ animation: 'energy-pulse 2s infinite' }}
      ></div>

      {/* Arm Emoji Wrapper for transformation */}
      <div 
        className="relative z-10 text-[5rem] filter drop-shadow-xl"
        style={{ animation: 'flex-arm 2s ease-in-out infinite' }}
      >
        💪
        
        {/* Sweat drops animated */}
        <div 
            className="absolute top-2 right-0 text-lg"
            style={{ animation: 'sweat-drop 2s ease-in infinite 1s' }}
        >
            💧
        </div>
      </div>

    </div>
  );
};

export default AnimatedArmIcon;
