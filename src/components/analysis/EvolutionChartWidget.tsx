import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from "lucide-react";

interface MonthData {
  month: string;
  score: number;
  savings: number;
  balance: number;
  income: number;
  expenses: number;
}

interface EvolutionChartProps {
  data: MonthData[];
  insights?: {
    score?: string;
    balance?: string;
    flow?: string;
  };
}

export default function EvolutionChartWidget({ data, insights }: EvolutionChartProps) {
  const [view, setView] = useState<"score" | "balance" | "flow">("score");
  
  const getCurrentInsight = () => {
    if (!insights) return undefined;
    switch (view) {
      case "score":
        return insights.score;
      case "balance":
        return insights.balance;
      case "flow":
        return insights.flow;
      default:
        return undefined;
    }
  };

  const getChartConfig = () => {
    switch (view) {
      case "score":
        return {
          lines: [
            { key: "score", color: "#10b981", name: "Score Moni" },
            { key: "savings", color: "#a855f7", name: "Ahorro neto" }
          ],
          yAxisLabel: "Score / Ahorro (k)"
        };
      case "balance":
        return {
          lines: [
            { key: "balance", color: "#06b6d4", name: "Balance" }
          ],
          yAxisLabel: "Balance (k)"
        };
      case "flow":
        return {
          lines: [
            { key: "income", color: "#10b981", name: "Ingresos" },
            { key: "expenses", color: "#f97316", name: "Gastos" }
          ],
          yAxisLabel: "Monto (k)"
        };
    }
  };

  const config = getChartConfig();

  return (
    <Card className="p-4 bg-white rounded-[20px] shadow-xl transition-all border border-blue-100 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">📊 Tu Evolución</p>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-7 bg-muted border border-border">
              <TabsTrigger value="score" className="text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2">
                Score
              </TabsTrigger>
              <TabsTrigger value="balance" className="text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2">
                Balance
              </TabsTrigger>
              <TabsTrigger value="flow" className="text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2">
                Flujo
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="month" 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#1f2937',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{
                  color: '#1f2937',
                  fontWeight: '600',
                  marginBottom: '4px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '10px' }}
                iconType="line"
              />
              {config.lines.map(line => (
                <Line 
                  key={line.key}
                  type="monotone" 
                  dataKey={line.key} 
                  stroke={line.color} 
                  strokeWidth={2}
                  name={line.name}
                  dot={{ fill: line.color, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {getCurrentInsight() && (
          <div className="bg-primary/10 rounded-lg px-3 py-2 border border-primary/20 animate-fade-in">
            <p className="text-[10px] text-primary leading-snug">
              🟢 <span className="font-medium">Insight:</span> {getCurrentInsight()}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
