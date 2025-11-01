import { Waves } from "@/components/ui/waves-background";
import moniLogo from "/moni-logo.png";
import authBackground from "@/assets/auth-abstract-bg.png";

export function WavesLoader() {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Fondo abstracto */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${authBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <img 
        src={moniLogo} 
        alt="Moni" 
        className="w-[280px] max-w-[90vw] animate-[pulse_2s_ease-in-out_infinite] relative z-10"
      />
    </div>
  );
}