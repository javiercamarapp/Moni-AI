import { Waves } from "@/components/ui/waves-background";
import moniLogo from "/moni-logo.png";

export function WavesLoader() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Waves
        lineColor="rgba(255, 255, 255, 0.2)"
        backgroundColor="#000000"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
      />
      
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <img 
          src={moniLogo} 
          alt="Moni" 
          className="w-[280px] max-w-[90vw] animate-[pulse_2s_ease-in-out_infinite]"
        />
      </div>
    </div>
  );
}