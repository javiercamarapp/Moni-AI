import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Building2, CreditCard, Home, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'All';
type CategoryFilter = 'All' | 'Checking' | 'Savings' | 'Credit' | 'Loans' | 'Investments' | 'Property';

interface Account {
  id: string;
  name: string;
  value: number;
  category: CategoryFilter;
  icon: string;
}

// Mock data - replace with real data from your backend
const generateChartData = (range: TimeRange) => {
  const baseData = [
    { date: 'Ene', value: 45000, high: 47000, low: 43000 },
    { date: 'Feb', value: 48000, high: 50000, low: 46000 },
    { date: 'Mar', value: 52000, high: 54000, low: 50000 },
    { date: 'Abr', value: 49000, high: 52000, low: 47000 },
    { date: 'May', value: 55000, high: 57000, low: 53000 },
    { date: 'Jun', value: 58000, high: 60000, low: 56000 },
    { date: 'Jul', value: 62000, high: 64000, low: 60000 },
    { date: 'Ago', value: 59000, high: 62000, low: 57000 },
    { date: 'Sep', value: 65000, high: 67000, low: 63000 },
    { date: 'Oct', value: 68000, high: 70000, low: 66000 },
    { date: 'Nov', value: 71000, high: 73000, low: 69000 },
    { date: 'Dic', value: 75000, high: 77000, low: 73000 },
  ];
  
  if (range === '1M') return baseData.slice(-1);
  if (range === '3M') return baseData.slice(-3);
  if (range === '6M') return baseData.slice(-6);
  if (range === '1Y') return baseData;
  return baseData;
};

const mockAssets: Account[] = [
  { id: '1', name: 'Cuenta de Cheques BBVA', value: 25000, category: 'Checking', icon: 'Building2' },
  { id: '2', name: 'Cuenta de Ahorros Santander', value: 50000, category: 'Savings', icon: 'Wallet' },
  { id: '3', name: 'Inversiones CETES', value: 80000, category: 'Investments', icon: 'TrendingUp' },
  { id: '4', name: 'Casa (Estimado)', value: 2500000, category: 'Property', icon: 'Home' },
];

const mockLiabilities: Account[] = [
  { id: '5', name: 'Tarjeta de Crédito AMEX', value: 15000, category: 'Credit', icon: 'CreditCard' },
  { id: '6', name: 'Préstamo Automotriz', value: 180000, category: 'Loans', icon: 'Building2' },
  { id: '7', name: 'Hipoteca Casa', value: 1200000, category: 'Loans', icon: 'Home' },
];

const iconMap: Record<string, any> = {
  Building2,
  CreditCard,
  Home,
  Wallet,
  TrendingUp,
};

export default function NetWorth() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const [liabilitiesExpanded, setLiabilitiesExpanded] = useState(false);
  const [assetFilter, setAssetFilter] = useState<CategoryFilter>('All');
  const [liabilityFilter, setLiabilityFilter] = useState<CategoryFilter>('All');

  const chartData = generateChartData(timeRange);
  const currentNetWorth = 75000;
  const totalAssets = mockAssets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = mockLiabilities.reduce((sum, l) => sum + l.value, 0);
  const netWorthChange = 12.5;
  const isPositiveChange = netWorthChange >= 0;

  const filteredAssets = assetFilter === 'All' 
    ? mockAssets 
    : mockAssets.filter(a => a.category === assetFilter);

  const filteredLiabilities = liabilityFilter === 'All'
    ? mockLiabilities
    : mockLiabilities.filter(l => l.category === liabilityFilter);

  const highPoint = Math.max(...chartData.map(d => d.high));
  const lowPoint = Math.min(...chartData.map(d => d.low));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-card border-b border-border/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-foreground hover:bg-white/5"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Patrimonio Neto</h1>
              <p className="text-sm text-muted-foreground">Evolución de tu riqueza</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Net Worth Summary */}
        <Card className="p-6 bg-gradient-card border-border/50 card-glow">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Patrimonio Total</p>
              <h2 className="text-4xl font-bold text-foreground">
                ${currentNetWorth.toLocaleString()}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  isPositiveChange ? "text-success" : "text-danger"
                )}>
                  {isPositiveChange ? '+' : ''}{netWorthChange}%
                </span>
                <span className="text-sm text-muted-foreground">vs mes anterior</span>
              </div>
            </div>
            <div className="flex gap-2">
              {(['1M', '3M', '6M', '1Y', 'All'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "transition-all duration-200",
                    timeRange === range 
                      ? "bg-primary text-primary-foreground shadow-glow" 
                      : "hover:bg-accent"
                  )}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  stroke="hsl(var(--border))"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--card-foreground))'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valor']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fill="url(#colorValue)"
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* High/Low Tags */}
          <div className="flex justify-between mt-4">
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              Máximo: ${highPoint.toLocaleString()}
            </Badge>
            <Badge variant="outline" className="bg-danger/10 text-danger border-danger/30">
              Mínimo: ${lowPoint.toLocaleString()}
            </Badge>
          </div>
        </Card>

        {/* Assets Card */}
        <Card className="bg-gradient-card border-border/50 overflow-hidden">
          <div 
            className="p-6 cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => setAssetsExpanded(!assetsExpanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <h3 className="text-lg font-semibold text-foreground">Activos</h3>
                </div>
                <p className="text-3xl font-bold text-success">
                  ${totalAssets.toLocaleString()}
                </p>
              </div>
              {assetsExpanded ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>

          {assetsExpanded && (
            <div className="px-6 pb-6 space-y-4 animate-accordion-down">
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {(['All', 'Checking', 'Savings', 'Investments', 'Property'] as CategoryFilter[]).map((cat) => (
                  <Button
                    key={cat}
                    variant={assetFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssetFilter(cat)}
                    className="text-xs"
                  >
                    {cat === 'All' ? 'Todos' : cat}
                  </Button>
                ))}
              </div>

              {/* Account List */}
              <div className="space-y-2">
                {filteredAssets.map((account) => {
                  const Icon = iconMap[account.icon];
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-success/10">
                          <Icon className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{account.name}</p>
                          <p className="text-xs text-muted-foreground">{account.category}</p>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-success">
                        ${account.value.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Liabilities Card */}
        <Card className="bg-gradient-card border-border/50 overflow-hidden">
          <div 
            className="p-6 cursor-pointer hover:bg-accent/5 transition-colors"
            onClick={() => setLiabilitiesExpanded(!liabilitiesExpanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-5 w-5 text-danger" />
                  <h3 className="text-lg font-semibold text-foreground">Pasivos</h3>
                </div>
                <p className="text-3xl font-bold text-danger">
                  ${totalLiabilities.toLocaleString()}
                </p>
              </div>
              {liabilitiesExpanded ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>

          {liabilitiesExpanded && (
            <div className="px-6 pb-6 space-y-4 animate-accordion-down">
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {(['All', 'Credit', 'Loans'] as CategoryFilter[]).map((cat) => (
                  <Button
                    key={cat}
                    variant={liabilityFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLiabilityFilter(cat)}
                    className="text-xs"
                  >
                    {cat === 'All' ? 'Todos' : cat}
                  </Button>
                ))}
              </div>

              {/* Account List */}
              <div className="space-y-2">
                {filteredLiabilities.map((account) => {
                  const Icon = iconMap[account.icon];
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card transition-colors border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-danger/10">
                          <Icon className="h-5 w-5 text-danger" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{account.name}</p>
                          <p className="text-xs text-muted-foreground">{account.category}</p>
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-danger">
                        ${account.value.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
