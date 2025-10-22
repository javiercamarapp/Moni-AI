import { useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import earthTexture from '@/assets/earth-texture.png';

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  // Cargar textura de la Tierra
  const texture = useLoader(THREE.TextureLoader, earthTexture);

  return (
    <>
      {/* Luz ambiental suave */}
      <ambientLight intensity={0.3} />
      
      {/* Luz principal que simula el sol */}
      <directionalLight 
        position={[5, 2, 5]} 
        intensity={2}
        castShadow
      />
      
      {/* Luz de relleno para mostrar el lado oscuro */}
      <pointLight position={[-5, 0, -5]} intensity={0.5} color="#4af" />
      
      {/* Planeta Tierra con textura realista */}
      <Sphere ref={meshRef} args={[1.5, 128, 128]} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial 
          map={texture}
          metalness={0.2}
          roughness={0.7}
          emissive="#001122"
          emissiveIntensity={0.1}
        />
      </Sphere>
      
      {/* Atmósfera brillante exterior */}
      <Sphere args={[1.58, 128, 128]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#2080ff"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Segunda capa de atmósfera más suave */}
      <Sphere args={[1.62, 128, 128]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#60a5ff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

export default function EarthPlanet3D() {
  return (
    <div className="w-32 h-32">
      <Canvas 
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <Suspense fallback={null}>
          <Earth />
        </Suspense>
      </Canvas>
    </div>
  );
}
