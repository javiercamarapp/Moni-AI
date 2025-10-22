import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useNetWorth } from "@/hooks/useNetWorth";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1'];

export default function AspirationsAnalysis() {
  const navigate = useNavigate();
  const [aspirations, setAspirations] = useState<any[]>([]);
  const [totalAspiration, setTotalAspiration] = useState(0);
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
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
  }, []);

  useEffect(() => {
    // Generar análisis cuando tengamos todos los datos
    if (aspirations.length > 0 && totalAspiration > 0 && !isLoadingAnalysis && !analysis && currentNetWorth >= 0) {
      generateAnalysis(aspirations, totalAspiration);
    }
  }, [aspirations, totalAspiration, currentNetWorth, isLoadingAnalysis, analysis]);

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

  const generateAnalysis = async (aspirationsData: any[], total: number) => {
    setIsLoadingAnalysis(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Generating analysis with:", { aspirationsData, total, currentNetWorth });

      const response = await supabase.functions.invoke("analyze-aspirations", {
        body: {
          aspirations: aspirationsData,
          totalAspiration: total,
          currentNetWorth: currentNetWorth
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
    <div className="min-h-screen animated-wave-bg pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Análisis de Aspiraciones</h1>
        </div>

        {/* Net Worth Comparison Card */}
        <Card className="p-6 mb-4 bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl border-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-500/10 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Tu Meta Financiera</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[15px] p-4 border border-blue-200">
              <p className="text-xs text-muted-foreground mb-1">Net Worth Actual</p>
              <p className="text-xl font-bold text-foreground">
                ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-[15px] p-4 border border-purple-200">
              <p className="text-xs text-muted-foreground mb-1">Meta Aspiracional</p>
              <p className="text-xl font-bold text-purple-600">
                ${totalAspiration.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-[15px] p-4 border border-orange-200">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-muted-foreground">Brecha a cerrar</p>
              <p className="text-xs font-semibold text-orange-600">{gapPercentage}%</p>
            </div>
            <p className="text-lg font-bold text-orange-600">
              ${gap.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6 mb-4 bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl border-0">
          <h3 className="text-base font-bold text-foreground mb-4">Desglose de Aspiraciones</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-MX')}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* AI Analysis */}
        <Card className="p-6 mb-4 bg-white/95 backdrop-blur-sm rounded-[20px] shadow-xl border-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-purple-500/10 p-2 rounded-full">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-base font-bold text-foreground">Análisis e Insights</h3>
          </div>
          
          {isLoadingAnalysis ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
              {analysis}
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
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="w-full h-12 text-foreground/60 hover:text-foreground hover:bg-white/50 rounded-[20px]"
          >
            Ir al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
