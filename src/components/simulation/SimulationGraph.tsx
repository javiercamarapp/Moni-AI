import { Card } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { RiskLevel } from "@/hooks/useSavingsSimulation";
import { motion } from "framer-motion";

interface SimulationGraphProps {
  data: {
    month: string;
    savings: number;
    investment: number;
  }[];
  riskLevel: RiskLevel;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border/40"
      >
        <p className="text-xs font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

const getRiskColor = (risk: RiskLevel) => {
  switch (risk) {
    case 'conservative':
      return { stroke: '#10b981', fill: '#10b98120' };
    case 'moderate':
      return { stroke: '#3b82f6', fill: '#3b82f620' };
    case 'aggressive':
      return { stroke: '#f59e0b', fill: '#f59e0b20' };
  }
};

export const SimulationGraph = ({ data, riskLevel }: SimulationGraphProps) => {
  const colors = getRiskColor(riskLevel);

  return (
    <Card className="p-6 bg-card border-border/40">
      <h3 className="text-sm font-medium text-foreground mb-4">Proyección de ahorro e inversión</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.stroke} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={colors.stroke} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
          />
          <YAxis 
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="savings"
            name="Ahorro"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#colorSavings)"
            animationDuration={1000}
          />
          <Area
            type="monotone"
            dataKey="investment"
            name="Inversión"
            stroke={colors.stroke}
            strokeWidth={2}
            fill="url(#colorInvestment)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
