import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useState } from "react";
import { GitCompare } from "lucide-react";
import { motion } from "framer-motion";

interface ScenarioComparisonProps {
  scenarios: Array<{
    name: string;
    data: any[];
    color: string;
  }>;
}

export const ScenarioComparison = ({ scenarios }: ScenarioComparisonProps) => {
  const [showDifference, setShowDifference] = useState(false);

  return (
    <Card className="p-6 bg-card border-border/40">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <GitCompare className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-medium text-foreground">Comparación de escenarios</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowDifference(!showDifference)}
        >
          {showDifference ? 'Ver absolutos' : 'Ver diferencias'}
        </Button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={scenarios[0].data}>
          <defs>
            {scenarios.map((scenario, index) => (
              <linearGradient key={index} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={scenario.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={scenario.color} stopOpacity={0}/>
              </linearGradient>
            ))}
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
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {scenarios.map((scenario, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey="investment"
              name={scenario.name}
              stroke={scenario.color}
              strokeWidth={2}
              fill={`url(#color${index})`}
              animationDuration={1000}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 pt-4 border-t border-border/40"
      >
        <p className="text-xs text-muted-foreground">
          {showDifference
            ? 'Mostrando diferencias porcentuales entre escenarios'
            : 'Mostrando valores absolutos de cada escenario'}
        </p>
      </motion.div>
    </Card>
  );
};
