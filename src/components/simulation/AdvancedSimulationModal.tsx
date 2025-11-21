import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RiskSelector } from "./RiskSelector";
import { RiskLevel } from "@/hooks/useSavingsSimulation";

interface AdvancedSimulationModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (params: any) => void;
}

export const AdvancedSimulationModal = ({ open, onClose, onApply }: AdvancedSimulationModalProps) => {
  const [dailySavings, setDailySavings] = useState(100);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('moderate');
  const [extraContributions, setExtraContributions] = useState<{ month: number; amount: number }[]>([]);
  const [events, setEvents] = useState<{ month: number; amount: number; description: string }[]>([]);

  const handleAddContribution = () => {
    setExtraContributions([...extraContributions, { month: 1, amount: 0 }]);
  };

  const handleAddEvent = () => {
    setEvents([...events, { month: 1, amount: 0, description: '' }]);
  };

  const handleApply = () => {
    onApply({ dailySavings, riskLevel, extraContributions, events });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Simulación personalizada avanzada</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="dailySavings">Ahorro diario</Label>
            <Input
              id="dailySavings"
              type="number"
              value={dailySavings}
              onChange={(e) => setDailySavings(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <RiskSelector selected={riskLevel} onChange={setRiskLevel} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Aportaciones extra</Label>
              <Button size="sm" variant="outline" onClick={handleAddContribution}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {extraContributions.map((contribution, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mes"
                    value={contribution.month}
                    onChange={(e) => {
                      const newContributions = [...extraContributions];
                      newContributions[index].month = Number(e.target.value);
                      setExtraContributions(newContributions);
                    }}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Monto"
                    value={contribution.amount}
                    onChange={(e) => {
                      const newContributions = [...extraContributions];
                      newContributions[index].amount = Number(e.target.value);
                      setExtraContributions(newContributions);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setExtraContributions(extraContributions.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Eventos financieros</Label>
              <Button size="sm" variant="outline" onClick={handleAddEvent}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Mes"
                    value={event.month}
                    onChange={(e) => {
                      const newEvents = [...events];
                      newEvents[index].month = Number(e.target.value);
                      setEvents(newEvents);
                    }}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Monto"
                    value={event.amount}
                    onChange={(e) => {
                      const newEvents = [...events];
                      newEvents[index].amount = Number(e.target.value);
                      setEvents(newEvents);
                    }}
                  />
                  <Input
                    placeholder="Descripción"
                    value={event.description}
                    onChange={(e) => {
                      const newEvents = [...events];
                      newEvents[index].description = e.target.value;
                      setEvents(newEvents);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEvents(events.filter((_, i) => i !== index));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleApply}>
              Aplicar simulación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
