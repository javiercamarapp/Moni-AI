import { MeshGradient } from "@paper-design/shaders-react"
import { useEffect, useState } from "react"

export default function WarpShaderHero() {
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <MeshGradient
        width={dimensions.width}
        height={dimensions.height}
        colors={["hsl(40, 30%, 88%)", "hsl(38, 40%, 80%)", "hsl(36, 35%, 70%)", "hsl(42, 45%, 85%)"]}
        distortion={0.8}
        swirl={0.1}
        speed={0.5}
      />
    </div>
  )
}
