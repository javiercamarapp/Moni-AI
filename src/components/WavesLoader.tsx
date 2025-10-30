import { Waves } from "@/components/ui/waves-background";
import moniLogo from "/moni-logo.png";

export function WavesLoader() {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <img 
        src={moniLogo} 
        alt="Moni" 
        className="w-[280px] max-w-[90vw] animate-[pulse_2s_ease-in-out_infinite]"
      />
    </div>
  );
}