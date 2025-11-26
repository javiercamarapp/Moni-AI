
import React from "react";

const AnimatedNotificationsIcon: React.FC = () => {
  return (
    <div className="relative w-48 h-64 flex items-center justify-center">
      <style>
        {`
          @keyframes float-phone {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes msg-pop-1 {
            0% { opacity: 0; transform: translateY(20px) scale(0.8); }
            10%, 90% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
          }
          @keyframes msg-pop-2 {
            0%, 20% { opacity: 0; transform: translateY(20px) scale(0.8); }
            30%, 90% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
          }
          @keyframes msg-pop-3 {
            0%, 40% { opacity: 0; transform: translateY(20px) scale(0.8); }
            50%, 90% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
          }
           @keyframes msg-pop-4 {
            0%, 60% { opacity: 0; transform: translateY(20px) scale(0.8); }
            70%, 90% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-40px) scale(0.9); }
          }
        `}
      </style>

      {/* Glow Behind */}
      <div className="absolute w-40 h-52 bg-green-500/20 rounded-[2.5rem] blur-2xl animate-pulse"></div>

      {/* Phone Case */}
      <div 
        className="relative z-10 w-32 h-56 bg-gray-900 rounded-[2rem] border-[6px] border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
        style={{ animation: 'float-phone 5s ease-in-out infinite' }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-black rounded-b-xl z-20"></div>

        {/* Screen Background (Chat App) */}
        <div className="w-full h-full bg-[#E5DDD5] relative flex flex-col p-3 pt-8 overflow-hidden">
            {/* Chat Pattern Overlay */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

            {/* Header */}
            <div className="absolute top-0 left-0 w-full h-10 bg-[#075E54] z-10 flex items-center px-3 pt-2">
                <div className="w-6 h-6 rounded-full bg-white/20"></div>
                <div className="ml-2 w-16 h-2 bg-white/20 rounded"></div>
            </div>

            {/* Messages Container */}
            <div className="flex flex-col gap-3 mt-4">
                
                {/* Msg 1 */}
                <div className="self-start max-w-[90%] animate-[msg-pop-1_6s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>
                    <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm text-[8px] text-gray-800 relative">
                        <span className="font-bold text-red-500 block mb-0.5">⚠️ Cargo Inusual</span>
                        $5,400 en Liverpool?
                        <span className="text-[6px] text-gray-400 block text-right mt-1">10:42 AM</span>
                    </div>
                </div>

                {/* Msg 2 */}
                <div className="self-start max-w-[90%] animate-[msg-pop-2_6s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>
                    <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm text-[8px] text-gray-800 relative">
                        <span className="font-bold text-orange-500 block mb-0.5">📉 Gasto Alto</span>
                        Has gastado 80% en Comida
                        <span className="text-[6px] text-gray-400 block text-right mt-1">10:43 AM</span>
                    </div>
                </div>

                 {/* Msg 3 */}
                 <div className="self-start max-w-[90%] animate-[msg-pop-3_6s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>
                    <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm text-[8px] text-gray-800 relative">
                        <span className="font-bold text-green-600 block mb-0.5">🎉 Meta Lograda</span>
                        ¡Ahorraste $2,000 hoy!
                        <span className="text-[6px] text-gray-400 block text-right mt-1">10:45 AM</span>
                    </div>
                </div>
                
                {/* Msg 4 */}
                <div className="self-start max-w-[90%] animate-[msg-pop-4_6s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>
                    <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm text-[8px] text-gray-800 relative">
                        <span className="font-bold text-blue-600 block mb-0.5">📅 Pago Próximo</span>
                        Netflix vence mañana
                        <span className="text-[6px] text-gray-400 block text-right mt-1">10:48 AM</span>
                    </div>
                </div>

            </div>
        </div>

        {/* Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none rounded-[1.8rem]"></div>
      </div>
    </div>
  );
};

export default AnimatedNotificationsIcon;
