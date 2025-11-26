
import React from "react";

const AnimatedScoreIcon: React.FC = () => {
  return (
    <div className="relative w-64 h-80 md:w-72 md:h-88 lg:w-80 lg:h-96 flex items-center justify-center">
      <style>
        {`
          @keyframes float-card-score {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(1deg); }
          }
          @keyframes pulse-radar {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
          @keyframes score-count {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: 20; }
          }
        `}
      </style>

      {/* Main Card Container */}
      <div 
        className="relative w-full h-full bg-white rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(166,139,118,0.3)] border border-white/50 p-5 flex flex-col overflow-hidden"
        style={{ animation: 'float-card-score 5s ease-in-out infinite' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Score Moni</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-text-main tracking-tighter">99</span>
              <span className="text-sm font-bold text-text-secondary">/100</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <span>↑</span> 64 pts
          </div>
        </div>

        {/* Radar Chart Visual */}
        <div className="flex-1 relative flex items-center justify-center -mt-1 px-3">
          <svg viewBox="0 0 200 200" className="w-[85%] h-[85%] max-w-[210px]">
            {/* Background Grid (Pentagonish) */}
            <g className="stroke-gray-100" fill="none" strokeWidth="1">
              <path d="M100 20 L180 80 L150 170 L50 170 L20 80 Z" />
              <path d="M100 50 L160 90 L140 150 L60 150 L40 90 Z" />
              <path d="M100 80 L140 100 L130 130 L70 130 L60 100 Z" />
              {/* Axis lines */}
              <line x1="100" y1="100" x2="100" y2="20" />
              <line x1="100" y1="100" x2="180" y2="80" />
              <line x1="100" y1="100" x2="150" y2="170" />
              <line x1="100" y1="100" x2="50" y2="170" />
              <line x1="100" y1="100" x2="20" y2="80" />
            </g>

            {/* Labels */}
            <text x="100" y="15" textAnchor="middle" className="text-[11px] fill-text-secondary font-bold">Ahorro</text>
            <text x="175" y="85" textAnchor="middle" className="text-[11px] fill-text-secondary font-bold">Deuda</text>
            <text x="160" y="185" textAnchor="middle" className="text-[11px] fill-text-secondary font-bold">Control</text>
            <text x="40" y="185" textAnchor="middle" className="text-[11px] fill-text-secondary font-bold">Crecimiento</text>
            <text x="25" y="85" textAnchor="middle" className="text-[11px] fill-text-secondary font-bold">Hábitos</text>

            {/* Data Polygon (The Earth Brown Fill) */}
            <path 
              d="M100 25 L165 95 L135 160 L60 155 L35 90 Z" 
              className="fill-earth-primary/30 stroke-earth-primary"
              strokeWidth="3"
              strokeLinejoin="round"
              style={{ animation: 'pulse-radar 4s ease-in-out infinite' }}
            />
            
            {/* Dots on vertices */}
            <circle cx="100" cy="25" r="3" className="fill-earth-primary" />
            <circle cx="165" cy="95" r="3" className="fill-earth-primary" />
            <circle cx="135" cy="160" r="3" className="fill-earth-primary" />
            <circle cx="60" cy="155" r="3" className="fill-earth-primary" />
            <circle cx="35" cy="90" r="3" className="fill-earth-primary" />
          </svg>
        </div>
      </div>
      
      {/* Decorative background element behind card */}
      <div className="absolute top-4 -right-4 w-full h-full bg-earth-light/20 rounded-[2.5rem] -z-10 rotate-6"></div>
    </div>
  );
};

export default AnimatedScoreIcon;
