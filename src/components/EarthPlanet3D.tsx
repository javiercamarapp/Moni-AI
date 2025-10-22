import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.12;
    }
  });

  // Crear textura procedural de la Tierra
  const createEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Fondo oceánico azul
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(0.5, '#2563eb');
    gradient.addColorStop(1, '#1e40af');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Agregar continentes verdes/marrones
    ctx.fillStyle = '#22c55e';
    
    // América del Norte
    ctx.beginPath();
    ctx.ellipse(150, 180, 60, 80, Math.PI * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // América del Sur
    ctx.beginPath();
    ctx.ellipse(200, 300, 40, 70, Math.PI * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Europa y África
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(512, 200, 70, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(700, 180, 120, 100, Math.PI * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Agregar detalles de tierra
    ctx.fillStyle = '#14532d';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 20 + 5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  };

  const earthTexture = createEarthTexture();

  return (
    <>
      {/* Luz ambiental suave */}
      <ambientLight intensity={0.4} />
      
      {/* Luz principal del sol */}
      <directionalLight 
        position={[5, 2, 5]} 
        intensity={1.5}
        castShadow
      />
      
      {/* Luz de relleno */}
      <pointLight position={[-5, 0, -5]} intensity={0.4} color="#60a5fa" />
      
      {/* Planeta Tierra */}
      <Sphere ref={meshRef} args={[1.5, 128, 128]} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial 
          map={earthTexture}
          metalness={0.1}
          roughness={0.8}
          emissive="#001a33"
          emissiveIntensity={0.1}
        />
      </Sphere>
      
      {/* Nubes semi-transparentes */}
      <Sphere ref={cloudsRef} args={[1.52, 64, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={1}
        />
      </Sphere>
      
      {/* Atmósfera brillante */}
      <Sphere args={[1.58, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#3b82f6"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Segunda capa de atmósfera */}
      <Sphere args={[1.62, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial 
          color="#60a5fa"
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
        minPolarAngle={Math.PI / 3}
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
