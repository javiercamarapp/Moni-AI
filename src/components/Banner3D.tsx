import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, RoundedBox } from '@react-three/drei';
import { TrendingUp, Target, Users } from 'lucide-react';

interface BannerProps {
  position: [number, number, number];
  title: string;
  description: string;
  color: string;
}

function Banner({ position, title, description, color }: BannerProps) {
  return (
    <group position={position}>
      <RoundedBox args={[3, 2, 0.2]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </RoundedBox>
      <Text
        position={[0, 0.4, 0.15]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
        fontWeight="bold"
      >
        {title}
      </Text>
      <Text
        position={[0, -0.2, 0.15]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.5}
      >
        {description}
      </Text>
    </group>
  );
}

export function Banner3D() {
  return (
    <div className="w-full h-[300px] sm:h-[400px]">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Banner
          position={[-4, 0, 0]}
          title="Oferta Especial"
          description="20% en tu primer inversión"
          color="#6366f1"
        />
        <Banner
          position={[0, 0, 0]}
          title="Alcanza tus Metas"
          description="Planifica y ahorra"
          color="#8b5cf6"
        />
        <Banner
          position={[4, 0, 0]}
          title="Ahorro en Grupo"
          description="Multiplica tus ahorros"
          color="#a855f7"
        />
        
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={12}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
