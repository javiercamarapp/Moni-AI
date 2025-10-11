"use client";

import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CarouselBoxProps {
  position: [number, number, number];
  color: string;
  index: number;
  totalBoxes: number;
}

function CarouselBox({ position, color, index, totalBoxes }: CarouselBoxProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const angle = (index / totalBoxes) * Math.PI * 2 + time * 0.3;
      const radius = 3.5;
      meshRef.current.position.x = Math.cos(angle) * radius;
      meshRef.current.position.z = Math.sin(angle) * radius;
      meshRef.current.rotation.y = -angle;
      
      const scale = hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      <boxGeometry args={[1.5, 2, 0.1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Scene() {
  const colors = ['#dd7bbb', '#d79f1e', '#5a922c', '#4c7894', '#9b59b6', '#e74c3c'];
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {colors.map((color, index) => (
        <CarouselBox
          key={index}
          position={[0, 0, 0]}
          color={color}
          index={index}
          totalBoxes={colors.length}
        />
      ))}
      
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        autoRotate={false}
      />
    </>
  );
}

export function ThreeDPhotoCarousel() {
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-background/50 to-background/80 rounded-lg">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs text-center">
        Arrastra para rotar • Scroll para zoom
      </div>
    </div>
  );
}
