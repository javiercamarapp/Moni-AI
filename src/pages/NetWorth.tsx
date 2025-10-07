import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import BottomNav from "@/components/BottomNav";

interface NetWorthDataPoint {
  date: string;
  value: number;
  displayDate: string;
}

export default function NetWorth() {
  const navigate = useNavigate();
  const [netWorthData, setNetWorthData] = useState<NetWorthDataPoint[]>([]);
  const [currentNetWorth, setCurrentNetWorth] = useState(0);
  const [netWorthChange, setNetWorthChange] = useState(0);
  const [netWorthChangePercent, setNetWorthChangePercent] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'All'>('1M');
  const [highValue, setHighValue] = useState(0);
  const [lowValue, setLowValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetWorthData();
  }, [selectedPeriod]);

  const fetchNetWorthData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calcular fecha de inicio según el período seleccionado
      const now = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '1M':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6M':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'All':
          startDate.setFullYear(2020, 0, 1); // Desde 2020
          break;
      }

      // Obtener todas las transacciones desde la fecha de inicio
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      if (error) throw error;

      // Calcular Net Worth acumulativo por día
      const netWorthMap = new Map<string, number>();
      let runningTotal = 0;

      // Ordenar transacciones por fecha
      const sortedTransactions = (transactions || []).sort((a, b) => 
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      );

      sortedTransactions.forEach(transaction => {
        const dateKey = transaction.transaction_date;
        const amount = Number(transaction.amount);
        
        if (transaction.type === 'ingreso') {
          runningTotal += amount;
        } else {
          runningTotal -= amount;
        }
        
        netWorthMap.set(dateKey, runningTotal);
      });

      // Convertir a array de datos para la gráfica
      const dataPoints: NetWorthDataPoint[] = [];
      const dates = Array.from(netWorthMap.keys()).sort();
      
      dates.forEach(date => {
        const value = netWorthMap.get(date) || 0;
        dataPoints.push({
          date,
          value,
          displayDate: new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
        });
      });

      // Si no hay datos, agregar un punto inicial
      if (dataPoints.length === 0) {
        dataPoints.push({
          date: now.toISOString().split('T')[0],
          value: 0,
          displayDate: now.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
        });
      }

      setNetWorthData(dataPoints);

      // Calcular valores actuales
      const current = dataPoints[dataPoints.length - 1]?.value || 0;
      const previous = dataPoints[0]?.value || 0;
      const change = current - previous;
      const changePercent = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;

      setCurrentNetWorth(current);
      setNetWorthChange(change);
      setNetWorthChangePercent(changePercent);

      // Calcular high y low
      const values = dataPoints.map(d => d.value);
      setHighValue(Math.max(...values));
      setLowValue(Math.min(...values));

    } catch (error) {
      console.error('Error fetching net worth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white text-sm font-semibold">
            ${payload[0].value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-white/70 text-xs">{payload[0].payload.displayDate}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(220,45%,18%)] to-[hsl(240,40%,12%)] p-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">Net Worth</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchNetWorthData}
            className="text-white hover:bg-white/10"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Current Net Worth */}
        <div className="text-center mb-2">
          <h2 className="text-4xl font-black text-white mb-2">
            ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h2>
          <div className="flex items-center justify-center gap-2">
            {netWorthChange >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-semibold ${netWorthChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${Math.abs(netWorthChange).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({netWorthChangePercent >= 0 ? '+' : ''}{netWorthChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="px-4 -mt-6">
        <Card className="p-4 bg-gradient-to-br from-[hsl(220,45%,18%)] to-[hsl(240,40%,12%)] border-2 border-white/10 shadow-2xl">
          {/* High/Low Labels */}
          <div className="flex justify-between mb-2 text-xs">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white/70">high: </span>
              <span className="text-white font-semibold">${highValue.toLocaleString('es-MX')}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white/70">low: </span>
              <span className="text-white font-semibold">${lowValue.toLocaleString('es-MX')}</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#ffffff40"
                  tick={{ fill: '#ffffff80', fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#ffffff40"
                  tick={{ fill: '#ffffff80', fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#colorValue)"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#a78bfa' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Period Buttons */}
          <div className="flex gap-2 mt-4 justify-center flex-wrap">
            {(['1M', '3M', '6M', '1Y', 'All'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-full text-xs ${
                  selectedPeriod === period
                    ? 'bg-white text-primary'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {period}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="px-4 mt-6 space-y-4">
        <Card className="p-5 bg-gradient-to-br from-blue-600 to-blue-800 border-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white/90 text-sm font-semibold">Assets</h3>
            <span className="text-xs text-white/70">Total balance</span>
          </div>
          <p className="text-3xl font-black text-white">
            ${Math.max(currentNetWorth, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-600 to-purple-800 border-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white/90 text-sm font-semibold">Liabilities</h3>
            <span className="text-xs text-white/70">Total debt</span>
          </div>
          <p className="text-3xl font-black text-white">
            ${Math.max(-currentNetWorth, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
