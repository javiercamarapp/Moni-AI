import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveVisualizerProps {
  isRecording?: boolean;
  bars?: number;
  className?: string;
}

export function AudioWaveVisualizer({ 
  isRecording = false, 
  bars = 60,
  className 
}: AudioWaveVisualizerProps) {
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setHeights(Array.from({ length: bars }, () => 
          Math.random() * 100
        ));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setHeights(Array.from({ length: bars }, () => 4));
    }
  }, [isRecording, bars]);

  return (
    <div className={cn("flex items-center justify-center gap-0.5 h-12", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-150",
            isRecording ? "bg-white/70" : "bg-white/20"
          )}
          style={{
            height: isRecording ? `${heights[i] || 4}%` : '4px',
          }}
        />
      ))}
    </div>
  );
}
