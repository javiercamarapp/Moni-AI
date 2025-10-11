import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function RotatingBox({ position, color, index, total }: { position: [number, number, number], color: string, index: number, total: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const angle = (index / total) * Math.PI * 2 + time * 0.3;
    const radius = 3;
    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.z = Math.sin(angle) * radius;
    meshRef.current.rotation.y = -angle;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1.5, 2, 0.2]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export function ThreeDPhotoCarousel() {
  const colors = ['#dd7bbb', '#d79f1e', '#5a922c', '#4c7894', '#9b59b6', '#e74c3c'];
  
  return (
    <div className="w-full h-full bg-black/20 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        {colors.map((color, i) => (
          <RotatingBox key={i} position={[0, 0, 0]} color={color} index={i} total={colors.length} />
        ))}
        
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs">
        Arrastra para rotar
      </div>
    </div>
  );
}
