import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface AssetItem {
  id: string;
  name: string;
  value: string;
  category: string;
}

interface LiabilityItem {
  id: string;
  name: string;
  value: string;
  category: string;
}

const assetCategories = ['Checking', 'Savings', 'Investments', 'Property', 'Other'];
const liabilityCategories = ['Credit', 'Loans', 'Mortgage', 'Other'];

export default function NetWorthSetupForm({ onComplete }: { onComplete: () => void }) {
  const [assets, setAssets] = useState<AssetItem[]>([
    { id: crypto.randomUUID(), name: '', value: '', category: 'Checking' }
  ]);
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>([
    { id: crypto.randomUUID(), name: '', value: '', category: 'Credit' }
  ]);
  const [loading, setLoading] = useState(false);

  const addAsset = () => {
    setAssets([...assets, { id: crypto.randomUUID(), name: '', value: '', category: 'Checking' }]);
  };

  const removeAsset = (id: string) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const updateAsset = (id: string, field: keyof AssetItem, value: string) => {
    setAssets(assets.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addLiability = () => {
    setLiabilities([...liabilities, { id: crypto.randomUUID(), name: '', value: '', category: 'Credit' }]);
  };

  const removeLiability = (id: string) => {
    setLiabilities(liabilities.filter(l => l.id !== id));
  };

  const updateLiability = (id: string, field: keyof LiabilityItem, value: string) => {
    setLiabilities(liabilities.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Filter out empty entries
      const validAssets = assets.filter(a => a.name && a.value);
      const validLiabilities = liabilities.filter(l => l.name && l.value);

      // Insert assets
      if (validAssets.length > 0) {
        const { error: assetsError } = await supabase
          .from('assets')
          .insert(validAssets.map(a => ({
            user_id: user.id,
            name: a.name,
            value: parseFloat(a.value),
            category: a.category
          })));

        if (assetsError) throw assetsError;
      }

      // Insert liabilities
      if (validLiabilities.length > 0) {
        const { error: liabilitiesError } = await supabase
          .from('liabilities')
          .insert(validLiabilities.map(l => ({
            user_id: user.id,
            name: l.name,
            value: parseFloat(l.value),
            category: l.category
          })));

        if (liabilitiesError) throw liabilitiesError;
      }

      // Create initial snapshot
      const totalAssets = validAssets.reduce((sum, a) => sum + parseFloat(a.value), 0);
      const totalLiabilities = validLiabilities.reduce((sum, l) => sum + parseFloat(l.value), 0);
      const netWorth = totalAssets - totalLiabilities;

      const { error: snapshotError } = await supabase
        .from('net_worth_snapshots')
        .insert({
          user_id: user.id,
          snapshot_date: format(new Date(), 'yyyy-MM-dd'),
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: netWorth
        });

      if (snapshotError) throw snapshotError;

      toast.success('Patrimonio configurado exitosamente');
      onComplete();
    } catch (error: any) {
      console.error('Error setting up net worth:', error);
      toast.error('Error al configurar patrimonio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl p-6 bg-gradient-card border-border/50">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configura tu Patrimonio Neto</h1>
          <p className="text-muted-foreground">
            Completa este formulario inicial para comenzar a rastrear tu patrimonio neto.
            Podrás actualizar estos valores más adelante.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Assets Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <h2 className="text-xl font-semibold text-foreground">Activos</h2>
            </div>
            
            {assets.map((asset, index) => (
              <div key={asset.id} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor={`asset-name-${asset.id}`}>Nombre</Label>
                  <Input
                    id={`asset-name-${asset.id}`}
                    placeholder="ej. Cuenta de Ahorros"
                    value={asset.name}
                    onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                    required={index === 0}
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor={`asset-value-${asset.id}`}>Valor</Label>
                  <Input
                    id={`asset-value-${asset.id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={asset.value}
                    onChange={(e) => updateAsset(asset.id, 'value', e.target.value)}
                    required={index === 0}
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor={`asset-category-${asset.id}`}>Categoría</Label>
                  <Select
                    value={asset.category}
                    onValueChange={(value) => updateAsset(asset.id, 'category', value)}
                  >
                    <SelectTrigger id={`asset-category-${asset.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assetCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {assets.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAsset(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button type="button" variant="outline" onClick={addAsset} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Activo
            </Button>
          </div>

          {/* Liabilities Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-danger" />
              <h2 className="text-xl font-semibold text-foreground">Pasivos</h2>
            </div>
            
            {liabilities.map((liability, index) => (
              <div key={liability.id} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor={`liability-name-${liability.id}`}>Nombre</Label>
                  <Input
                    id={`liability-name-${liability.id}`}
                    placeholder="ej. Tarjeta de Crédito"
                    value={liability.name}
                    onChange={(e) => updateLiability(liability.id, 'name', e.target.value)}
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor={`liability-value-${liability.id}`}>Valor</Label>
                  <Input
                    id={`liability-value-${liability.id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={liability.value}
                    onChange={(e) => updateLiability(liability.id, 'value', e.target.value)}
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor={`liability-category-${liability.id}`}>Categoría</Label>
                  <Select
                    value={liability.category}
                    onValueChange={(value) => updateLiability(liability.id, 'category', value)}
                  >
                    <SelectTrigger id={`liability-category-${liability.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {liabilityCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {liabilities.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLiability(liability.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button type="button" variant="outline" onClick={addLiability} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Pasivo
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Completar Configuración'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
