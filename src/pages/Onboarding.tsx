
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnimatedGraphsIcon from '../components/onboarding/AnimatedGraphsIcon';
import ThreeDStarIcon from '../components/onboarding/ThreeDStarIcon';
import AnimatedRobotIcon from '../components/onboarding/AnimatedRobotIcon';
import AnimatedTrophyIcon from '../components/onboarding/AnimatedTrophyIcon';
import AnimatedTargetIcon from '../components/onboarding/AnimatedTargetIcon';
import AnimatedArmIcon from '../components/onboarding/AnimatedArmIcon';
import AnimatedScoreIcon from '../components/onboarding/AnimatedScoreIcon';
import AnimatedSocialIcon from '../components/onboarding/AnimatedSocialIcon';
import AnimatedNotificationsIcon from '../components/onboarding/AnimatedNotificationsIcon';
import MultiOrbitSemiCircle from '../components/onboarding/ui/MultiOrbitSemiCircle';
import { StackCardCarousel } from '../components/onboarding/ui/StackCard';
import onboardingHero from '@/assets/onboarding-hero.png';

const Onboarding: React.FC = () => {
    const [step, setStep] = useState(0);
    const [showBackground, setShowBackground] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    React.useEffect(() => {
        // Splash screen timer
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2100);
        return () => clearTimeout(timer);
    }, []);


    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) return;
        try {
            // This promise resolves when the user clicks 'Allow' or 'Block', or dismisses the prompt.
            const permission = await Notification.requestPermission();
            console.log("Notification permission result:", permission);
        } catch (e) {
            console.error("Error requesting notification permission", e);
        }
    };

    const handleSkip = async () => {
        // Trigger permission request on direct user interaction (click)
        await requestNotificationPermission();
        finishOnboarding();
    };

    const handleComplete = async () => {
        // Trigger permission request on direct user interaction (click)
        await requestNotificationPermission();
        finishOnboarding();
    };

    const finishOnboarding = () => {
        setShowBackground(true);
        setTimeout(() => {
            navigate('/auth');
        }, 2000);
    };

    const animationStyles = `
    @keyframes slideInFade {
      0% { opacity: 0; transform: translateY(15px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInLeftFade {
      0% { opacity: 0; transform: translateX(-30px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInRightFade {
      0% { opacity: 0; transform: translateX(30px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.5) translateY(20px); }
      60% { transform: scale(1.1); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes float-y {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes float-y-reverse {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(8px); }
    }
    @keyframes float-diagonal {
      0%, 100% { transform: translate(0px, 0px); }
      50% { transform: translate(4px, -6px); }
    }
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(1deg); }
    }
    .animate-item {
      opacity: 0;
      animation: slideInFade 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
    .animate-item-left {
      opacity: 0;
      animation: slideInLeftFade 2.0s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
    .animate-item-alt {
      opacity: 0;
      animation: slideInRightFade 2.0s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
    .animate-chip {
      opacity: 0;
      animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .animate-float {
      animation: float-y 4s ease-in-out infinite;
    }
    .animate-float-reverse {
      animation: float-y-reverse 5s ease-in-out infinite;
    }
    .animate-float-diagonal {
      animation: float-diagonal 4.5s ease-in-out infinite;
    }
  `;

    const steps = [
        {
            title: "Tu Glow Up Financiero empieza aquí",
            description: (
                <div className="w-full flex flex-col items-center">
                    <style>{animationStyles}</style>

                    <p className="text-text-secondary text-center mb-4 sm:mb-4 text-sm sm:text-base font-medium animate-in fade-in duration-1000 px-4">
                        Con MONI AI entiendes tu dinero.
                    </p>

                    {/* Animated Bullet List - Large Cards Slide Left */}
                    <div className="space-y-2.5 w-full max-w-[320px]">
                        <div className="animate-item-left flex items-center gap-3 bg-white/80 p-3 rounded-2xl shadow-sm border border-white/60 transform hover:scale-[1.02] transition-transform" style={{ animationDelay: '0.2s' }}>
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-lg shadow-inner">🗂️</div>
                            <span className="text-text-main font-bold text-sm">Organiza tu dinero</span>
                        </div>
                        <div className="animate-item-left flex items-center gap-3 bg-white/80 p-3 rounded-2xl shadow-sm border border-white/60 transform hover:scale-[1.02] transition-transform" style={{ animationDelay: '0.6s' }}>
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-lg shadow-inner">💰</div>
                            <span className="text-text-main font-bold text-sm">Ahorra sin esfuerzo</span>
                        </div>
                        <div className="animate-item-left flex items-center gap-3 bg-white/80 p-3 rounded-2xl shadow-sm border border-white/60 transform hover:scale-[1.02] transition-transform" style={{ animationDelay: '1.0s' }}>
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-lg shadow-inner">🧠</div>
                            <span className="text-text-main font-bold text-sm">Toma decisiones inteligentes</span>
                        </div>
                        <div className="animate-item-left flex items-center gap-3 bg-white/80 p-3 rounded-2xl shadow-sm border border-white/60 transform hover:scale-[1.02] transition-transform" style={{ animationDelay: '1.4s' }}>
                            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-lg">✨</div>
                            <span className="text-text-main font-bold text-sm"> Sin complicarte</span>
                        </div>
                    </div>
                </div>
            ),
            icon: <ThreeDStarIcon />,
            isFullSizeIcon: true,
        },
        {
            title: "Control al instante",
            description: (
                <div className="w-full flex flex-col items-center">
                    <style>{animationStyles}</style>

                    {/* Compact List - Slide Right (Replacing tall bento grid) */}
                    <div className="space-y-2 w-full max-w-[340px] mt-2">
                        <div className="animate-item-alt flex items-center gap-3 bg-white/60 backdrop-blur-sm p-2.5 rounded-2xl shadow-sm border border-white/50" style={{ animationDelay: '0.2s' }}>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg">💻</div>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-text-main font-bold text-sm">Dashboard Unificado</span>
                                <span className="text-xs text-text-secondary">Toda tu vida financiera</span>
                            </div>
                        </div>

                        <div className="animate-item-alt flex items-center gap-3 bg-white/60 backdrop-blur-sm p-2.5 rounded-2xl shadow-sm border border-white/50" style={{ animationDelay: '0.5s' }}>
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-lg">💸</div>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-text-main font-bold text-sm">Rastreo de Gastos</span>
                                <span className="text-xs text-text-secondary">Categorización automática</span>
                            </div>
                        </div>

                        <div className="animate-item-alt flex items-center gap-3 bg-white/60 backdrop-blur-sm p-2.5 rounded-2xl shadow-sm border border-white/50" style={{ animationDelay: '0.8s' }}>
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-lg">🎯</div>
                            <div className="flex flex-col items-start text-left">
                                <span className="text-text-main font-bold text-sm">Metas Claras</span>
                                <span className="text-xs text-text-secondary">Cumple tus objetivos</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            icon: <AnimatedGraphsIcon />,
            isFullSizeIcon: true,
        },
        {
            title: "IA que sí sirve",
            icon: <></>, // Empty icon slot to allow Title to be visually top
            isFullSizeIcon: true,
            description: (
                <div className="w-full max-w-md lg:max-w-lg h-auto md:h-[420px] relative flex flex-col items-center justify-center -mt-6 mx-auto">
                    <style>{animationStyles}</style>

                    {/* Central Robot - static on small screens, slightly lower on md+ to be closer to chips */}
                    <div className="w-full flex justify-center z-10 md:absolute md:top-[55%] md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2">
                        <div className="animate-in fade-in zoom-in duration-1000 delay-100" style={{ animationFillMode: 'both' }}>
                            <div className="transform scale-[0.7] md:scale-[0.75]">
                                <AnimatedRobotIcon />
                            </div>
                        </div>
                    </div>

                    {/* Satellites (Orbiting Chips) - Positioned absolutely around the robot on md+ */}
                    <div className="hidden md:block w-full h-full">

                        {/* 1. Top Left - Gastos Hormiga */}
                        <div className="absolute top-[23%] left-[8%] lg:left-[10%] z-20 animate-chip" style={{ animationDelay: '0.2s' }}>
                            <div className="animate-float">
                                <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-105 max-w-[190px] min-w-[170px]">
                                    <span className="text-lg">🐜</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs lg:text-sm font-bold text-text-main leading-tight">Gastos Hormiga</span>
                                        <span className="text-[10px] text-text-secondary leading-none">Detectados</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Top Right - Suscripciones */}
                        <div className="absolute top-[14%] right-[6%] lg:right-[12%] z-20 animate-chip" style={{ animationDelay: '0.4s' }}>
                            <div className="animate-float-reverse">
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-105 max-w-[150px]">
                                    <span className="text-lg">📅</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs lg:text-sm font-bold text-text-main leading-tight">Suscripciones</span>
                                        <span className="text-[10px] text-text-secondary leading-none">Olvidadas</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Mid/Bottom Left - Cargos Dobles */}
                        <div className="absolute bottom-[28%] left-[0%] lg:left-[2%] z-20 animate-chip" style={{ animationDelay: '0.8s' }}>
                            <div className="animate-float">
                                <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-105 max-w-[190px] min-w-[170px]">
                                    <span className="text-lg">🔔</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs lg:text-sm font-bold text-text-main leading-tight">Cargos Dobles</span>
                                        <span className="text-[10px] text-text-secondary leading-none">Alerta real</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Mid/Bottom Right - Intereses */}
                        <div className="absolute bottom-[51%] right-[9%] lg:right-[7%] z-20 animate-chip" style={{ animationDelay: '0.6s' }}>
                            <div className="animate-float-diagonal">
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-105 max-w-[150px]">
                                    <span className="text-lg">📉</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs lg:text-sm font-bold text-text-main leading-tight">Intereses</span>
                                        <span className="text-[10px] lg:text-xs text-text-secondary leading-none">Claros</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Bottom Center - Prediccion */}
                        <div className="absolute bottom-[24%] left-[64%] transform -translate-x-[60%] z-20 animate-chip" style={{ animationDelay: '1.0s' }}>
                            <div className="animate-float-reverse">
                                <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-105 max-w-[210px] min-w-[190px]">
                                    <span className="text-lg">🔮</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs lg:text-sm font-bold text-text-main leading-tight whitespace-nowrap">Predicción de Saldo</span>
                                        <span className="text-[10px] lg:text-xs text-text-secondary leading-none">Fin de mes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Fallback layout for very small screens: stack chips clearly below robot */}
                    <div className="mt-12 w-full space-y-2 md:hidden z-20 relative">
                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/60 flex items-center gap-2 max-w-full mx-auto">
                            <span className="text-base">🐜</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-text-main leading-tight">Gastos Hormiga</span>
                                <span className="text-[11px] text-text-secondary leading-none">Detectados</span>
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/60 flex items-center gap-2 max-w-full mx-auto">
                            <span className="text-base">📅</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-text-main leading-tight">Suscripciones olvidadas</span>
                                <span className="text-[11px] text-text-secondary leading-none">Te avisamos a tiempo</span>
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/60 flex items-center gap-2 max-w-full mx-auto">
                            <span className="text-base">📉</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-text-main leading-tight">Intereses ocultos</span>
                                <span className="text-[11px] text-text-secondary leading-none">Los hacemos visibles</span>
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/60 flex items-center gap-2 max-w-full mx-auto">
                            <span className="text-base">🔔</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-text-main leading-tight">Cargos dobles</span>
                                <span className="text-[11px] text-text-secondary leading-none">Alerta en el momento</span>
                            </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-white/60 flex items-center gap-2 max-w-full mx-auto">
                            <span className="text-base">🔮</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-text-main leading-tight">Predicción de saldo</span>
                                <span className="text-[11px] text-text-secondary leading-none">Fin de mes, sin sorpresas</span>
                            </div>
                        </div>
                    </div>

                </div>
            ),
        },
        {
            title: "Todas tus cuentas bancarias en un mismo lugar",
            icon: <></>,
            isFullSizeIcon: true,
            description: (
                <div className="w-full flex flex-col items-center">
                    <style>{animationStyles}</style>

                    {/* Animation Area - Reduced padding to bring closer to title */}
                    <div className="relative w-full max-w-xl lg:max-w-2xl flex items-center justify-center animate-in fade-in zoom-in duration-1000 mb-2">
                        <MultiOrbitSemiCircle />
                    </div>

                    {/* Description Text - Increased size */}
                    <div className="max-w-xs text-center mt-0">
                        <p className="bg-transparent text-text-secondary text-lg font-semibold leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            Conecta tus cuentas de banco y controla <b>todas tus transacciones</b>.
                        </p>
                    </div>

                    {/* Secondary Section: WhatsApp Quick Capture */}
                    <div className="mt-24 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 animate-item-alt" style={{ animationDelay: '0.8s' }}>
                        {/* Simple Phone + WhatsApp Bubble SVG (no white chip background) */}
                        <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center animate-float-diagonal">
                            <svg viewBox="0 0 64 64" className="w-16 h-16 sm:w-18 sm:h-18">
                                {/* Phone body */}
                                <rect x="13" y="4" width="38" height="56" rx="9" className="fill-gray-100 stroke-gray-300" strokeWidth="1.5" />
                                <rect x="19" y="12" width="26" height="36" rx="5" className="fill-white" />
                                {/* WhatsApp bubble */}
                                <circle cx="44" cy="20" r="9" className="fill-[#25D366]" />
                                <path d="M41 18.5c.7 1.8 2 3.3 3.7 4.3" className="stroke-white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                                <path d="M44.4 22.8 47 23.5" className="stroke-white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                                {/* Home bar */}
                                <rect x="28" y="49" width="8" height="2" rx="1" className="fill-gray-300" />
                            </svg>
                        </div>

                        <p className="mt-1 sm:mt-0 text-xs sm:text-sm text-text-secondary text-center sm:text-left max-w-xs leading-snug">
                            <span className="font-bold">¿Gastos en efectivo?</span> <br></br>Regístralos fácilmente con WhatsApp.
                        </p>
                    </div>
                </div>
            ),
        },
        {
            title: "El juego financiero",
            description: (
                <div className="w-full flex flex-col items-center">
                    <style>{animationStyles}</style>

                    {/* Subtitle - Larger and Clearer */}
                    <p className="text-sm sm:text-base text-text-secondary text-center mb-4 leading-snug px-2 font-medium animate-in fade-in duration-1000">
                        Compara tu patrimonio actual con tu objetivo a alcanzar. <br></br>Avanza tu progreso conforme mejoras tus ingresos, ahorras más o reduces deudas.
                    </p>

                    {/* Two Column Grid for Features - Compacted Boxes */}
                    <div className="grid grid-cols-2 gap-1.5 w-full max-w-sm">

                        {/* Item 1 */}
                        <div className="animate-item flex flex-col p-2 bg-white/80 rounded-xl shadow-sm border border-white/60" style={{ animationDelay: '0.1s' }}>
                            <div className="text-base mb-0.5">🎮</div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-text-main leading-tight">Tu meta final</span>
                                <span className="text-[12px] text-text-secondary leading-tight mt-0.5">Elige cuánto patrimonio quieres tener.</span>
                            </div>
                        </div>

                        {/* Item 2 */}
                        <div className="animate-item flex flex-col p-2 bg-white/80 rounded-xl shadow-sm border border-white/60" style={{ animationDelay: '0.2s' }}>
                            <div className="text-base mb-0.5">📈</div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-text-main leading-tight">Avanza cada día</span>
                                <span className="text-[12px] text-text-secondary leading-tight mt-0.5">Tu patrimonio actual vs objetivo.</span>
                            </div>
                        </div>

                        {/* Item 3 */}
                        <div className="animate-item flex flex-col p-2 bg-white/80 rounded-xl shadow-sm border border-white/60" style={{ animationDelay: '0.3s' }}>
                            <div className="text-base mb-0.5">🏅</div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-text-main leading-tight">Sube de nivel</span>
                                <span className="text-[12px] text-text-secondary leading-tight mt-0.5">Mejoras = puntos y nivel real.</span>
                            </div>
                        </div>

                        {/* Item 4 */}
                        <div className="animate-item flex flex-col p-2 bg-white/80 rounded-xl shadow-sm border border-white/60" style={{ animationDelay: '0.4s' }}>
                            <div className="text-base mb-0.5">🔥</div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-text-main leading-tight">Rachas</span>
                                <span className="text-[12px] text-text-secondary leading-tight mt-0.5">Consistencia es progreso.</span>
                            </div>
                        </div>

                        {/* Item 5 */}
                        <div className="animate-item flex flex-col p-2 bg-white/80 rounded-xl shadow-sm border border-white/60" style={{ animationDelay: '0.5s' }}>
                            <div className="text-base mb-0.5">✨</div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-text-main leading-tight">Progreso visible</span>
                                <span className="text-[12px] text-text-secondary leading-tight mt-0.5">Tu camino, claro y motivador.</span>
                            </div>
                        </div>

                        {/* Item 6 */}
                        <div className="animate-item flex flex-col p-2 bg-white/80 rounded-xl shadow-sm border border-white/60" style={{ animationDelay: '0.6s' }}>
                            <div className="text-base mb-0.5">🥇</div>
                            <div className="flex flex-col">
                                <span className="text-base font-bold text-text-main leading-tight">Ranking</span>
                                <span className="text-[12px] text-text-secondary leading-tight mt-0.5">Compite con amigos.</span>
                            </div>
                        </div>

                    </div>
                </div>
            ),
            icon: <AnimatedTrophyIcon />,
            isFullSizeIcon: true,
        },
        {
            title: "Personaliza tus metas",
            description: (
                <div className="w-full flex flex-col items-center">
                    <style>{animationStyles}</style>

                    <p className="text-base text-text-secondary text-center mb-6 leading-snug px-4 font-medium animate-in fade-in duration-1000 max-w-[280px]">
                        <span className="block mt-4">Tú eliges el camino, Moni te guía.</span>
                    </p>

                    {/* Tag Cloud / Pills Layout */}
                    <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm px-4">

                        <div className="animate-chip bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-full text-xs font-bold text-text-main flex items-center gap-2 transition-transform hover:scale-105" style={{ animationDelay: '0.1s' }}>
                            <span className="text-sm">🎯</span> Metas Claras
                        </div>


                        <div className="animate-chip bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-full text-xs font-bold text-text-main flex items-center gap-2 transition-transform hover:scale-105" style={{ animationDelay: '0.3s' }}>
                            <span className="text-sm">🧠</span> Plan Dinámico
                        </div>

                        <div className="animate-chip bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-full text-xs font-bold text-text-main flex items-center gap-2 transition-transform hover:scale-105" style={{ animationDelay: '0.4s' }}>
                            <span className="text-sm">🔔</span> Alertas Smart
                        </div>


                        <div className="animate-chip bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-full text-xs font-bold text-text-main flex items-center gap-2 transition-transform hover:scale-105" style={{ animationDelay: '0.6s' }}>
                            <span className="text-sm">🚀</span> Tips Pro
                        </div>

                        {/* Featured Item - Unselected style with loop animation */}
                        <div className="animate-chip" style={{ animationDelay: '0.7s' }}>
                            <div className="animate-float bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-full text-xs font-bold text-text-main flex items-center gap-2 transition-transform hover:scale-105">
                                <span className="text-sm">🎉</span> Celebra Logros
                            </div>
                        </div>

                    </div>
                </div>
            ),
            icon: <AnimatedTargetIcon />,
            isFullSizeIcon: true,
        },
        {
            title: "Domina tus hábitos",
            description: (
                <div className="w-full flex flex-col items-center">
                    <style>{animationStyles}</style>

                    {/* Stack Card Carousel - Auto Playing */}
                    <div className="w-full h-[300px] flex items-center justify-center mt-0">
                        <StackCardCarousel />
                    </div>

                </div>
            ),
            icon: <AnimatedArmIcon />,
            isFullSizeIcon: true,
        },
        {
            title: "Sube de nivel tu cartera 🏆",
            icon: <></>,
            isFullSizeIcon: true,
            description: (
                <div className="w-full h-[500px] relative flex items-center justify-center -mt-8">
                    <style>{animationStyles}</style>

                    {/* Central Animated 3D Card */}
                    <div className="z-10 animate-in zoom-in duration-1000">
                        <AnimatedScoreIcon />
                    </div>

                </div>
            ),
        },
        {
            title: "Conecta con tu gente", // Internal reference, render suppressed
            description: (
                <div className="w-full flex flex-col items-center -mt-6">
                    <style>{animationStyles}</style>

                    {/* 1. Icon Centered Top */}
                    <div className="mb-4 animate-in zoom-in duration-1000">
                        <AnimatedSocialIcon />
                    </div>

                    {/* 2. Title */}
                    <h2 className="text-2xl font-black text-text-main text-center mb-3 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Conecta con tu gente
                    </h2>

                    {/* 3. Subtitle */}
                    <div className="text-center px-4 mb-6 max-w-sm sm:max-w-md lg:max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        <p className="text-xs sm:text-sm text-text-secondary leading-snug">
                            <span className="font-bold text-text-main block mb-1">Tus finanzas también pueden ser un juego en equipo.</span>
                            Comparte, crea metas y avanza con quienes más confías.
                        </p>
                    </div>

                    {/* 4. Pills Grid (Animated Cards) */}
                    <div className="grid grid-cols-2 gap-2 w-full max-w-xs px-2">

                        <div className="animate-chip bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm flex flex-col items-center text-center hover:scale-105 transition-transform" style={{ animationDelay: '0.2s' }}>
                            <span className="text-[32px] mb-1">🤝</span>
                            <span className="text-[14px] font-bold text-text-main leading-tight">Metas grupales</span>
                            <span className="text-[10px] text-text-secondary leading-tight mt-0.5">Logren objetivos juntos.</span>
                        </div>

                        <div className="animate-chip bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm flex flex-col items-center text-center hover:scale-105 transition-transform" style={{ animationDelay: '0.3s' }}>
                            <span className="text-[32px] mb-1">🎉</span>
                            <span className="text-[14px] font-bold text-text-main leading-tight">Comparte éxitos</span>
                            <span className="text-[10px] text-text-secondary leading-tight mt-0.5">Celebra con confianza.</span>
                        </div>

                        <div className="animate-chip bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm flex flex-col items-center text-center hover:scale-105 transition-transform" style={{ animationDelay: '0.4s' }}>
                            <span className="text-[32px] mb-1">🥇</span>
                            <span className="text-[14px] font-bold text-text-main leading-tight">Competencia</span>
                            <span className="text-[10px] text-text-secondary leading-tight mt-0.5">Privacidad y motivación.</span>
                        </div>

                        <div className="animate-chip bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm flex flex-col items-center text-center hover:scale-105 transition-transform" style={{ animationDelay: '0.5s' }}>
                            <span className="text-[32px] mb-1">🚀</span>
                            <span className="text-[14px] font-bold text-text-main leading-tight">Impulso equipo</span>
                            <span className="text-[10px] text-text-secondary leading-tight mt-0.5">Retos pequeños.</span>
                        </div>

                        <div className="animate-chip bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm flex flex-col items-center text-center hover:scale-105 transition-transform" style={{ animationDelay: '0.6s' }}>
                            <span className="text-[32px] mb-1">💬</span>
                            <span className="text-[14px] font-bold text-text-main leading-tight">Motivación real</span>
                            <span className="text-[10px] text-text-secondary leading-tight mt-0.5">Apoyo en todo.</span>
                        </div>

                        <div className="animate-chip bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm flex flex-col items-center text-center hover:scale-105 transition-transform" style={{ animationDelay: '0.7s' }}>
                            <span className="text-[32px] mb-1">🔒</span>
                            <span className="text-[14px] font-bold text-text-main leading-tight">Privado y seguro</span>
                            <span className="text-[10px] text-text-secondary leading-tight mt-0.5">Tú decides qué mostrar.</span>
                        </div>

                    </div>
                </div>
            ),
            icon: <></>,
            isFullSizeIcon: true
        },
        {
            title: "Activa las notificaciones 🔔",
            icon: <></>,
            isFullSizeIcon: true,
            description: (
                <div className="w-full h-[450px] relative flex items-center justify-center -mt-6">
                    <style>{animationStyles}</style>

                    {/* Central 3D Phone Icon - Scaled Slightly UP and pushed DOWN a bit less */}
                    <div className="z-10 animate-in zoom-in duration-1000 transform scale-110 -translate-y-4">
                        <AnimatedNotificationsIcon />
                    </div>

                    {/* Subtitle / Promise - Lowered */}
                    <div className="absolute bottom-[2%] w-full text-center z-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 px-8">
                        <p className="text-sm font-semibold text-text-secondary">Todo en el momento exacto.</p>
                    </div>

                    {/* Orbiting Features (Floating Bubbles) */}

                    {/* Top Left */}
                    <div className="absolute top-[15%] left-[19%] z-20 animate-chip" style={{ animationDelay: '0.2s' }}>
                        <div className="animate-float">
                            <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-110">
                                <span className="text-lg">⚠️</span>
                                <span className="text-xs font-bold text-text-main">Cargos inusuales</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Right */}
                    <div className="absolute top-[25%] md:top-[17%] right-[22%] z-20 animate-chip" style={{ animationDelay: '0.4s' }}>
                        <div className="animate-float-reverse">
                            <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-110">
                                <span className="text-lg">📈</span>
                                <span className="text-xs font-bold text-text-main">Gastos altos</span>
                            </div>
                        </div>
                    </div>

                    {/* Mid Left */}
                    <div className="absolute top-[44%] left-[14%] z-20 animate-chip" style={{ animationDelay: '0.6s' }}>
                        <div className="animate-float-diagonal">
                            <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-110">
                                <span className="text-lg">🎯</span>
                                <span className="text-xs font-bold text-text-main">Progreso de metas</span>
                            </div>
                        </div>
                    </div>

                    {/* Mid Right */}
                    <div className="absolute top-[58%] md:top-[48%] right-[18%] z-20 animate-chip" style={{ animationDelay: '0.8s' }}>
                        <div className="animate-float">
                            <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-white/60 flex items-center gap-2 transition-transform hover:scale-110">
                                <span className="text-lg">📅</span>
                                <span className="text-xs font-bold text-text-main">Pagos próximos</span>
                            </div>
                        </div>
                    </div>



                </div>
            )
        }
    ];

    const handleNext = async () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            await handleComplete();
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center justify-center animate-in fade-out duration-700 delay-300 fill-mode-forwards">
                <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-1000 fade-in">
                    <div className="relative">
                        <h1 className="text-7xl font-black text-black tracking-tighter leading-none">
                            MONI AI.
                        </h1>
                    </div>
                    <p className="text-sm text-black uppercase tracking-[0.4em] font-medium">
                        Coach financiero
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-bg z-50 flex flex-col h-screen justify-between font-sans overflow-hidden">

            {/* Background Fade-In Overlay */}
            <div
                className="absolute inset-0 z-[60] pointer-events-none transition-opacity duration-1000 ease-in-out"
                style={{
                    backgroundImage: `url(${onboardingHero})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: showBackground ? 1 : 0,
                    visibility: showBackground ? 'visible' : 'hidden'
                }}
            />

            {/* HEADER: Skip Button */}
            <div className="flex justify-end shrink-0 h-12 p-4 sm:p-6 pb-0 z-20">
                <button
                    onClick={handleSkip}
                    className="text-text-secondary text-sm font-medium hover:text-earth-primary transition-colors"
                >
                    Omitir
                </button>
            </div>

            {/* MAIN CONTENT: Dynamic Step with Auto-Height */}
            <div className={`flex-1 flex flex-col items-stretch justify-center px-0 relative z-10 max-w-5xl mx-auto w-full ${step === 1 ? '-mt-20' : step === 6 ? '-mt-14' : step === 9 ? '-mt-4' : '-mt-10'}`}>

                {/* Title First (for visual hierarchy in steps >= 2), BUT hidden for Step 8 (Social) as it is inside description */}
                {(step >= 2 && step !== 8) && (
                    <div className="w-full max-w-5xl mx-auto px-6 lg:px-12 flex justify-center mb-4">
                        <h2 className="inline-block text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-text-main text-center tracking-tight lg:whitespace-nowrap leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {steps[step].title}
                        </h2>
                    </div>
                )}

                {/* Icon Area - Hidden for Steps 3, 4, 8, 9, 10 (indices 2, 3, 7, 8, 9) as they use custom layouts */}
                {steps[step].icon && step !== 2 && step !== 3 && step !== 7 && step !== 8 && step !== 9 && (
                    <div className={`mb-3 ${steps[step].isFullSizeIcon ? 'w-full flex justify-center transform scale-[1.05] sm:scale-[1.1] lg:scale-[1.2]' : 'p-8 bg-white rounded-[2rem] shadow-soft'}`}>
                        {steps[step].icon}
                    </div>
                )}

                {/* Text Area - main title centered (for first steps), content alignment unchanged */}
                <div className={`mx-auto w-full max-w-5xl px-6 lg:px-12 transition-all duration-500`}>
                    {step < 2 && (
                        <div className="w-full flex justify-center mb-5">
                            <h2 className="inline-block text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-text-main text-center tracking-tight lg:whitespace-nowrap leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {steps[step].title}
                            </h2>
                        </div>
                    )}

                    <div className="text-text-secondary font-medium leading-relaxed text-[16px] sm:text-lg lg:text-xl text-left animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        {steps[step].description}
                    </div>
                </div>

            </div>

            {/* FOOTER: Indicators & Buttons */}
            <div className="w-full pb-8 pt-4 px-6 flex flex-col items-center gap-6 bg-gradient-to-t from-bg via-bg to-transparent shrink-0 z-20">

                {/* Page Indicators */}
                <div className="flex gap-2">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-earth-primary' : 'w-1.5 bg-gray-300'
                                }`}
                        />
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div className="w-full max-w-xs flex items-center justify-center gap-2">
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="h-14 w-10 rounded-2xl border border-earth-primary/40 bg-white/80 text-earth-primary shadow-sm hover:bg-white hover:border-earth-primary transition-colors flex items-center justify-center"
                        >
                            <ArrowLeft size={18} strokeWidth={2.25} />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleNext}
                        className="h-14 px-6 rounded-2xl bg-earth-primary text-white font-bold text-lg flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex-1"
                    >
                        <span className="drop-shadow-sm">{step === steps.length - 1 ? 'Empezar' : 'Siguiente'}</span>
                        <ArrowRight size={24} className="drop-shadow-sm" strokeWidth={2.5} />
                    </button>
                </div>

                <p className="text-[13px] text-text-secondary font-medium animate-pulse">
                    Toma 1 minuto. Te prometo que valdrá la pena 😉
                </p>
            </div>

        </div>
    );
};

export default Onboarding;
