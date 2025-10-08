import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, Menu } from "lucide-react";
import { LineChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";


interface NetWorthDataPoint {
  date: string;
  value: number;
  displayDate: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  lastUpdate: string;
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
  const [activeTab, setActiveTab] = useState<'assets' | 'liabilities'>('assets');
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetchNetWorthData();
  }, [selectedPeriod]);

  const fetchNetWorthData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
          startDate.setFullYear(2020, 0, 1);
          break;
      }

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: true });

      console.log('📥 Transacciones obtenidas:', {
        count: transactions?.length || 0,
        startDate: startDate.toISOString().split('T')[0],
        period: selectedPeriod,
        error: error?.message
      });

      if (error) throw error;

      // Calcular el Net Worth real día por día basado en saldos de cuentas
      const accountBalances = new Map<string, number>(); // account -> balance
      const netWorthByDate = new Map<string, number>(); // date -> net worth
      
      const sortedTransactions = (transactions || []).sort((a, b) => 
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      );

      // Procesar cada transacción para actualizar saldos de cuentas
      sortedTransactions.forEach(transaction => {
        const account = transaction.account || 'Sin cuenta';
        const amount = Number(transaction.amount);
        const date = transaction.transaction_date;
        
        // Obtener saldo actual de la cuenta
        const currentBalance = accountBalances.get(account) || 0;
        
        // Actualizar saldo según tipo de transacción
        let newBalance = currentBalance;
        if (transaction.type === 'ingreso') {
          newBalance = currentBalance + amount;
        } else {
          newBalance = currentBalance - amount;
        }
        
        accountBalances.set(account, newBalance);
        
        // Calcular Net Worth total (suma de todos los saldos de cuentas)
        let totalNetWorth = 0;
        accountBalances.forEach(balance => {
          totalNetWorth += balance;
        });
        
        netWorthByDate.set(date, totalNetWorth);
      });

      console.log('💼 Saldos por cuenta:', Object.fromEntries(accountBalances));
      console.log('📈 Net Worth por fecha:', Object.fromEntries(netWorthByDate));

      // Determinar el intervalo de agrupación según el período
      let groupByDays = 1;
      let dateFormat: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      
      switch (selectedPeriod) {
        case '1M':
          groupByDays = 3;
          dateFormat = { month: 'short', day: 'numeric' };
          break;
        case '3M':
          groupByDays = 7;
          dateFormat = { month: 'short', day: 'numeric' };
          break;
        case '6M':
          groupByDays = 15;
          dateFormat = { month: 'short', day: 'numeric' };
          break;
        case '1Y':
          groupByDays = 30;
          dateFormat = { month: 'short' };
          break;
        case 'All':
          groupByDays = 90;
          dateFormat = { year: 'numeric', month: 'short' };
          break;
      }

      // Crear puntos de datos para la gráfica
      const dataPoints: NetWorthDataPoint[] = [];
      const dates = Array.from(netWorthByDate.keys()).sort();
      
      if (dates.length > 0) {
        // Agrupar datos según el intervalo seleccionado
        let currentGroupStart = new Date(dates[0]);
        let lastValue = 0;
        
        dates.forEach((date, index) => {
          const currentDate = new Date(date);
          const daysDiff = Math.floor((currentDate.getTime() - currentGroupStart.getTime()) / (1000 * 60 * 60 * 24));
          
          const value = netWorthByDate.get(date) || lastValue;
          lastValue = value;
          
          // Agregar punto si es el primer elemento, alcanzamos el intervalo, o es el último
          if (index === 0 || daysDiff >= groupByDays || index === dates.length - 1) {
            dataPoints.push({
              date,
              value,
              displayDate: currentDate.toLocaleDateString('es-MX', dateFormat)
            });
            currentGroupStart = currentDate;
          }
        });
      } else {
        // Si no hay transacciones, mostrar punto en 0
        console.log('⚠️ No hay transacciones, creando punto inicial en 0');
        dataPoints.push({
          date: now.toISOString().split('T')[0],
          value: 0,
          displayDate: now.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
        });
      }

      console.log('📊 Puntos de datos generados:', {
        totalPoints: dataPoints.length,
        points: dataPoints
      });

      setNetWorthData(dataPoints);

      const current = dataPoints[dataPoints.length - 1]?.value || 0;
      const previous = dataPoints[0]?.value || 0;
      const change = current - previous;
      const changePercent = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;

      console.log('💰 Patrimonio calculado:', {
        current,
        previous,
        change,
        changePercent: changePercent.toFixed(2) + '%'
      });

      setCurrentNetWorth(current);
      setNetWorthChange(change);
      setNetWorthChangePercent(changePercent);

      const values = dataPoints.map(d => d.value);
      setHighValue(Math.max(...values));
      setLowValue(Math.min(...values));

      // Calcular activos y pasivos basados en saldos de cuentas
      let totalAssets = 0;
      let totalLiabilities = 0;
      
      accountBalances.forEach(balance => {
        if (balance > 0) {
          totalAssets += balance;
        } else {
          totalLiabilities += Math.abs(balance);
        }
      });
      
      setTotalAssets(totalAssets);
      setTotalLiabilities(totalLiabilities);

      // Generar lista de cuentas con sus saldos
      const accountsList: Account[] = [];
      accountBalances.forEach((balance, accountName) => {
        if (accountName !== 'Sin cuenta') {
          accountsList.push({
            id: accountName,
            name: accountName,
            type: balance > 0 ? 'Asset' : 'Liability',
            balance: Math.abs(balance),
            lastUpdate: 'Actualizado ahora'
          });
        }
      });
      
      setAccounts(accountsList);

    } catch (error) {
      console.error('Error fetching net worth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-lg px-3 py-2 shadow-xl border border-gray-200">
          <p className="text-gray-600 text-xs font-medium mb-1">
            {data.displayDate}
          </p>
          <p className="text-gray-900 text-lg font-bold">
            ${payload[0].value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(220,45%,15%)] to-[hsl(240,40%,10%)] pb-20 relative overflow-hidden">
      {/* Animated background elements similar to dashboard */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -right-20 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-muted/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 pb-0">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-base font-semibold text-white">Net Worth</h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchNetWorthData}
              className="text-white hover:bg-white/10"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Current Net Worth */}
        <div className="mb-4">
          <h2 className="text-5xl font-black text-white mb-1 drop-shadow-lg">
            ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h2>
          <div className="flex items-center gap-2">
            {netWorthChange >= 0 ? (
              <TrendingUp className="w-3 h-3 text-white/80" />
            ) : (
              <TrendingDown className="w-3 h-3 text-white/80" />
            )}
            <span className="text-sm text-white/80">
              ${Math.abs(netWorthChange).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({netWorthChangePercent >= 0 ? '+' : ''}{netWorthChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section - Net Worth Real */}
      <div className="relative px-4 mb-6 z-10">
        {/* Period Buttons */}
        <div className="mb-3 flex gap-2 justify-end">
          {(['1M', '3M', '6M', '1Y', 'All'] as const).map((period) => (
            <Button
              key={period}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className={`rounded-lg text-xs h-8 px-3 transition-all duration-200 ${
                selectedPeriod === period
                  ? 'bg-[#ef4444] text-white font-semibold shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {period}
            </Button>
          ))}
        </div>

        {/* Chart Container */}
        <div className="h-96 w-full rounded-2xl overflow-hidden" style={{
          background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 100%)'
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={netWorthData}
              margin={{ top: 30, right: 30, left: 60, bottom: 30 }}
            >
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.1)" 
                vertical={false}
              />
              
              <XAxis 
                dataKey="displayDate"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                tickLine={false}
              />
              
              <YAxis 
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                  return `$${value}`;
                }}
                tickLine={false}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#netWorthGradient)"
                dot={false}
                activeDot={{ 
                  r: 6, 
                  fill: '#10b981', 
                  stroke: '#fff', 
                  strokeWidth: 2 
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Assets and Liabilities Cards - Horizontal Layout */}
      <div className="px-4 mb-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {/* Assets Card */}
          <Card 
            className={`p-4 cursor-pointer transition-all duration-200 card-glow shadow-2xl ${
              activeTab === 'assets'
                ? 'bg-gradient-to-br from-[hsl(220,45%,18%)] to-[hsl(240,40%,12%)] border-2 border-[hsl(220,50%,35%)]/40'
                : 'bg-white/5 backdrop-blur-sm border border-white/10'
            }`}
            onClick={() => setActiveTab('assets')}
          >
            <p className="text-xs text-white/80 mb-1">Assets</p>
            <p className="text-2xl font-black text-white drop-shadow-lg">
              ${totalAssets.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </Card>

          {/* Liabilities Card */}
          <Card 
            className={`p-4 cursor-pointer transition-all duration-200 card-glow shadow-2xl ${
              activeTab === 'liabilities'
                ? 'bg-gradient-to-br from-[hsl(0,45%,18%)] to-[hsl(15,40%,12%)] border-2 border-[hsl(0,50%,35%)]/40'
                : 'bg-white/5 backdrop-blur-sm border border-white/10'
            }`}
            onClick={() => setActiveTab('liabilities')}
          >
            <p className="text-xs text-white/80 mb-1">Liabilities</p>
            <p className="text-2xl font-black text-white drop-shadow-lg">
              ${totalLiabilities.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>
      </div>

      {/* Accounts List */}
      <div className="pb-4 relative z-10">
        <div className="bg-gradient-card card-glow rounded-3xl shadow-2xl border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-base font-semibold text-white">
              {activeTab === 'assets' ? 'Banking' : 'Credit Cards'}
            </h3>
            <Button variant="ghost" size="sm" className="text-sm text-white/70 hover:text-white hover:bg-white/10">
              <Menu className="w-4 h-4 mr-1" />
              Sort by Institution
            </Button>
          </div>

          {/* Account Items */}
          <div className="divide-y divide-white/10">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-white/20">
                    <div className="w-6 h-6 bg-white/80 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{account.name}</p>
                    <p className="text-xs text-white/60">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-white">
                    ${account.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-white/50">{account.lastUpdate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
