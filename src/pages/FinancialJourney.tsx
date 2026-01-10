
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftIcon, StarIcon, CheckIcon,
  GraduationCapIcon, PiggyBankIcon, CreditCardIcon, TrendingUpIcon,
  HomeIcon, CalculatorIcon, UmbrellaIcon, DiamondIcon,
  ChartIcon, LockIcon, CarIcon, LeafIcon,
  WalletIcon, ClockIcon, SparklesIcon, TargetIcon,
  PlusIcon, MicIcon, WaveformIcon, SendIcon,
  CameraIcon, ImageIcon, TelescopeIcon, GlobeIcon, BookIcon, PaperclipIcon, ChestIcon, ShieldIcon, DumbbellIcon,
  RocketIcon, BuildingIcon, LightbulbIcon, CompassIcon, TrophyIcon
} from '@/components/journey/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Waves } from "@/components/ui/waves-background";
import ShaderBackground from '@/components/ui/shader-background';
import LevelUpCelebration from '@/components/journey/LevelUpCelebration';
import { useNetWorth } from "@/hooks/useNetWorth"; // Integration with real data
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import BottomNav from '@/components/BottomNav';

// Icon set to cycle through
const ICONS = [
  GraduationCapIcon, PiggyBankIcon, CreditCardIcon, TrendingUpIcon,
  HomeIcon, CalculatorIcon, UmbrellaIcon, DiamondIcon
];

const TOTAL_LEVELS = 200;
const SPACING = 120;
const TARGET_BALANCE = 122000000; // $122M Goal
const START_OFFSET_Y = 280; // Start below the fixed header

// Adjusted for mobile safety (keeps nodes fully on screen for 320px+ devices)
const BOUNDARY_LIMIT = 85;
const SAFE_CLAMP = 100;

// Snake Layout Configuration
const COLS = 5;
const BASE_COL_SPACING = 180; // Used for large screens
const BASE_ROW_SPACING = 180;

// Generate positions with a "Snake" grid layout with downward tilt
const generateStaticPositions = (containerWidth: number) => {
  // Calculate responsive column spacing
  // On mobile (< 640px), fit all 5 columns with safe margins
  // Use 80% of container width to leave margins
  const availableWidth = containerWidth * 0.8;
  const maxColumnWidth = availableWidth / COLS;
  const colSpacing = Math.min(BASE_COL_SPACING, maxColumnWidth);

  let accumulatedY = 200; // Start with initial padding

  return Array.from({ length: TOTAL_LEVELS }, (_, i) => {
    const row = Math.floor(i / COLS);
    const colRaw = i % COLS;

    // Even rows: Left -> Right (0, 1, 2, 3, 4)
    // Odd rows: Right -> Left (4, 3, 2, 1, 0)
    const col = (row % 2 === 0) ? colRaw : (COLS - 1) - colRaw;

    // Centering: Col 2 (middle of 5) is at X=0
    const x = (col - 2) * colSpacing;

    // Calculate Y position - always increase from previous
    if (i === 0) {
      // First node at starting position
      accumulatedY = 200;
    } else {
      // Add spacing to always go down
      const prevColRaw = (i - 1) % COLS;
      const prevRow = Math.floor((i - 1) / COLS);
      const prevCol = (prevRow % 2 === 0) ? prevColRaw : (COLS - 1) - prevColRaw;

      // Determine if this is a row change
      const isRowChange = row !== prevRow;

      if (isRowChange) {
        // Moving to new row - add vertical spacing
        accumulatedY += 120; // Base vertical spacing for row change
      } else {
        // Same row - add horizontal tilt
        accumulatedY += 30; // Downward tilt per horizontal step
      }
    }

    return {
      index: i,
      id: i + 1,
      xOffset: x,
      yOffset: accumulatedY,
      icon: ICONS[i % ICONS.length]
    };
  });
};

// STATIC_POSITIONS is now calculated dynamically in the component based on containerWidth



const formatCurrencyCompact = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
};

const getLevelData = (level: number) => {
  const target = (level / TOTAL_LEVELS) * TARGET_BALANCE;
  let title = "Hito Financiero";
  let description = "Sigue construyendo tu patrimonio.";

  if (level === 1) {
    title = "El Comienzo";
    description = "Tu primer paso hacia la libertad.";
  } else if (level === 42) {
    title = "Punto Actual";
    description = "¡Estás aquí! Continúa avanzando.";
  } else if (level === 50) {
    title = "Base Sólida";
    description = "Tus cimientos financieros están listos.";
  } else if (level === 100) {
    title = "Medio Camino";
    description = "Has recorrido la mitad del viaje.";
  } else if (level === 150) {
    title = "Aceleración";
    description = "El interés compuesto está trabajando.";
  } else if (level === 200) {
    title = "Libertad Total";
    description = "Objetivo final alcanzado.";
  }

  return { title, description, target };
};

const PortalTooltip = ({
  rect: initialRect,
  levelId,
  isLocked,
  element
}: {
  rect: DOMRect,
  levelId: number,
  isLocked: boolean,
  element: HTMLElement
}) => {
  const levelData = getLevelData(levelId);
  // Recalculate rect to get fresh position
  const rect = element.getBoundingClientRect();
  const isNearTop = rect.top < 150;

  // Calculate centered position
  const tooltipWidth = 208; // w-52 = 13rem = 208px
  const badgeCenterX = rect.left + (rect.width / 2);
  const tooltipLeft = badgeCenterX - (tooltipWidth / 2);

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: isNearTop ? -10 : 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isNearTop ? -5 : 5, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "fixed z-[9999] w-52 bg-white p-4 rounded-xl shadow-2xl border text-center pointer-events-none",
        isLocked ? "border-stone-200" : "border-coffee-200"
      )}
      style={{
        top: isNearTop
          ? rect.bottom + 15
          : rect.top - 120,
        left: tooltipLeft,
      }}
    >
      <div
        className={cn(
          "absolute w-4 h-4 bg-white rotate-45 left-1/2 -translate-x-1/2",
          isNearTop ? "-top-2 border-t border-l" : "-bottom-2 border-b border-r",
          isLocked ? "border-stone-200" : "border-coffee-200"
        )}
      ></div>

      <div className={cn(
        "text-[10px] font-black uppercase tracking-widest mb-1",
        isLocked ? "text-stone-400" : "text-coffee-400"
      )}>
        {isLocked ? `Futuro: Nivel ${levelId}` : `Nivel ${levelId}`}
      </div>
      <h4 className={cn("font-bold text-sm mb-1 leading-tight", isLocked ? "text-stone-600" : "text-coffee-900")}>
        {levelData.title}
      </h4>
      <p className={cn("text-[11px] leading-snug mb-2 font-medium", isLocked ? "text-stone-500" : "text-coffee-600")}>
        {levelData.description}
      </p>
      <div className={cn(
        "inline-block rounded-lg py-1 px-3 text-[11px] font-bold border",
        isLocked
          ? "bg-stone-50 text-stone-500 border-stone-100"
          : "bg-coffee-50 text-coffee-800 border-coffee-100"
      )}>
        Meta: {formatCurrencyCompact(levelData.target)}
      </div>
    </motion.div>,
    document.body
  );
};

// --- COMPOUND INTEREST CHART ---
const CompoundInterestChart = () => {
  const [scrubX, setScrubX] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const INITIAL_PRINCIPAL = 13500000;
  const MONTHLY_CONTRIBUTION = 175950;
  const YEARS = 25;
  // Adjusted coordinate space for better resolution
  const WIDTH = 100;
  const HEIGHT = 200;
  const PADDING_TOP = 20;
  const PADDING_BOTTOM = 20;
  const EFFECTIVE_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const scenarios = [
    { label: 'ETFs', rate: 0.12, color: '#78350f', tailColor: 'text-coffee-900' },
    { label: 'S&P 500', rate: 0.10, color: '#92400e', tailColor: 'text-coffee-800' },
    { label: 'Tu Estrategia', rate: 0.09, color: '#b45309', tailColor: 'text-coffee-700', isHighlight: true },
    { label: 'CETES', rate: 0.06, color: '#d97706', tailColor: 'text-coffee-600' },
    { label: 'Solo Ahorro', rate: 0.00, color: '#f59e0b', tailColor: 'text-coffee-500' },
  ];

  const calculateFV = (rate: number, years: number) => {
    const r = rate / 12;
    const n = years * 12;
    if (rate === 0) return INITIAL_PRINCIPAL + (MONTHLY_CONTRIBUTION * n);
    return (INITIAL_PRINCIPAL * Math.pow(1 + r, n)) + (MONTHLY_CONTRIBUTION * (Math.pow(1 + r, n) - 1) / r);
  };

  const { points, maxVal } = useMemo(() => {
    let max = 0;
    scenarios.forEach(s => {
      const val = calculateFV(s.rate, YEARS);
      if (val > max) max = val;
    });
    // Add small buffer
    max = max * 1.05;

    const pts: Record<string, { x: number, y: number, value: number }[]> = {};
    scenarios.forEach(s => {
      const linePoints = [];
      for (let t = 0; t <= YEARS; t++) {
        const balance = calculateFV(s.rate, t);
        const x = (t / YEARS) * WIDTH;
        // Map Y to the effective area, leaving padding
        const y = (HEIGHT - PADDING_BOTTOM) - ((balance / max) * EFFECTIVE_HEIGHT);
        linePoints.push({ x, y, value: balance });
      }
      pts[s.label] = linePoints;
    });
    return { points: pts, maxVal: max };
  }, []);

  const getPath = (label: string) => {
    const pts = points[label];
    return pts.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
  };

  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percentX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setScrubX(percentX);
  };

  const currentYear = scrubX !== null ? Math.round(scrubX * YEARS) : YEARS;
  const fNum = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(0)}M` : `$${(n / 1000).toFixed(0)}k`;

  // Generate Y-axis labels dynamically
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const val = maxVal * pct;
    return fNum(val);
  }).reverse();

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-coffee-700"><TrendingUpIcon /></div>
            <h3 className="font-bold text-sm text-coffee-900 leading-none">Cálculo de Interés</h3>
          </div>
          <p className="text-[10px] text-coffee-500">Proyección basada en tus $175,950/mes</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
        {scenarios.map(s => (
          <div key={s.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
            <span className={cn("text-[9px] font-semibold", s.tailColor)}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 h-[180px]">
        <div className="flex flex-col justify-between text-[8px] text-coffee-400 font-medium py-4 h-full w-8 text-right">
          {yLabels.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        <div
          ref={chartRef}
          className="relative flex-1 cursor-crosshair touch-none h-full"
          onTouchMove={handleTouch} onTouchStart={handleTouch} onTouchEnd={() => setScrubX(null)}
          onMouseMove={handleTouch} onMouseLeave={() => setScrubX(null)}
        >
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const y = (HEIGHT - PADDING_BOTTOM) - (pct * EFFECTIVE_HEIGHT);
              return (
                <line key={pct} x1="0" y1={y} x2="100" y2={y} stroke="#d4a574" strokeWidth="0.3" opacity="0.3" strokeDasharray="2 2" />
              );
            })}

            {scenarios.map((s, i) => (
              <motion.path key={s.label} d={getPath(s.label)} fill="none" stroke={s.color} strokeWidth={s.isHighlight ? "1.8" : "1"} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: i * 0.15, ease: "easeOut" }} />
            ))}
          </svg>
          <AnimatePresence>
            {(scrubX !== null) && (
              <div className="absolute inset-0 pointer-events-none">
                <motion.div className="absolute top-0 bottom-0 w-px bg-coffee-400/50 z-10" style={{ left: `${(scrubX) * 100}%` }} />
                <div className={cn("absolute z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-coffee-200 shadow-lg transition-all duration-75 min-w-[120px]", scrubX > 0.55 ? "right-[5%] left-auto" : "left-[5%] right-auto")} style={{ top: '10%' }}>
                  <div className="text-[10px] font-bold text-coffee-700 uppercase mb-2 border-b border-coffee-100 pb-1">Año {currentYear}</div>
                  <div className="space-y-1.5">
                    {[...scenarios].sort((a, b) => {
                      const valA = points[a.label]?.[currentYear]?.value || 0;
                      const valB = points[b.label]?.[currentYear]?.value || 0;
                      return valB - valA;
                    }).map(s => {
                      const val = points[s.label][currentYear]?.value || 0;
                      return (
                        <div key={s.label} className="flex items-center justify-between gap-3 text-[10px]">
                          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></div><span className="text-coffee-600 font-medium">{s.label}</span></div>
                          <span className="font-bold text-coffee-900 tabular-nums">{fNum(val)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {scenarios.map(s => {
                  const pt = points[s.label][currentYear];
                  if (!pt) return null;
                  return <motion.div key={s.label} className="absolute w-2.5 h-2.5 rounded-full border-2 border-white z-10 shadow-sm" style={{ backgroundColor: s.color, left: `${(currentYear / YEARS) * 100}%`, top: `${(pt.y / HEIGHT) * 100}%`, marginTop: -5, marginLeft: -5 }} />
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-coffee-400 font-medium ml-8">
        <span>Año 0</span><span>Año 5</span><span>Año 10</span><span>Año 15</span><span>Año 20</span><span>Año 25</span>
      </div>
    </div>
  );
};

// --- ANALYSIS VIEW ---
const AnalysisView = ({ onBack }: { onBack: () => void }) => {
  const data = [
    { id: 'properties', title: 'Propiedades', actual: 8000000, meta: 45000000, pct: 18, color: 'text-coffee-700', bg: 'bg-coffee-100', barColor: 'bg-coffee-600', icon: HomeIcon, growth: '+5.2%', projection: '$12.5M', insight: 'Tus bienes raíces son tu ancla. Considera diversificar en REITS.' },
    { id: 'vehicles', title: 'Vehículos', actual: 402000, meta: 5000000, pct: 8, color: 'text-stone-600', bg: 'bg-stone-100', barColor: 'bg-stone-500', icon: CarIcon, growth: '-12%', projection: '$320k', insight: 'Depreciación controlada. Mantén los gastos de mantenimiento bajos.' },
    { id: 'savings', title: 'Ahorros', actual: 500000, meta: 10000000, pct: 5, color: 'text-yellow-700', bg: 'bg-yellow-50', barColor: 'bg-yellow-500', icon: WalletIcon, growth: '+4.5%', projection: '$750k', insight: 'Tu fondo de paz mental. Maximiza rendimientos en cuentas de alta tasa.' },
    { id: 'investments', title: 'Inversiones', actual: 4600000, meta: 62000000, pct: 7, color: 'text-coffee-900', bg: 'bg-coffee-200', barColor: 'bg-coffee-800', icon: TrendingUpIcon, growth: '+10.8%', projection: '$12.2M', insight: 'Tu motor de riqueza. El interés compuesto es tu mejor aliado aquí.' },
  ];
  const breakdownData = [
    { label: 'Casa Principal', actual: 0, aspirational: 20000000, type: 'property', color: 'bg-coffee-600', textColor: 'text-coffee-700' },
    { label: 'Bolsa', actual: 4000000, aspirational: 18000000, type: 'investment', color: 'bg-coffee-900', textColor: 'text-coffee-900' },
    { label: 'Cripto', actual: 100000, aspirational: 15000000, type: 'investment', color: 'bg-coffee-800', textColor: 'text-coffee-800' },
    { label: 'Startups', actual: 500000, aspirational: 15000000, type: 'investment', color: 'bg-coffee-700', textColor: 'text-coffee-700' },
    { label: '2da Propiedad', actual: 0, aspirational: 10000000, type: 'property', color: 'bg-coffee-500', textColor: 'text-coffee-600' },
    { label: 'Terrenos', actual: 8000000, aspirational: 8000000, type: 'property', color: 'bg-coffee-400', textColor: 'text-coffee-500' },
    { label: 'Ahorros', actual: 200000, aspirational: 5000000, type: 'savings', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { label: 'Fondo Inv.', actual: 0, aspirational: 4000000, type: 'investment', color: 'bg-coffee-800', textColor: 'text-coffee-800' },
    { label: 'Emergencia', actual: 150000, aspirational: 2000000, type: 'savings', color: 'bg-yellow-400', textColor: 'text-yellow-600' },
    { label: 'Coche Sueños', actual: 0, aspirational: 2500000, type: 'vehicle', color: 'bg-stone-500', textColor: 'text-stone-600' },
    { label: 'AFORE', actual: 150000, aspirational: 1500000, type: 'savings', color: 'bg-yellow-300', textColor: 'text-yellow-600' },
    { label: 'Coche Cónyuge', actual: 350000, aspirational: 800000, type: 'vehicle', color: 'bg-stone-400', textColor: 'text-stone-500' },
    { label: 'Vehículos Extras', actual: 52000, aspirational: 500000, type: 'vehicle', color: 'bg-stone-300', textColor: 'text-stone-500' },
  ];
  const [filter, setFilter] = useState<'all' | 'property' | 'investment' | 'savings' | 'vehicle'>('all');
  const [showGapTooltip, setShowGapTooltip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof data[0] | null>(null);
  const filteredData = useMemo(() => filter === 'all' ? breakdownData : breakdownData.filter(item => item.type === filter), [filter]);
  const TOTAL_ACTUAL = 13500000;
  const TOTAL_META = 122000000;
  const TOTAL_PCT = (TOTAL_ACTUAL / TOTAL_META) * 100;
  const formatMoney = (val: number) => val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${(val / 1000).toFixed(0)}k`;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-coffee-50 to-white overflow-y-auto no-scrollbar relative max-w-5xl mx-auto w-full">
      <div className="absolute top-0 left-0 w-full z-50 px-5 py-5 flex items-center gap-3 pointer-events-none max-w-5xl mx-auto">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-700 pointer-events-auto">
          <ArrowLeftIcon />
        </button>
        <div className="flex flex-col pointer-events-auto">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Análisis de Aspiraciones</h1>
          <p className="text-xs text-gray-500 font-medium">Compara tu progreso financiero</p>
        </div>
      </div>
      <div className="px-5 pb-24 space-y-6 pt-24 animate-fade-in">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-4">
          <div className="relative w-72 h-72 flex items-center justify-center cursor-pointer group" onClick={() => setShowGapTooltip(!showGapTooltip)}>
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 256 256">
              <defs><linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8C6C62" /><stop offset="100%" stopColor="#C7B7A8" /></linearGradient></defs>
              <circle cx="128" cy="128" r="100" stroke="#DCC8B8" strokeWidth="18" fill="transparent" strokeLinecap="round" className="opacity-20" />
              <motion.circle cx="128" cy="128" r="100" stroke="url(#gaugeGradient)" strokeWidth="18" fill="transparent" strokeDasharray="628" strokeDashoffset="628" strokeLinecap="round" animate={{ strokeDashoffset: 628 - (628 * (TOTAL_PCT / 100)) }} transition={{ duration: 1.8, ease: "easeOut" }} style={{ filter: 'drop-shadow(0px 4px 6px rgba(140, 108, 98, 0.2))' }} />
              <circle cx="128" cy="128" r="80" stroke="#EBE2D9" strokeWidth="1" fill="transparent" strokeDasharray="4 4" opacity="0.5" />
            </svg>
            <AnimatePresence>
              {showGapTooltip && (
                <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.8, rotate: 10 }} className="absolute inset-0 z-20 flex items-center justify-center">
                  <div className="w-64 h-64 bg-coffee-900 backdrop-blur-xl rounded-full shadow-2xl border border-white/10 flex flex-col items-center justify-center text-center p-6 text-white overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                    <h4 className="text-[10px] font-black text-coffee-200 uppercase tracking-widest mb-3 z-10">Desglose de Meta</h4>
                    <div className="w-full space-y-2 z-10">
                      <div className="flex justify-between items-center border-b border-white/10 pb-1"><span className="text-xs text-coffee-100/70">Objetivo</span><span className="text-sm font-bold text-white">$122.0M</span></div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-1"><span className="text-xs text-coffee-100/70">Actual</span><span className="text-sm font-bold text-yellow-400">$13.5M</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-coffee-100/70">Faltante</span><span className="text-sm font-bold text-red-300">$108.5M</span></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="text-center z-10 flex flex-col items-center transition-opacity duration-300">
              <span className="text-[10px] font-bold text-coffee-400 uppercase tracking-widest block mb-1">Brecha Restante</span>
              <motion.h2 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black text-coffee-900 tracking-tighter">$108.5M</motion.h2>
              <span className="text-xs font-bold text-coffee-800 bg-coffee-200 px-3 py-1 rounded-full mt-2 inline-block shadow-sm border border-coffee-300/50">{TOTAL_PCT.toFixed(1)}% Alcanzado</span>
            </div>
          </div>
        </motion.div>

        {selectedCategory && createPortal(
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-coffee-100/90 backdrop-blur-3xl p-4" onClick={() => setSelectedCategory(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-coffee-200 border border-coffee-300/50 rounded-[2.5rem] p-6 w-full max-w-[340px] shadow-2xl relative text-coffee-900 text-center flex flex-col items-center -mt-8">
              <button onClick={() => setSelectedCategory(null)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-coffee-300/50 hover:bg-coffee-300 text-coffee-700 transition-colors">✕</button>
              <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mb-5", selectedCategory.bg, selectedCategory.color)}><selectedCategory.icon className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black mb-2 text-coffee-900">{selectedCategory.title}</h3>
              <p className="text-coffee-600 text-sm mb-8 font-medium italic opacity-80 leading-relaxed">"{selectedCategory.insight}"</p>
              <div className="w-full space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-coffee-300/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-coffee-400/30"><p className="text-[10px] text-coffee-600 uppercase tracking-wider mb-1">Crecimiento</p><p className={cn("text-xl font-bold", selectedCategory.growth.includes('+') ? 'text-green-600' : 'text-red-500')}>{selectedCategory.growth}</p></div>
                  <div className="bg-coffee-300/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-coffee-400/30"><p className="text-[10px] text-coffee-600 uppercase tracking-wider mb-1">Proyección 10A</p><p className="text-xl font-bold text-coffee-900">{selectedCategory.projection}</p></div>
                </div>
              </div>
            </motion.div>
          </motion.div>, document.body
        )}

        <div className="grid grid-cols-2 gap-4">
          {data.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i }} onClick={() => setSelectedCategory(item)} className="bg-white p-5 rounded-[2rem] shadow-sm border border-coffee-100 flex flex-col justify-between h-44 relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer active:scale-95 duration-200">
                <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110", item.barColor)}></div>
                <div className="flex justify-between items-start mb-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", item.bg, item.color)}><Icon className="w-6 h-6" /></div>
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-coffee-50" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      <motion.path className={item.color} strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: item.pct / 100 }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 + (i * 0.1) }} />
                    </svg>
                    <span className={cn("absolute text-[9px] font-black", item.color)}>{item.pct}%</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-coffee-900 mb-0.5">{item.title}</h3>
                  <div className="text-[10px] text-coffee-400 mb-1">Meta: {formatMoney(item.meta)}</div>
                  <div className="flex items-end justify-between"><span className="text-lg font-black text-coffee-800 tracking-tight">{formatMoney(item.actual)}</span></div>
                  <div className="h-2 w-full bg-coffee-50 rounded-full overflow-hidden mt-2"><motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 1.2, delay: 0.3 + (i * 0.1), ease: "easeOut" }} className={cn("h-full rounded-full", item.barColor)} /></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-coffee-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="font-bold text-coffee-900 text-lg">Desglose Detallado</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {([{ id: 'all', label: 'Todo' }, { id: 'investment', label: 'Inversiones' }, { id: 'property', label: 'Propiedades' }, { id: 'savings', label: 'Ahorro' }, { id: 'vehicle', label: 'Vehículos' }].map((tab) => (
                <button key={tab.id} onClick={() => setFilter(tab.id as any)} className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors", filter === tab.id ? "bg-coffee-900 text-white shadow-md" : "bg-coffee-50 text-coffee-500 hover:bg-coffee-100")}>{tab.label}</button>
              )))}
            </div>
          </div>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredData.map((item, idx) => {
                const percent = Math.min(100, (item.actual / item.aspirational) * 100);
                const isEmpty = item.actual === 0;
                return (
                  <motion.div layout key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="relative group">
                    <div className="flex justify-between items-end mb-1 z-10 relative">
                      <span className={cn("text-xs font-bold", item.textColor)}>{item.label}</span>
                      <div className="text-right"><span className="text-[10px] font-semibold text-coffee-400 mr-1">{formatMoney(item.actual)}</span><span className="text-[10px] text-coffee-300">/</span><span className={cn("text-xs font-black ml-1", item.textColor)}>{formatMoney(item.aspirational)}</span></div>
                    </div>
                    <div className="h-3 w-full bg-coffee-50 rounded-full overflow-hidden relative border border-coffee-50/50">
                      <motion.div layoutId={`bar-${item.label}`} initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={cn("h-full rounded-full shadow-sm relative", item.color, isEmpty ? 'w-0' : '')}><div className="absolute inset-0 bg-white/20"></div></motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="space-y-3 pt-6">
          {/* Header Card - Estilo Dashboard */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-coffee-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coffee-500 to-coffee-700 flex items-center justify-center shadow-md">
                <span className="text-xl">🎯</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-coffee-900">¡Excelente progreso!</h3>
                <p className="text-xs text-coffee-500">Tu camino hacia la libertad financiera</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-coffee-100">
              <p className="text-xs text-coffee-600 leading-relaxed">
                Meta: <span className="font-bold text-coffee-900">$122M</span> · Sin invertir: <span className="font-bold text-red-500">51.4 años</span> · El interés compuesto puede reducir esto drásticamente.
              </p>
            </div>
          </motion.div>

          {/* Stats Grid - Estilo Dashboard */}
          <div className="grid grid-cols-2 gap-2">
            <motion.div 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl p-3 shadow-sm border border-coffee-100 flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-coffee-100 flex items-center justify-center flex-shrink-0">
                <ClockIcon />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-medium text-coffee-500 uppercase block">Sin Invertir</span>
                <div className="text-base font-black text-coffee-800 leading-tight">51.4 <span className="text-[9px] font-medium text-coffee-500">años</span></div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-xl p-3 shadow-md flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <SparklesIcon />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-medium text-coffee-200 uppercase block">Con Estrategia</span>
                <div className="text-base font-black text-white leading-tight">15.0 <span className="text-[9px] font-medium text-coffee-200">años</span></div>
              </div>
            </motion.div>
          </div>

          {/* Chart Section - Fondo blanco */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.9 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-coffee-100"
          >
            <CompoundInterestChart />
          </motion.div>

          {/* Bottom CTA Card - Más compacto */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 1.0 }}
            className="bg-gradient-to-r from-coffee-100 to-coffee-50 rounded-xl p-3 border border-coffee-200/50 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-coffee-500 to-coffee-700 flex items-center justify-center shadow-sm">
                <span className="text-base">⏳</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-coffee-900">¡37.4 años menos!</div>
                <p className="text-[10px] text-coffee-600">El precio de la inacción es alto.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const FinancialJourney: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLevelRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentView, setCurrentView] = useState<'roadmap' | 'analysis'>('roadmap');
  const navigate = useNavigate();

  // State for Financial Progress
  const [currentBalance, setCurrentBalance] = useState(25620000);
  const netWorthData = useNetWorth("1Y");

  useEffect(() => {
    if (netWorthData.data?.currentNetWorth) {
      setCurrentBalance(netWorthData.data.currentNetWorth);
    }
  }, [netWorthData.data]);

  const [hoveredNode, setHoveredNode] = useState<{ id: number; rect: DOMRect; element: HTMLElement } | null>(null);

  // Derived State
  const progressPercent = Math.min(100, (currentBalance / TARGET_BALANCE) * 100);
  const currentLevel = Math.max(1, Math.floor((progressPercent / 100) * TOTAL_LEVELS));

  // Level Up Celebration State
  const prevLevelRef = useRef(currentLevel);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (currentLevel > prevLevelRef.current) {
      setShowCelebration(true);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState(0);

  // Calculate positions based on container width
  const STATIC_POSITIONS = useMemo(() => {
    return containerWidth > 0 ? generateStaticPositions(containerWidth) : [];
  }, [containerWidth]);

  // ResizeObserver Logic
  useEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.clientWidth);
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [currentView]);

  useEffect(() => {
    // Tutorial disabled - column doesn't exist in profiles table
    // To enable, add has_seen_journey_tutorial column to profiles
  }, []);

  const completeTutorial = async () => {
    // Tutorial completion disabled - column doesn't exist in profiles table
  };

  const handleNextTutorial = () => {
    if (tutorialStep >= 4) {
      setTutorialStep(0);
      completeTutorial();
    } else {
      setTutorialStep(prev => prev + 1);
    }
  };

  const handleSkipTutorial = () => {
    setTutorialStep(0);
    completeTutorial();
  };

  // Scroll to current level ALWAYS when entering roadmap view
  useEffect(() => {
    if (currentView !== 'roadmap') return;
    if (STATIC_POSITIONS.length === 0 || containerWidth === 0) return;
    
    // Use a longer delay to ensure everything is rendered
    const timer = setTimeout(() => {
      if (currentLevelRef.current) {
        currentLevelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentView, STATIC_POSITIONS.length, containerWidth]);

  // Fetch Net Worth Data
  const { data: allNetWorthData } = useNetWorth('All');
  const realNetWorth = allNetWorthData?.currentNetWorth || 0;
  const formattedNetWorth = formatCurrencyCompact(realNetWorth);

  // Memoized path calculation (Snake with Smooth Curves)
  const fullPathD = useMemo(() => {
    if (containerWidth === 0 || STATIC_POSITIONS.length === 0) return "";
    let d = '';
    const centerX = containerWidth / 2;

    // Calculate the actual column spacing being used (for responsive bow size)
    const availableWidth = containerWidth * 0.8;
    const maxColumnWidth = availableWidth / COLS;
    const colSpacing = Math.min(BASE_COL_SPACING, maxColumnWidth);
    // Scale bow size proportionally to column spacing (150px at 180px spacing)
    const bowSize = (colSpacing / BASE_COL_SPACING) * 150;

    STATIC_POSITIONS.forEach((pos, i) => {
      const x = centerX + pos.xOffset;
      const y = pos.yOffset;

      if (i === 0) {
        d = `M ${x} ${y}`;
      } else {
        const prevPos = STATIC_POSITIONS[i - 1];
        const prevX = centerX + prevPos.xOffset;
        const prevY = prevPos.yOffset;

        // Determine if vertical by checking row numbers (not Y offset, due to tilt)
        const currentRow = Math.floor(i / COLS);
        const prevRow = Math.floor((i - 1) / COLS);
        const isVertical = currentRow !== prevRow;

        if (isVertical) {
          // Wide, smooth U-turn curve with responsive size
          const bowDir = pos.xOffset > 0 ? 1 : -1;
          const cp1x = prevX + (bowSize * bowDir);
          const cp1y = prevY + 40;
          const cp2x = x + (bowSize * bowDir);
          const cp2y = y - 40;
          d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
        } else {
          // Straight line for horizontal segments (tilted rows create natural flow)
          d += ` L ${x} ${y}`;
        }
      }
    });
    return d;
  }, [containerWidth, STATIC_POSITIONS]);

  const progressPathD = useMemo(() => {
    if (currentLevel <= 1 || containerWidth === 0 || STATIC_POSITIONS.length === 0) return '';
    let d = '';
    const centerX = containerWidth / 2;
    const progressPositions = STATIC_POSITIONS.slice(0, currentLevel);

    // Calculate the actual column spacing being used (for responsive bow size)
    const availableWidth = containerWidth * 0.8;
    const maxColumnWidth = availableWidth / COLS;
    const colSpacing = Math.min(BASE_COL_SPACING, maxColumnWidth);
    // Scale bow size proportionally to column spacing
    const bowSize = (colSpacing / BASE_COL_SPACING) * 150;

    progressPositions.forEach((pos, i) => {
      const x = centerX + pos.xOffset;
      const y = pos.yOffset;

      if (i === 0) {
        d = `M ${x} ${y}`;
      } else {
        const prevPos = STATIC_POSITIONS[i - 1];
        const prevX = centerX + prevPos.xOffset;
        const prevY = prevPos.yOffset;

        const currentRow = Math.floor(i / COLS);
        const prevRow = Math.floor((i - 1) / COLS);
        const isVertical = currentRow !== prevRow;

        if (isVertical) {
          const bowDir = pos.xOffset > 0 ? 1 : -1;
          const cp1x = prevX + (bowSize * bowDir);
          const cp1y = prevY + 40;
          const cp2x = x + (bowSize * bowDir);
          const cp2y = y - 40;
          d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
        } else {
          d += ` L ${x} ${y}`;
        }
      }
    });
    return d;
  }, [currentLevel, containerWidth, STATIC_POSITIONS]);

  const totalHeight = (Math.ceil(STATIC_POSITIONS.length / COLS) * BASE_ROW_SPACING) + 400;
  const headerButtonsZIndex = tutorialStep === 4 ? 'z-[51]' : 'z-40';
  const progressCardZIndex = tutorialStep === 2 ? 'z-[51]' : 'z-40';
  const [zoomLevel, setZoomLevel] = useState(1);

  // Scroll container ref to attach scroll listener
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (hoveredNode) setHoveredNode(null);
  };

  const handleNodeMouseEnter = (levelId: number, element: HTMLElement) => {
    // Get fresh bounding rect to ensure accurate positioning
    const rect = element.getBoundingClientRect();
    setHoveredNode({ id: levelId, rect, element });
  };

  // Attach scroll listener to clear tooltip on scroll
  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [hoveredNode]);

  if (currentView === 'analysis') {
    return <AnalysisView onBack={() => setCurrentView('roadmap')} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#f5f0ee] to-[#fafaf9] font-sans text-coffee-900 overflow-hidden relative w-full">
      <div className="max-w-5xl mx-auto w-full h-full flex flex-col">

        <AnimatePresence>
          {hoveredNode && <PortalTooltip rect={hoveredNode.rect} levelId={hoveredNode.id} isLocked={hoveredNode.id > currentLevel} element={hoveredNode.element} />}
        </AnimatePresence>

        <AnimatePresence>
          {showCelebration && (
            <LevelUpCelebration
              level={currentLevel}
              onDismiss={() => setShowCelebration(false)}
            />
          )}
        </AnimatePresence>

        {/* Unified Header */}
        <header className="flex-none p-4 pt-6 pb-2 z-50 relative flex justify-between items-center bg-transparent pointer-events-none">

          {/* Left: Title (no back button) */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-coffee-900 tracking-tight leading-none">Tu Viaje</h1>
              <p className="text-xs text-coffee-600 font-medium">Libertad Financiera</p>
            </div>
          </div>

          {/* Right: Stats & Analysis */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={() => setCurrentView('analysis')} className={cn("h-10 px-3 bg-white/90 backdrop-blur rounded-2xl shadow-sm flex items-center gap-2 text-coffee-800 border border-coffee-100 hover:bg-coffee-50 active:scale-95 transition-all", tutorialStep === 4 ? "ring-4 ring-coffee-300 ring-opacity-20 z-[51]" : "")}>
              <ChartIcon className="w-5 h-5" />
              <span className="font-bold text-sm hidden sm:inline">Análisis</span>
            </button>

            <button onClick={() => navigate('/net-worth')} className="h-10 px-3 bg-white/90 backdrop-blur rounded-2xl shadow-sm flex items-center gap-2 text-coffee-800 border border-coffee-100 hover:bg-coffee-50 active:scale-95 transition-all">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <TrendingUpIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-coffee-400 uppercase tracking-wider leading-none">Patrimonio</span>
                <span className="text-sm font-black text-coffee-900 leading-none">{formattedNetWorth}</span>
              </div>
            </button>
          </div>
        </header>

        {/* Progress / Status Card - Floating below header */}
        <div className={cn("absolute top-[80px] left-0 w-full z-40 px-4 pointer-events-none max-w-5xl mx-auto inset-x-0 transition-opacity duration-300", progressCardZIndex)}>
          <div className="bg-white/95 backdrop-blur rounded-3xl p-4 shadow-xl border border-coffee-100 pointer-events-auto max-w-md mx-auto">
            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black tracking-widest text-coffee-400 uppercase">TU PROGRESO</span><span className="bg-coffee-50 text-coffee-600 text-[10px] font-bold px-2 py-1 rounded-md border border-coffee-100">Nivel {currentLevel}</span></div>
            <div className="flex justify-between items-end mb-2"><div className="flex flex-col"><span className="text-2xl font-black text-coffee-900 tracking-tight">{formatCurrencyCompact(currentBalance)}</span><span className="text-[10px] font-bold text-coffee-400">Saldo Actual</span></div><div className="flex flex-col items-end text-right"><span className="text-sm font-bold text-coffee-400">{formatCurrencyCompact(TARGET_BALANCE)}</span><span className="text-[9px] font-bold text-coffee-300 uppercase">Objetivo</span></div></div>
            <div className="relative h-2 bg-coffee-100 rounded-full overflow-hidden"><div className="absolute top-0 left-0 h-full bg-coffee-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div></div>
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 z-10 relative w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth">
          <div
            ref={containerRef}
            className="w-full relative mx-auto"
            style={{ height: totalHeight, minHeight: '100vh', maxWidth: '1000px' }}
          >
            {containerWidth > 0 && (
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ height: totalHeight }}>
                <path d={fullPathD} fill="none" stroke="#EBE2D9" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                <path d={fullPathD} fill="none" stroke="#FFF" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
                <path d={progressPathD} fill="none" stroke="#EAB308" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}

            {STATIC_POSITIONS.map((level) => {
              const isCompleted = level.id < currentLevel;
              const isCurrent = level.id === currentLevel;
              const isLocked = level.id > currentLevel;
              const Icon = level.icon;

              return (
                <div key={level.index} id={`level-${level.id}`} ref={isCurrent ? currentLevelRef : null} className={cn("absolute flex items-center justify-center transition-transform duration-300 z-10")} style={{ left: '50%', top: level.yOffset, marginLeft: level.xOffset, width: 80, height: 80, transform: `translate(-50%, -50%) scale(${hoveredNode?.id === level.id ? 1.1 : 1})` }}>
                  <div
                    className={cn("w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-b-2 active:border-b-0 active:translate-y-1 transition-all relative", isCompleted ? "bg-yellow-400 border-yellow-600 text-yellow-900" : isCurrent ? "bg-coffee-600 border-coffee-800 text-white animate-pulse-slow" : "bg-coffee-100 border-coffee-200 text-coffee-300")}
                    onMouseEnter={(e) => handleNodeMouseEnter(level.id, e.currentTarget)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={(e) => handleNodeMouseEnter(level.id, e.currentTarget)}
                  >
                    {isCurrent && (<div className="absolute inset-0 rounded-full border-4 border-coffee-300 opacity-50 animate-ping"></div>)}
                    {isLocked ? (
                      <LockIcon className="w-6 h-6 text-coffee-300" />
                    ) : (
                      <Icon className={cn("w-8 h-8", isCurrent ? "text-white" : isCompleted ? "text-coffee-600" : "text-gray-400")} />
                    )}
                    {isCompleted && (<div className="absolute -top-1 -right-1 text-yellow-500 drop-shadow-sm"><StarIcon className="w-4 h-4" /></div>)}
                  </div>

                  {isCurrent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-14 bg-white border-2 border-coffee-100 text-coffee-800 px-4 py-2 rounded-xl shadow-md whitespace-nowrap flex flex-col items-center z-50 pointer-events-none"
                    >
                      <span className="text-[10px] font-bold text-coffee-400 uppercase tracking-wider mb-0.5">Nivel {level.id}</span>
                      <span className="text-xs font-black text-coffee-900">{getLevelData(level.id).title}</span>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b-2 border-r-2 border-coffee-100 rotate-45"></div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default FinancialJourney;
