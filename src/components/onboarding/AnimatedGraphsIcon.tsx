import React from 'react';

const AnimatedGraphsIcon: React.FC = () => {
  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      <style>
        {`
          @keyframes grow-bar {
            0%, 100% { height: 20%; }
            50% { height: 80%; }
          }
          @keyframes grow-bar-2 {
            0%, 100% { height: 40%; }
            50% { height: 90%; }
          }
          @keyframes grow-bar-3 {
            0%, 100% { height: 60%; }
            50% { height: 30%; }
          }
          @keyframes float-card {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes float-card-delayed {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes draw-line {
            0% { stroke-dashoffset: 100; }
            50% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 100; }
          }
          @keyframes pulse-dot {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
          }
        `}
      </style>

      {/* Scaling wrapper */}
      <div className="relative w-64 h-64 transform scale-[0.9] origin-center">
        {/* Floating Badge (Net Worth) */}
        <div
          className="absolute top-16 left-0 bg-earth-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-30"
          style={{ animation: 'float-card 5s ease-in-out infinite reverse' }}
        >
          +24% Growth 🚀
        </div>

        {/* Background Card (Stock Graph) */}
        <div
          className="absolute top-24 right-0 w-32 h-24 bg-white/80 backdrop-blur-sm rounded-xl shadow-soft z-10 border border-white"
          style={{ animation: 'float-card-delayed 5s ease-in-out infinite' }}
        >
          <div className="p-2">
            <div className="w-8 h-1 bg-gray-200 rounded mb-2" />
            <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
              {/* Grid */}
              <line x1="0" y1="15" x2="100" y2="15" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#f0f0f0" strokeWidth="1" />
              <line x1="0" y1="45" x2="100" y2="45" stroke="#f0f0f0" strokeWidth="1" />

              {/* Stock Line */}
              <path
                d="M0 50 L20 40 L40 45 L60 20 L80 30 L100 10"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="100"
                style={{ animation: 'draw-line 4s ease-in-out infinite alternate' }}
              />
              {/* Pulsing Dot at end */}
              <circle cx="100" cy="10" r="3" fill="#10B981" style={{ animation: 'pulse-dot 2s infinite' }} />
            </svg>
          </div>
        </div>

        {/* Main Front Card (Bar Chart) */}
        <div
          className="absolute top-36 left-6 w-40 h-32 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-20 border border-gray-50"
          style={{ animation: 'float-card 4s ease-in-out infinite' }}
        >
          <div className="h-full flex flex-col justify-between p-4">
            {/* Header lines */}
            <div className="flex gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-earth-primary" />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <div className="w-12 h-1.5 bg-gray-200 rounded" />
                <div className="w-8 h-1.5 bg-gray-100 rounded" />
              </div>
            </div>

            {/* Bars Container */}
            <div className="flex items-end justify-between h-16 px-2 gap-2">
              {/* Bar 1 - Emerald */}
              <div className="w-5 bg-gray-50 rounded-t-md relative overflow-hidden h-full flex items-end">
                <div
                  className="w-full bg-emerald-400 rounded-t-md shadow-sm"
                  style={{ height: '100%', animation: 'grow-bar 3s ease-in-out infinite' }}
                />
              </div>
              {/* Bar 2 - Blue */}
              <div className="w-5 bg-gray-50 rounded-t-md relative overflow-hidden h-full flex items-end">
                <div
                  className="w-full bg-blue-400 rounded-t-md shadow-sm"
                  style={{ height: '100%', animation: 'grow-bar-2 3.5s ease-in-out infinite' }}
                />
              </div>
              {/* Bar 3 - Orange */}
              <div className="w-5 bg-gray-50 rounded-t-md relative overflow-hidden h-full flex items-end">
                <div
                  className="w-full bg-orange-400 rounded-t-md shadow-sm"
                  style={{ height: '100%', animation: 'grow-bar-3 4s ease-in-out infinite' }}
                />
              </div>
              {/* Bar 4 - Earth */}
              <div className="w-5 bg-gray-50 rounded-t-md relative overflow-hidden h-full flex items-end">
                <div
                  className="w-full bg-earth-primary rounded-t-md shadow-sm"
                  style={{ height: '100%', animation: 'grow-bar 4.5s ease-in-out infinite reverse' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedGraphsIcon;
