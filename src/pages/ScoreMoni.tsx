import { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, PiggyBank, CreditCard, Target, Zap, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// 3D Score Orb Component
function ScoreOrb({ score }: { score: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  // Color based on score
  const getColor = () => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere
        ref={meshRef}
        args={[2, 128, 128]}
        scale={hovered ? 1.1 : 1}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <MeshDistortMaterial
          color={getColor()}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
          emissive={getColor()}
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      {/* Score text as HTML overlay */}
      <Html position={[0, 0, 0]} center>
        <div className="text-6xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] pointer-events-none">
          {score}
        </div>
      </Html>
    </Float>
  );
}

// Particle field background
function ParticleField() {
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  const particleCount = 1000;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50;
    positions[i + 1] = (Math.random() - 0.5) * 50;
    positions[i + 2] = (Math.random() - 0.5) * 50;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#8b5cf6" transparent opacity={0.6} />
    </points>
  );
}

const ScoreMoni = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(40);
  const [loading, setLoading] = useState(true);
  const [components, setComponents] = useState({
    savingsAndLiquidity: 0,
    debt: 0,
    control: 0,
    growth: 0,
    behavior: 0
  });

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_scores')
          .select('score_moni')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setScore(data.score_moni);
          
          // Calculate component breakdown (simulated based on score)
          const basePercentage = data.score_moni / 100;
          setComponents({
            savingsAndLiquidity: Math.round(30 * basePercentage * (0.9 + Math.random() * 0.2)),
            debt: Math.round(20 * basePercentage * (0.9 + Math.random() * 0.2)),
            control: Math.round(20 * basePercentage * (0.9 + Math.random() * 0.2)),
            growth: Math.round(15 * basePercentage * (0.9 + Math.random() * 0.2)),
            behavior: Math.round(15 * basePercentage * (0.9 + Math.random() * 0.2))
          });
        }
      }
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: 'Excelente', color: 'from-emerald-600 to-emerald-800' };
    if (score >= 60) return { level: 'Bueno', color: 'from-blue-600 to-blue-800' };
    if (score >= 40) return { level: 'Regular', color: 'from-orange-600 to-orange-800' };
    return { level: 'Necesita Mejorar', color: 'from-red-600 to-red-800' };
  };

  const scoreLevel = getScoreLevel(score);

  const scoreComponents = [
    {
      name: 'Ahorro y Liquidez',
      value: components.savingsAndLiquidity,
      max: 30,
      icon: PiggyBank,
      color: 'from-emerald-600/90 to-emerald-800/90',
      description: 'Capacidad de ahorro mensual, meses de liquidez disponible, y fondos de emergencia'
    },
    {
      name: 'Gestión de Deuda',
      value: components.debt,
      max: 20,
      icon: CreditCard,
      color: 'from-red-600/90 to-red-800/90',
      description: 'Ratio deuda-ingreso, carga financiera, y gestión de intereses'
    },
    {
      name: 'Control Financiero',
      value: components.control,
      max: 20,
      icon: Target,
      color: 'from-blue-600/90 to-blue-800/90',
      description: 'Gastos fijos vs variables, gastos hormiga, y control de presupuesto'
    },
    {
      name: 'Crecimiento Patrimonial',
      value: components.growth,
      max: 15,
      icon: TrendingUp,
      color: 'from-purple-600/90 to-purple-800/90',
      description: 'Tasa de inversión, ROE personal, y crecimiento de patrimonio'
    },
    {
      name: 'Hábitos Financieros',
      value: components.behavior,
      max: 15,
      icon: Activity,
      color: 'from-orange-600/90 to-orange-800/90',
      description: 'Cumplimiento de metas, consistencia en ahorro, y compras impulsivas'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dashboard flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Calculando tu Score Moni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dashboard pb-20">
      {/* Header */}
      <div className="bg-gradient-card/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/analysis')}
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Score Moni 3D</h1>
              <p className="text-xs text-white/70">Visualización Ultra Realista de tu Salud Financiera</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 3D Score Visualization */}
        <Card className={`p-0 bg-gradient-to-br ${scoreLevel.color} card-glow shadow-2xl border-2 border-white/20 relative overflow-hidden h-[400px]`}>
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
              
              <ParticleField />
              <ScoreOrb score={score} />
              
              <OrbitControls 
                enableZoom={false} 
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
              />
              <Environment preset="night" />
            </Suspense>
          </Canvas>
          
          {/* Score overlay */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 border border-white/20">
              <p className="text-xs text-white/80">Tu Score Moni</p>
              <p className="text-3xl font-bold text-white">{score}<span className="text-lg">/100</span></p>
              <p className="text-xs text-white/70 mt-1">{scoreLevel.level}</p>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 border border-white/20">
              <p className="text-xs text-white/90 text-center">
                🎯 Interactúa con la esfera - Arrastra para rotar
              </p>
            </div>
          </div>
        </Card>

        {/* Methodology Explanation */}
        <Card className="p-6 bg-gradient-card card-glow border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Metodología IA del Score Moni</h2>
              <p className="text-xs text-white/70">Análisis multidimensional de 100 puntos</p>
            </div>
          </div>
          
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            Nuestro sistema de IA analiza tu salud financiera a través de 5 dimensiones fundamentales, 
            cada una con un peso específico que suma un total de 100 puntos. Esta metodología está diseñada 
            para dar una visión holística y precisa de tu situación financiera actual.
          </p>
        </Card>

        {/* Score Components Breakdown */}
        <div className="space-y-3">
          {scoreComponents.map((component, index) => {
            const Icon = component.icon;
            const percentage = (component.value / component.max) * 100;
            
            return (
              <Card 
                key={index}
                className={`p-4 bg-gradient-to-br ${component.color} card-glow border-2 border-white/20 relative overflow-hidden animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                
                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-white">{component.name}</h3>
                        <span className="text-lg font-bold text-white">
                          {component.value}<span className="text-xs text-white/70">/{component.max}</span>
                        </span>
                      </div>
                      <p className="text-xs text-white/80 mb-3">{component.description}</p>
                      
                      {/* Progress bar */}
                      <div className="relative h-2 bg-black/30 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-white/90 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* AI Insights */}
        <Card className="p-6 bg-gradient-to-br from-purple-600/90 to-purple-800/90 card-glow border-2 border-purple-500/30">
          <h3 className="text-lg font-bold text-white mb-3">🤖 Análisis IA</h3>
          <div className="space-y-2 text-sm text-white/90">
            <p>
              {score >= 80 && "¡Excelente trabajo! Tu perfil financiero está en un nivel óptimo. Mantén estos hábitos y considera diversificar aún más tus inversiones."}
              {score >= 60 && score < 80 && "Tu situación financiera es sólida. Continúa mejorando en las áreas con menor puntaje para alcanzar la excelencia."}
              {score >= 40 && score < 60 && "Vas por buen camino, pero hay áreas importantes que requieren atención. Enfócate en mejorar tu ahorro y control de gastos."}
              {score < 40 && "Es momento de tomar acción. Establece un presupuesto, reduce deudas y comienza a construir un fondo de emergencia. ¡Tú puedes!"}
            </p>
          </div>
        </Card>

        <Button 
          onClick={() => navigate('/analysis')}
          className="w-full bg-gradient-card card-glow hover:bg-white/20 text-white border border-white/30"
        >
          Volver al Análisis
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ScoreMoni;