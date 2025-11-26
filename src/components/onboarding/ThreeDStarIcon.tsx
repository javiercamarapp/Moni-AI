import React from 'react';

const ThreeDStarIcon: React.FC = () => {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <style>
        {`
          @keyframes float-star {
            0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
            50% { transform: translateY(-15px) rotate(3deg) scale(1.05); }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
          }
          @keyframes sparkle-blink {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
          }
          @keyframes shine-sweep {
            0% { transform: translateX(-150%) translateY(-150%) rotate(45deg); }
            100% { transform: translateX(150%) translateY(150%) rotate(45deg); }
          }
        `}
      </style>

      {/* Back Glow */}
      <div 
        className="absolute w-24 h-24 bg-earth-primary/30 rounded-full blur-xl"
        style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
      />

      {/* The 3D Star SVG */}
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full z-10 drop-shadow-2xl"
        style={{ animation: 'float-star 4s ease-in-out infinite' }}
      >
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6D5AC" /> {/* Light Gold */}
            <stop offset="50%" stopColor="#C8AA86" /> {/* Earth Gold */}
            <stop offset="100%" stopColor="#8C705F" /> {/* Dark Earth */}
          </linearGradient>
          <linearGradient id="gold-rim" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#A68B76" />
          </linearGradient>
          <filter id="soft-shadow">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#8C705F" floodOpacity="0.3" />
          </filter>
          <filter id="inner-glow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
            <feOffset dx="-4" dy="-4"/>
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
            <feFlood floodColor="#FFFFFF" floodOpacity="0.5"/>
            <feComposite in2="SourceAlpha" operator="in"/>
            <feMerge>
              <feMergeNode in="SourceGraphic"/>
              <feMergeNode/>
            </feMerge>
          </filter>
        </defs>

        {/* Main Star Shape - Soft Rounded 4-point star */}
        <path
          d="M100 20 
             C110 70 130 90 180 100 
             C130 110 110 130 100 180 
             C90 130 70 110 20 100 
             C70 90 90 70 100 20 Z"
          fill="url(#gold-gradient)"
          stroke="url(#gold-rim)"
          strokeWidth="2"
          filter="url(#inner-glow)"
        />

        {/* Shine Effect Overlay (masked) */}
        <g style={{ mixBlendMode: 'overlay', opacity: 0.6 }}>
             <path
              d="M100 20 C110 70 130 90 180 100 C130 110 110 130 100 180 C90 130 70 110 20 100 C70 90 90 70 100 20 Z"
              fill="url(#gold-gradient)"
              mask="url(#shine-mask)"
            />
        </g>
      </svg>

      {/* Small Floating Particles */}
      <div className="absolute top-6 right-8 text-earth-primary" style={{ animation: 'sparkle-blink 2s infinite 0.5s' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>
      <div className="absolute bottom-8 left-8 text-yellow-500" style={{ animation: 'sparkle-blink 2.5s infinite 1.2s' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>
    </div>
  );
};

export default ThreeDStarIcon;
