import { MeshGradient } from "@paper-design/shaders-react"
import { useEffect, useState } from "react"

export function HeroSection() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return (
    <div className="fixed inset-0 w-screen h-screen z-0">
      {mounted && (
        <>
          <MeshGradient
            width={dimensions.width}
            height={dimensions.height}
            colors={["hsl(40, 30%, 88%)", "hsl(38, 40%, 80%)", "hsl(36, 35%, 70%)", "hsl(42, 45%, 85%)", "hsl(40, 35%, 82%)", "hsl(38, 38%, 86%)"]}
            distortion={1.2}
            swirl={0.6}
            grainMixer={0}
            grainOverlay={0}
            speed={0.8}
            offsetX={0.08}
          />
          <div className="absolute inset-0 pointer-events-none bg-white/10" />
        </>
      )}
    </div>
  )
}
