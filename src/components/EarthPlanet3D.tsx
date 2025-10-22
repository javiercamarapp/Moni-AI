import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import earthTexture from '@/assets/earth-texture.png';

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  const texture = new THREE.TextureLoader().load(earthTexture);

  return (
    <>
      {/* Luz ambiental */}
      <ambientLight intensity={0.5} />
      
      {/* Luz direccional para dar profundidad */}
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} />
      
      {/* Planeta Tierra */}
      <Sphere ref={meshRef} args={[1.5, 64, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          map={texture}
          metalness={0.1}
          roughness={0.8}
        />
      </Sphere>
      
      {/* Atmósfera brillante */}
      <Sphere args={[1.55, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#4af"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function EarthPlanet3D() {
  return (
    <div className="w-32 h-32">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <Earth />
      </Canvas>
    </div>
  );
}
