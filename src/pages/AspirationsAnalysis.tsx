import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Sparkles, Award, Trophy, Star, Target, Zap, Crown, Shield, Gem, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { useNetWorth } from "@/hooks/useNetWorth";
import { motion, AnimatePresence } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1'];

export default function AspirationsAnalysis() {
  const navigate = useNavigate();
  const [aspirations, setAspirations] = useState<any[]>([]);
  const [totalAspiration, setTotalAspiration] = useState(0);
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [expandedBadge, setExpandedBadge] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number>(40);
  const netWorthData = useNetWorth("1Y");
  const currentNetWorth = netWorthData.data?.currentNetWorth || 0;

  const aspirationLabels: Record<number, string> = {
    1: "Casa principal",
    2: "Coche de tus sueños",
    3: "Ahorros disponibles",
    4: "Inversiones en bolsa",
    7: "Coche cónyuge",
    8: "Segunda propiedad",
    9: "Propiedades de inversión",
    10: "Terrenos",
    11: "Fondo de emergencia",
    12: "Criptomonedas",
    13: "AFORE/Retiro",
    14: "Empresas/Startups",
    15: "Vehículos extras"
  };

  useEffect(() => {
    fetchAspirations();
    fetchAssetsAndLiabilities();
    fetchUserScore();
  }, []);

  useEffect(() => {
    // Generar análisis cuando tengamos todos los datos, incluyendo el net worth cargado
    if (
      aspirations.length > 0 && 
      totalAspiration > 0 && 
      !isLoadingAnalysis && 
      !analysis && 
      !netWorthData.isLoading &&
      netWorthData.data?.currentNetWorth !== undefined
    ) {
      generateAnalysis(aspirations, totalAspiration);
    }
  }, [aspirations, totalAspiration, netWorthData.isLoading, netWorthData.data?.currentNetWorth, isLoadingAnalysis, analysis]);

  const fetchAspirations = async () => {
    try {
      setIsLoadingData(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_aspirations")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setAspirations(data);
        const total = data.reduce((sum, asp) => sum + Number(asp.value), 0);
        setTotalAspiration(total);
      } else {
        toast.error("No se encontraron aspiraciones guardadas");
        navigate("/level-quiz");
      }
    } catch (error) {
      console.error("Error fetching aspirations:", error);
      toast.error("Error al cargar las aspiraciones");
      navigate("/level-quiz");
    } finally {
      setIsLoadingData(false);
    }
  };

  const cleanAnalysisText = (text: string) => {
    // Limpiar todos los símbolos de markdown y formateo
    return text
      .replace(/\*\*/g, '')        // Remove bold **
      .replace(/\*/g, '')          // Remove italic *
      .replace(/###/g, '')         // Remove heading ###
      .replace(/##/g, '')          // Remove heading ##
      .replace(/#/g, '')           // Remove heading #
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')  // Remove links [text](url)
      .replace(/`/g, '')           // Remove code ticks
      .replace(/~/g, '')           // Remove strikethrough
      .replace(/>/g, '')           // Remove blockquotes
      .replace(/\|/g, '')          // Remove table pipes
      .replace(/-{3,}/g, '')       // Remove horizontal rules
      .replace(/_{3,}/g, '')       // Remove horizontal rules
      .replace(/\(\)/g, '')        // Remove empty parentheses ()
      .replace(/\//g, '')          // Remove forward slashes /
      .replace(/\\/g, '')          // Remove backslashes \
      .trim();
  };

  const generateAnalysis = async (aspirationsData: any[], total: number) => {
    setIsLoadingAnalysis(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Generating analysis with:", { 
        aspirationsData, 
        total, 
        currentNetWorth,
        netWorthIsValid: currentNetWorth !== undefined && currentNetWorth !== null,
        netWorthFromHook: netWorthData.data?.currentNetWorth
      });

      // Usar el valor del hook directamente para asegurar que no sea 0
      const actualNetWorth = netWorthData.data?.currentNetWorth || 0;

      const response = await supabase.functions.invoke("analyze-aspirations", {
        body: {
          aspirations: aspirationsData,
          totalAspiration: total,
          currentNetWorth: actualNetWorth
        }
      });

      console.log("Analysis response:", response);

      if (response.error) {
        console.error("Analysis error:", response.error);
        throw response.error;
      }
      
      if (response.data?.analysis) {
        setAnalysis(response.data.analysis);
      } else {
        throw new Error("No analysis returned from function");
      }
    } catch (error) {
      console.error("Error generating analysis:", error);
      setAnalysis("No pudimos generar el análisis en este momento. Sin embargo, puedes ver tu desglose de aspiraciones arriba. Tu net worth aspiracional es de $" + total.toLocaleString('es-MX') + " y tu net worth actual es de $" + currentNetWorth.toLocaleString('es-MX') + ". La brecha a cerrar es de $" + (total - currentNetWorth).toLocaleString('es-MX') + ".");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const fetchAssetsAndLiabilities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assetsData } = await supabase
        .from("assets")
        .select("*")
        .eq("user_id", user.id);

      const { data: liabilitiesData } = await supabase
        .from("liabilities")
        .select("*")
        .eq("user_id", user.id);

      setAssets(assetsData || []);
      setLiabilities(liabilitiesData || []);
    } catch (error) {
      console.error("Error fetching assets and liabilities:", error);
    }
  };

  const fetchUserScore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: scoreData } = await supabase
        .from("user_scores")
        .select("score_moni")
        .eq("user_id", user.id)
        .single();

      if (scoreData) {
        setUserScore(scoreData.score_moni);
      }
    } catch (error) {
      console.error("Error fetching user score:", error);
    }
  };

  // Obtener insignias desbloqueadas del sistema de Financial Journey
  const getUnlockedBadges = () => {
    const progress = (currentNetWorth / totalAspiration) * 100;
    const currentLevel = totalAspiration > 0 ? Math.floor((currentNetWorth / totalAspiration) * 10000) : 0;
    
    const badges = [];
    
    // Sistema de insignias del Financial Journey
    const badgeThresholds = [
      { 
        level: 250, 
        name: "Bronce 250", 
        icon: Medal, 
        color: "from-amber-700 to-amber-900", 
        description: "Primeros 250 puntos alcanzados",
        explanation: "Has dado tus primeros pasos en tu camino hacia la libertad financiera. Este es el comienzo de algo grande."
      },
      { 
        level: 500, 
        name: "Plata 500", 
        icon: Shield, 
        color: "from-gray-300 to-gray-500", 
        description: "500 puntos de progreso",
        explanation: "Tu compromiso con tus metas financieras está demostrando ser sólido. Sigue así y verás grandes resultados."
      },
      { 
        level: 750, 
        name: "Bronce 750", 
        icon: Medal, 
        color: "from-amber-600 to-amber-800", 
        description: "Nivel 750 desbloqueado",
        explanation: "Cada día estás más cerca de tu meta. La constancia es tu mejor aliada."
      },
      { 
        level: 1000, 
        name: "Oro 1000", 
        icon: Star, 
        color: "from-yellow-400 to-yellow-600", 
        description: "¡Nivel 1000 alcanzado!",
        explanation: "¡Felicidades! Has alcanzado el 10% de tu meta. Este es un logro significativo que demuestra tu disciplina financiera."
      },
      { 
        level: 1250, 
        name: "Bronce 1250", 
        icon: Medal, 
        color: "from-amber-700 to-amber-900", 
        description: "1250 puntos logrados",
        explanation: "Tu patrimonio crece constantemente. Cada peso invertido te acerca más a tus sueños."
      },
      { 
        level: 1500, 
        name: "Plata 1500", 
        icon: Shield, 
        color: "from-gray-300 to-gray-500", 
        description: "Nivel 1500 completado",
        explanation: "Has superado el 15% de tu objetivo. Tu estrategia financiera está funcionando."
      },
      { 
        level: 1750, 
        name: "Maestría Bronce 1750", 
        icon: Trophy, 
        color: "from-amber-700 to-orange-600", 
        description: "Maestría de nivel 1750",
        explanation: "Tu disciplina financiera te está llevando a niveles de maestría. Pocos llegan hasta aquí."
      },
      { 
        level: 2000, 
        name: "Oro 2000", 
        icon: Star, 
        color: "from-yellow-400 to-yellow-600", 
        description: "2000 puntos alcanzados",
        explanation: "¡20% de tu meta cumplida! Tu patrimonio está creciendo exponencialmente."
      },
      { 
        level: 2500, 
        name: "Plata 2500", 
        icon: Shield, 
        color: "from-gray-400 to-gray-600", 
        description: "Nivel 2500 desbloqueado",
        explanation: "Un cuarto del camino completado. Tu visión financiera se está materializando."
      },
      { 
        level: 3000, 
        name: "Oro 3000", 
        icon: Star, 
        color: "from-yellow-500 to-orange-500", 
        description: "3000 puntos de éxito",
        explanation: "30% alcanzado. Estás construyendo un futuro financiero sólido y duradero."
      },
      { 
        level: 3500, 
        name: "Platino 3500", 
        icon: Trophy, 
        color: "from-cyan-400 to-cyan-600", 
        description: "Nivel Platino alcanzado",
        explanation: "Has alcanzado el nivel Platino. Tu dedicación es admirable y tu futuro brillante."
      },
      { 
        level: 4000, 
        name: "Oro Premium 4000", 
        icon: Crown, 
        color: "from-yellow-500 to-yellow-600", 
        description: "4000 puntos premium",
        explanation: "¡40% de tu meta! Estás en el camino correcto hacia la independencia financiera."
      },
      { 
        level: 4500, 
        name: "Diamante 4500", 
        icon: Gem, 
        color: "from-blue-400 to-purple-600", 
        description: "Nivel Diamante desbloqueado",
        explanation: "Nivel Diamante alcanzado. Tu patrimonio brilla como una joya preciosa."
      },
      { 
        level: 5000, 
        name: "Platino 5000", 
        icon: Trophy, 
        color: "from-cyan-500 to-blue-600", 
        description: "5000 puntos élite",
        explanation: "¡Mitad del camino! Tu perseverancia está dando frutos abundantes."
      },
      { 
        level: 6000, 
        name: "Rubí 6000", 
        icon: Gem, 
        color: "from-red-500 to-pink-600", 
        description: "Nivel Rubí alcanzado",
        explanation: "60% completado. Tu éxito financiero es inevitable con esta dedicación."
      },
      { 
        level: 7000, 
        name: "Zafiro 7000", 
        icon: Gem, 
        color: "from-blue-500 to-indigo-600", 
        description: "Nivel Zafiro desbloqueado",
        explanation: "Nivel Zafiro. Estás en territorio de élite financiera."
      },
      { 
        level: 8000, 
        name: "Esmeralda 8000", 
        icon: Gem, 
        color: "from-green-500 to-emerald-600", 
        description: "Nivel Esmeralda logrado",
        explanation: "80% alcanzado. La libertad financiera está cada vez más cerca."
      },
      { 
        level: 9000, 
        name: "Corona Real 9000", 
        icon: Crown, 
        color: "from-yellow-600 to-purple-600", 
        description: "Corona Real alcanzada",
        explanation: "¡90%! Eres parte de la élite financiera. Tu legado está asegurado."
      },
      { 
        level: 9500, 
        name: "Élite Supremo 9500", 
        icon: Crown, 
        color: "from-purple-600 to-pink-600", 
        description: "Élite Supremo",
        explanation: "95% completado. Estás a un paso de alcanzar la cima."
      },
      { 
        level: 10000, 
        name: "Libertad Financiera", 
        icon: Crown, 
        color: "from-yellow-400 via-pink-500 to-purple-600", 
        description: "¡Meta alcanzada!",
        explanation: "¡LO LOGRASTE! Has alcanzado tu meta financiera. Tu libertad financiera es ahora una realidad."
      }
    ];
    
    // Agregar todas las insignias desbloqueadas con su porcentaje de crecimiento
    badgeThresholds.forEach(badge => {
      if (currentLevel >= badge.level) {
        const growthPercentage = totalAspiration > 0 ? ((badge.level / 10000) * 100).toFixed(1) : "0";
        badges.push({
          ...badge,
          earned: true,
          growthPercentage
        });
      }
    });
    
    // Invertir el orden para que la última desbloqueada aparezca primero
    return badges.reverse();
  };

  const badges = getUnlockedBadges();

  // Mapear y comparar categorías
  const getComparativeData = () => {
    const categoryMapping: Record<string, { aspirationIds: number[], assetCategories: string[], liabilityCategories: string[] }> = {
      "Propiedades": {
        aspirationIds: [1, 8, 9, 10],
        assetCategories: ["Propiedad", "Inmuebles", "Casa", "Terreno"],
        liabilityCategories: ["Hipoteca", "Crédito Hipotecario"]
      },
      "Vehículos": {
        aspirationIds: [2, 7, 15],
        assetCategories: ["Vehículo", "Auto", "Coche"],
        liabilityCategories: ["Crédito Automotriz"]
      },
      "Ahorros": {
        aspirationIds: [3, 11],
        assetCategories: ["Cuenta de Ahorros", "Cuenta Bancaria", "Efectivo"],
        liabilityCategories: []
      },
      "Inversiones": {
        aspirationIds: [4, 12, 13, 14],
        assetCategories: ["Inversiones", "Acciones", "Fondos", "Criptomonedas", "AFORE", "Negocio"],
        liabilityCategories: []
      }
    };

    return Object.entries(categoryMapping).map(([category, mapping]) => {
      // Calcular aspiración
      const aspirationValue = aspirations
        .filter(asp => mapping.aspirationIds.includes(asp.question_id))
        .reduce((sum, asp) => sum + Number(asp.value), 0);

      // Calcular activos
      const assetsValue = assets
        .filter(asset => mapping.assetCategories.some(cat => 
          asset.category.toLowerCase().includes(cat.toLowerCase()) ||
          asset.name.toLowerCase().includes(cat.toLowerCase())
        ))
        .reduce((sum, asset) => sum + Number(asset.value), 0);

      // Calcular pasivos
      const liabilitiesValue = liabilities
        .filter(liability => mapping.liabilityCategories.some(cat =>
          liability.category.toLowerCase().includes(cat.toLowerCase()) ||
          liability.name.toLowerCase().includes(cat.toLowerCase())
        ))
        .reduce((sum, liability) => sum + Number(liability.value), 0);

      // Net worth neto (activos - pasivos)
      const currentNet = assetsValue - liabilitiesValue;
      const gap = aspirationValue - currentNet;

      return {
        category,
        current: currentNet,
        aspiration: aspirationValue,
        gap: gap,
        gapPercentage: aspirationValue > 0 ? ((gap / aspirationValue) * 100).toFixed(0) : 0
      };
    }).filter(item => item.aspiration > 0 || item.current > 0);
  };

  const comparativeData = getComparativeData();

  const chartData = aspirations
    .filter(asp => asp.value > 0)
    .map(asp => ({
      name: aspirationLabels[asp.question_id] || `Aspiración ${asp.question_id}`,
      value: Number(asp.value)
    }))
    .sort((a, b) => b.value - a.value);

  const gap = totalAspiration - currentNetWorth;
  const gapPercentage = currentNetWorth > 0 ? ((gap / totalAspiration) * 100).toFixed(1) : 100;

  if (isLoadingData || netWorthData.isLoading) {
    return (
      <div className="min-h-screen animated-wave-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-foreground">Cargando tu análisis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-wave-bg pb-4">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="bg-white rounded-full shadow-xl hover:bg-white/90 text-foreground h-12 w-12 hover:scale-105 transition-all border border-blue-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Análisis de Aspiraciones</h1>
        </div>

        {/* Net Worth Comparison Card */}
        <Card className="p-3 mb-4 bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl border-0">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="bg-blue-500/10 p-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <h2 className="text-xs font-bold text-foreground">Tu Meta Financiera</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[10px] p-2 border border-blue-200">
              <p className="text-[9px] text-muted-foreground mb-0.5">Net Worth Actual</p>
              <p className="text-sm font-bold text-foreground">
                ${currentNetWorth >= 1000000 
                  ? `${(currentNetWorth / 1000000).toFixed(1)}M` 
                  : currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                }
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-[10px] p-2 border border-purple-200">
              <p className="text-[9px] text-muted-foreground mb-0.5">Meta Aspiracional</p>
              <p className="text-sm font-bold text-purple-600">
                ${totalAspiration >= 1000000 
                  ? `${(totalAspiration / 1000000).toFixed(1)}M` 
                  : totalAspiration.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                }
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-[10px] p-2 border border-orange-200">
            <div className="flex justify-between items-center mb-0.5">
              <p className="text-[9px] text-muted-foreground">Brecha a cerrar</p>
              <p className="text-[9px] font-semibold text-orange-600">{gapPercentage}%</p>
            </div>
            <p className="text-xs font-bold text-orange-600">
              ${gap >= 1000000 
                ? `${(gap / 1000000).toFixed(1)}M` 
                : gap.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
              }
            </p>
          </div>
        </Card>

        {/* Bar Chart */}
        <Card className="p-6 mb-4 bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl border-0">
          <h3 className="text-base font-bold text-foreground mb-4">Desglose de Aspiraciones</h3>
          
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="horizontal"
                margin={{ top: 5, right: 20, left: 20, bottom: 55 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="category" 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={75}
                  tick={{ fontSize: 10 }}
                  interval={0}
                />
                <YAxis 
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => 
                    value >= 1000000 
                      ? `${(value / 1000000).toFixed(1)}M` 
                      : value >= 1000 
                        ? `${(value / 1000).toFixed(0)}k`
                        : value.toString()
                  }
                />
                <Tooltip 
                  formatter={(value: number) => 
                    value >= 1000000 
                      ? `$${(value / 1000000).toFixed(1)}M` 
                      : `$${value.toLocaleString('es-MX')}`
                  }
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tabla Comparativa */}
        <Card className="p-4 sm:p-6 mb-4 bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl border-0">
          <h3 className="text-sm sm:text-base font-bold text-foreground mb-3 sm:mb-4">Comparativa Actual vs Aspiracional</h3>
          
          {/* Vista Móvil - Cards */}
          <div className="block sm:hidden space-y-1.5">
            {comparativeData.map((item, index) => (
              <motion.div 
                key={index} 
                className="bg-white/90 backdrop-blur-sm rounded-[12px] p-2 shadow-md border border-blue-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {/* Título con barra de progreso */}
                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className="font-bold text-foreground text-[10px] whitespace-nowrap">{item.category}</h4>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full relative overflow-hidden"
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.min(100 - parseFloat(String(item.gapPercentage)), 100)}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 1, ease: "easeOut" }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ 
                          delay: index * 0.1 + 0.2,
                          duration: 1.2, 
                          ease: "easeInOut",
                          repeat: 0
                        }}
                      />
                    </motion.div>
                  </div>
                  <motion.span 
                    className="text-[7px] font-semibold text-emerald-600 whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.8, duration: 0.3 }}
                  >
                    {Math.min(100 - parseFloat(String(item.gapPercentage)), 100).toFixed(0)}%
                  </motion.span>
                </div>
                
                <div className="grid grid-cols-3 gap-1 text-[9px]">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-[6px] p-1">
                    <p className="text-muted-foreground mb-0.5 text-[8px]">Actual</p>
                    <p className="font-bold text-blue-600 leading-tight text-[9px]">
                      ${item.current >= 1000000 
                        ? `${(item.current / 1000000).toFixed(1)}M` 
                        : item.current >= 1000
                          ? `${(item.current / 1000).toFixed(0)}k`
                          : item.current.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      }
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-[6px] p-1">
                    <p className="text-muted-foreground mb-0.5 text-[8px]">Meta</p>
                    <p className="font-bold text-purple-600 leading-tight text-[9px]">
                      ${item.aspiration >= 1000000 
                        ? `${(item.aspiration / 1000000).toFixed(1)}M` 
                        : item.aspiration >= 1000
                          ? `${(item.aspiration / 1000).toFixed(0)}k`
                          : item.aspiration.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      }
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-[6px] p-1">
                    <p className="text-muted-foreground mb-0.5 text-[8px]">Brecha</p>
                    <p className="font-bold text-orange-600 leading-tight text-[9px]">
                      ${item.gap >= 1000000 
                        ? `${(item.gap / 1000000).toFixed(1)}M` 
                        : item.gap >= 1000
                          ? `${(item.gap / 1000).toFixed(0)}k`
                          : item.gap.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Total Card */}
            <motion.div 
              className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-[12px] p-2 shadow-lg border-2 border-slate-300"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: comparativeData.length * 0.1 + 0.2, duration: 0.4 }}
            >
              <h4 className="font-bold text-foreground mb-1 text-[10px]">TOTAL</h4>
              <div className="grid grid-cols-3 gap-1 text-[9px]">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-[6px] p-1">
                  <p className="text-muted-foreground mb-0.5 text-[8px]">Actual</p>
                  <p className="font-bold text-blue-700 leading-tight text-[9px]">
                    ${currentNetWorth >= 1000000 
                      ? `${(currentNetWorth / 1000000).toFixed(1)}M` 
                      : currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    }
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-[6px] p-1">
                  <p className="text-muted-foreground mb-0.5 text-[8px]">Meta</p>
                  <p className="font-bold text-purple-700 leading-tight text-[9px]">
                    ${totalAspiration >= 1000000 
                      ? `${(totalAspiration / 1000000).toFixed(1)}M` 
                      : totalAspiration.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    }
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-[6px] p-1">
                  <p className="text-muted-foreground mb-0.5 text-[8px]">Brecha</p>
                  <p className="font-bold text-orange-700 leading-tight text-[9px]">
                    ${gap >= 1000000 
                      ? `${(gap / 1000000).toFixed(1)}M` 
                      : gap.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    }
                  </p>
                  </div>
                </div>
              </motion.div>
          </div>

          {/* Vista Desktop - Tabla */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Categoría</th>
                  <th className="text-right py-3 px-2 font-semibold text-blue-600">Actual</th>
                  <th className="text-right py-3 px-2 font-semibold text-purple-600">Meta</th>
                  <th className="text-right py-3 px-2 font-semibold text-orange-600">Brecha</th>
                </tr>
              </thead>
              <tbody>
                {comparativeData.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-2 font-medium text-foreground">{item.category}</td>
                    <td className="py-3 px-2 text-right text-blue-600 font-semibold">
                      ${item.current >= 1000000 
                        ? `${(item.current / 1000000).toFixed(1)}M` 
                        : item.current.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      }
                    </td>
                    <td className="py-3 px-2 text-right text-purple-600 font-semibold">
                      ${item.aspiration >= 1000000 
                        ? `${(item.aspiration / 1000000).toFixed(1)}M` 
                        : item.aspiration.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                      }
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-orange-600 font-bold">
                          ${item.gap >= 1000000 
                            ? `${(item.gap / 1000000).toFixed(1)}M` 
                            : item.gap.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                          }
                        </span>
                        <span className="text-xs text-orange-500">
                          {item.gapPercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Total Row */}
                <tr className="bg-slate-50 font-bold">
                  <td className="py-3 px-2 text-foreground">TOTAL</td>
                  <td className="py-3 px-2 text-right text-blue-600">
                    ${currentNetWorth >= 1000000 
                      ? `${(currentNetWorth / 1000000).toFixed(1)}M` 
                      : currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    }
                  </td>
                  <td className="py-3 px-2 text-right text-purple-600">
                    ${totalAspiration >= 1000000 
                      ? `${(totalAspiration / 1000000).toFixed(1)}M` 
                      : totalAspiration.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    }
                  </td>
                  <td className="py-3 px-2 text-right text-orange-600">
                    ${gap >= 1000000 
                      ? `${(gap / 1000000).toFixed(1)}M` 
                      : gap.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-[10px] text-muted-foreground text-center">
              <span className="font-semibold">Nota:</span> Los valores actuales muestran el neto (activos - pasivos relacionados). Por ejemplo: Propiedades - Hipoteca = Equity en propiedades.
            </p>
          </div>

          {/* Gráfica de Barras Comparativa */}
          <div className="mt-4 sm:mt-6">
            <h4 className="text-xs sm:text-sm font-bold text-foreground mb-2 sm:mb-3">Visualización Comparativa</h4>
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={comparativeData} 
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 9 }}
                    tickFormatter={(value) => 
                      value >= 1000000 
                        ? `${(value / 1000000).toFixed(1)}M` 
                        : value >= 1000 
                          ? `${(value / 1000).toFixed(0)}k`
                          : value.toString()
                    }
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    width={60}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => 
                      value >= 1000000 
                        ? `$${(value / 1000000).toFixed(1)}M` 
                        : `$${value.toLocaleString('es-MX')}`
                    }
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px' }}
                    iconSize={8}
                  />
                  <Bar dataKey="current" fill="#3b82f6" name="Actual" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="aspiration" fill="#8b5cf6" name="Meta" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Badges and Score Section */}
        <Card className="p-2 mb-4 bg-white/95 backdrop-blur-sm rounded-[12px] shadow-xl border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-1 rounded-full">
                <Award className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-xs font-bold text-foreground">Tus Logros</h3>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[8px] text-muted-foreground">Score Moni</p>
              <div className="flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                <p className="text-sm font-bold text-foreground">{userScore}</p>
              </div>
            </div>
          </div>

          {/* Recuadro de información expandida (fuera del carrusel) */}
          <AnimatePresence>
            {expandedBadge !== null && badges[expandedBadge] && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] w-64"
              >
                <div className="bg-white rounded-lg shadow-2xl p-4 border-2 border-purple-300">
                  <p className="text-xs text-gray-800 leading-tight mb-3 font-medium">
                    {badges[expandedBadge].explanation}
                  </p>
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-2 rounded-md border border-purple-200">
                    <p className="text-xs text-gray-900 font-bold text-center">
                      🎯 {badges[expandedBadge].growthPercentage}% patrimonio deseado
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Badges Carousel */}
          {badges.length > 0 ? (
            <div className="relative">
              <Carousel className="w-full max-w-md mx-auto">
                <CarouselContent>
                  {badges.map((badge, index) => {
                    const IconComponent = badge.icon;
                    const isExpanded = expandedBadge === index;
                    return (
                      <CarouselItem key={index} className="basis-1/2 md:basis-1/3">
                        <div className="relative">
                          {/* Insignia */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setExpandedBadge(isExpanded ? null : index)}
                            className={`bg-gradient-to-br ${badge.color} rounded-[10px] p-2 flex flex-col items-center gap-1 shadow-lg relative overflow-hidden cursor-pointer transition-all ${
                              isExpanded ? 'scale-105 ring-2 ring-yellow-400' : ''
                            }`}
                          >
                            {/* Efecto de brillo de fondo */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                            
                            <div className="bg-white/30 p-1.5 rounded-full backdrop-blur-sm relative z-10 shadow-md">
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            
                            <div className="text-center relative z-10">
                              <p className="text-[9px] font-bold text-white leading-tight mb-0.5 drop-shadow-lg">
                                {badge.name}
                              </p>
                              <p className="text-[7px] text-white/90 leading-tight drop-shadow">
                                {badge.description}
                              </p>
                            </div>
                            <div className="bg-white/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm relative z-10">
                              <p className="text-[7px] text-white font-semibold">
                                {isExpanded ? '👆 VER ARRIBA' : '✓ DESBLOQUEADO'}
                              </p>
                            </div>
                          </motion.div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex h-6 w-6" />
                <CarouselNext className="hidden sm:flex h-6 w-6" />
              </Carousel>
            </div>
          ) : (
            <div className="text-center py-3">
              <Trophy className="h-6 w-6 text-muted-foreground mx-auto mb-1.5 opacity-50" />
              <p className="text-[9px] text-muted-foreground">
                Aún no has desbloqueado insignias.
              </p>
              <p className="text-[8px] text-muted-foreground mt-0.5">
                ¡Sigue avanzando para desbloquear tu primera insignia en el nivel 250!
              </p>
            </div>
          )}

          {/* Progress Info */}
          <div className="mt-2 pt-2 border-t border-slate-200">
            <p className="text-[8px] text-muted-foreground text-center">
              <span className="font-semibold">¡Sigue así!</span> Has desbloqueado {badges.length} insignia{badges.length !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>

        {/* AI Financial Analysis */}
        <Card className="p-6 mb-4 bg-gradient-to-br from-purple-50 via-blue-50 to-white backdrop-blur-sm rounded-[20px] shadow-xl border-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-full shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Análisis Financiero Integral</h3>
              <p className="text-xs text-foreground/60">Basado en tu historial completo</p>
            </div>
          </div>
          
          {isLoadingAnalysis ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
                <Sparkles className="h-5 w-5 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-foreground/60 animate-pulse">Analizando tu situación financiera completa...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/50 p-4 rounded-xl border border-purple-100">
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-line">
                  {cleanAnalysisText(analysis)}
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-foreground/50 pt-2 border-t border-purple-100">
                <Sparkles className="h-3 w-3" />
                <span>Análisis generado por IA con base en ingresos, gastos, activos, pasivos y metas</span>
              </div>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 px-2">
          <Button
            onClick={() => navigate("/financial-journey")}
            className="w-full bg-white/95 hover:bg-white text-foreground font-bold h-12 rounded-[20px] shadow-xl hover:scale-[1.02] transition-all border border-blue-100"
          >
            Ver Mi Camino Financiero
          </Button>
        </div>
      </div>
    </div>
  );
}
