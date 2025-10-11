"use client";

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Image, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CarouselImageProps {
  position: [number, number, number];
  rotation: [number, number, number];
  url: string;
  index: number;
  totalImages: number;
}

function CarouselImage({ position, rotation, url, index, totalImages }: CarouselImageProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const angle = (index / totalImages) * Math.PI * 2 + time * 0.2;
      const radius = 4;
      meshRef.current.position.x = Math.cos(angle) * radius;
      meshRef.current.position.z = Math.sin(angle) * radius;
      meshRef.current.rotation.y = -angle + Math.PI / 2;
      
      if (hovered) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[2, 2.5]} />
      <meshStandardMaterial>
        <Image url={url} transparent opacity={1} />
      </meshStandardMaterial>
    </mesh>
  );
}

export function ThreeDPhotoCarousel() {
  const images = [
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1579621970817-64e16a5c1aa0?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1579621970890-91eb2e7f1e2f?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1579621970943-7b16d1b4b3b0?w=400&h=500&fit=crop',
  ];

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {images.map((url, index) => (
          <CarouselImage
            key={index}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            url={url}
            index={index}
            totalImages={images.length}
          />
        ))}
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
