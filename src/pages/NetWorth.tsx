import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Building2, CreditCard, Home, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";
import { useNetWorth, useHasNetWorthData, TimeRange } from "@/hooks/useNetWorth";
import NetWorthSetupForm from "@/components/NetWorthSetupForm";
import networthIntro from "@/assets/networth-intro.jpg";

type CategoryFilter = 'All' | 'Checking' | 'Savings' | 'Credit' | 'Loans' | 'Investments' | 'Property' | 'Other' | 'Mortgage';

const iconMap: Record<string, any> = {
  Building2,
  CreditCard,
  Home,
  Wallet,
  TrendingUp,
};

const getIconForCategory = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('check')) return 'Building2';
  if (lowerCategory.includes('saving')) return 'Wallet';
  if (lowerCategory.includes('investment')) return 'TrendingUp';
  if (lowerCategory.includes('property') || lowerCategory.includes('mortgage')) return 'Home';
  if (lowerCategory.includes('credit')) return 'CreditCard';
  if (lowerCategory.includes('loan')) return 'Building2';
  return 'Wallet';
};

export default function NetWorth() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const [liabilitiesExpanded, setLiabilitiesExpanded] = useState(false);
  const [assetFilter, setAssetFilter] = useState<CategoryFilter>('All');
  const [liabilityFilter, setLiabilityFilter] = useState<CategoryFilter>('All');
  const [showForm, setShowForm] = useState(false);

  const { data: hasData, isLoading: checkingData, refetch: refetchHasData } = useHasNetWorthData();
  const { data: netWorthData, isLoading: loadingData } = useNetWorth(timeRange);

  if (checkingData || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!hasData) {
    if (!showForm) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          {/* Hero Image */}
          <div className="h-[50vh] relative overflow-hidden">
            <img 
              src={networthIntro} 
              alt="Net Worth Intro" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 -mt-20 relative z-10">
            <div className="max-w-md text-center space-y-6">
              <h1 className="text-4xl font-bold text-foreground">
                Vamos a conocernos mejor
              </h1>
              <p className="text-lg text-muted-foreground">
                Nutre a tu Moni AI personal con tu información y empieza a ver la diferencia
              </p>
              <Button 
                size="lg"
                className="w-full mt-8 text-lg py-6 shadow-glow"
                onClick={() => setShowForm(true)}
              >
                Responder preguntas
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return <NetWorthSetupForm onComplete={() => refetchHasData()} />;
  }

  if (!netWorthData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Error cargando datos</p>
      </div>
    );
  }

  const { 
    currentNetWorth, 
    totalAssets, 
    totalLiabilities, 
    assets, 
    liabilities, 
    chartData, 
    percentageChange,
    highPoint,
    lowPoint
  } = netWorthData;

  const isPositiveChange = percentageChange >= 0;

  const filteredAssets = assetFilter === 'All' 
    ? assets 
    : assets.filter(a => a.category === assetFilter);

  const filteredLiabilities = liabilityFilter === 'All'
    ? liabilities
    : liabilities.filter(l => l.category === liabilityFilter);

  const assetCategories = ['All', ...Array.from(new Set(assets.map(a => a.category)))];
  const liabilityCategories = ['All', ...Array.from(new Set(liabilities.map(l => l.category)))];

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
                ${currentNetWorth.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  {isPositiveChange ? '+' : ''}{percentageChange.toFixed(2)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {timeRange === '1M' ? 'vs mes anterior' : 
                   timeRange === '3M' ? 'vs 3 meses' :
                   timeRange === '6M' ? 'vs 6 meses' :
                   timeRange === '1Y' ? 'vs 1 año' :
                   'desde el inicio'}
                </span>
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
                    "transition-all duration-300 hover:scale-105",
                    timeRange === range 
                      ? "bg-primary text-primary-foreground shadow-glow" 
                      : "hover:bg-accent hover:shadow-sm"
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
                  formatter={(value: number, name: string) => {
                    if (name === 'value') {
                      return [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Patrimonio Neto'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Fecha: ${label}`}
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
          {chartData.length > 0 && (
            <div className="flex justify-between mt-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                Máximo: ${highPoint.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Badge>
              <Badge variant="outline" className="bg-danger/10 text-danger border-danger/30">
                Mínimo: ${lowPoint.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Badge>
            </div>
          )}
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
                  ${totalAssets.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                {assetCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant={assetFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssetFilter(cat as CategoryFilter)}
                    className="text-xs"
                  >
                    {cat === 'All' ? 'Todos' : cat}
                  </Button>
                ))}
              </div>

              {/* Account List */}
              <div className="space-y-2">
                {filteredAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay activos en esta categoría
                  </p>
                ) : (
                  filteredAssets.map((account) => {
                    const iconName = getIconForCategory(account.category);
                    const Icon = iconMap[iconName];
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
                          ${Number(account.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })
                )}
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
                  ${totalLiabilities.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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
                {liabilityCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant={liabilityFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLiabilityFilter(cat as CategoryFilter)}
                    className="text-xs"
                  >
                    {cat === 'All' ? 'Todos' : cat}
                  </Button>
                ))}
              </div>

              {/* Account List */}
              <div className="space-y-2">
                {filteredLiabilities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay pasivos en esta categoría
                  </p>
                ) : (
                  filteredLiabilities.map((account) => {
                    const iconName = getIconForCategory(account.category);
                    const Icon = iconMap[iconName];
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
                          ${Number(account.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
