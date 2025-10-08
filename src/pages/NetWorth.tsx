import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, Menu } from "lucide-react";
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


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
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '1M' | '3M' | '6M' | '1Y' | 'All'>('1M');
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
        case '1D':
          startDate.setDate(now.getDate() - 1);
          break;
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

      if (error) throw error;

      const netWorthMap = new Map<string, number>();
      let runningTotal = 0;

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

      if (dataPoints.length === 0) {
        dataPoints.push({
          date: now.toISOString().split('T')[0],
          value: 0,
          displayDate: now.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
        });
      }

      setNetWorthData(dataPoints);

      const current = dataPoints[dataPoints.length - 1]?.value || 0;
      const previous = dataPoints[0]?.value || 0;
      const change = current - previous;
      const changePercent = previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;

      setCurrentNetWorth(current);
      setNetWorthChange(change);
      setNetWorthChangePercent(changePercent);

      const values = dataPoints.map(d => d.value);
      setHighValue(Math.max(...values));
      setLowValue(Math.min(...values));

      // Calculate assets and liabilities
      const assets = Math.max(current, 0);
      const liabilities = Math.abs(Math.min(current, 0));
      setTotalAssets(assets);
      setTotalLiabilities(liabilities);

      // Mock accounts data - en producción vendría de la base de datos
      setAccounts([
        { id: '1', name: 'TOTAL CHECKING', type: 'Checking', balance: 7401.77, lastUpdate: 'less than a minute ago' },
        { id: '2', name: 'Checking 0951', type: 'Checking', balance: 4796.94, lastUpdate: 'less than a minute ago' },
        { id: '3', name: '360 Checking', type: 'Checking', balance: 2604.80, lastUpdate: '2 months ago' },
        { id: '4', name: 'EVERYDAY SA...', type: 'Savings', balance: 0.03, lastUpdate: '2 months ago' },
      ]);

    } catch (error) {
      console.error('Error fetching net worth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg px-3 py-1.5 shadow-lg">
          <p className="text-gray-900 text-xs font-semibold">
            ${payload[0].value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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

      {/* Chart Section with overlay labels */}
      <div className="relative h-64 px-4 mb-4 z-10">
        {/* High label */}
        <div className="absolute top-2 right-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 shadow-md">
          <span className="text-[10px] text-white/70">high: </span>
          <span className="text-xs text-white font-semibold">${highValue.toLocaleString('es-MX')}</span>
        </div>

        {/* Chart */}
        <div className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netWorthData}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.7}/>
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#ffffff" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="displayDate" 
                hide
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="natural"
                dataKey="value"
                stroke="none"
                fill="url(#areaGradient)"
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
              <Line
                type="natural"
                dataKey="value"
                stroke="url(#lineGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#ffffff', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Low label */}
        <div className="absolute bottom-2 right-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1 shadow-md">
          <span className="text-[10px] text-white/70">low: </span>
          <span className="text-xs text-white font-semibold">${lowValue.toLocaleString('es-MX')}</span>
        </div>
      </div>

      {/* Period Buttons - Positioned over the chart */}
      <div className="px-4 mb-4 flex gap-2 justify-end relative z-10">
        {(['1D', '1M', '3M', '6M', '1Y', 'All'] as const).map((period) => (
          <Button
            key={period}
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPeriod(period)}
            className={`rounded-full text-xs h-8 px-3 transition-all duration-200 ${
              selectedPeriod === period
                ? 'bg-white/90 text-[#4a5fc1] font-semibold shadow-lg scale-105'
                : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
            }`}
          >
            {period}
          </Button>
        ))}
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
