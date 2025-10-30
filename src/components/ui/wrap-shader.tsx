import { Warp } from "@paper-design/shaders-react"
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
      <Warp
        width={dimensions.width}
        height={dimensions.height}
        colors={["hsl(40, 30%, 88%)", "hsl(38, 40%, 80%)", "hsl(36, 35%, 70%)", "hsl(42, 45%, 85%)"]}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={0.3}
      />
    </div>
  )
}
