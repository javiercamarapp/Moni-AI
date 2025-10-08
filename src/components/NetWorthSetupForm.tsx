import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, ArrowLeft, Check } from "lucide-react";
import { format } from "date-fns";

const assetCategories = [
  { name: 'Cuentas bancarias (ahorro + cheques)', category: 'Checking' },
  { name: 'Inversiones financieras (fondos, CETES, bonos)', category: 'Investments' },
  { name: 'Acciones o ETFs en bolsa', category: 'Investments' },
  { name: 'Criptomonedas', category: 'Investments' },
  { name: 'Propiedad principal (casa o departamento)', category: 'Property' },
  { name: 'Propiedades adicionales (en renta o inversión)', category: 'Property' },
  { name: 'Vehículos (auto o moto)', category: 'Other' },
  { name: 'Ahorro para el retiro (Afore o plan privado)', category: 'Savings' },
  { name: 'Seguros con valor de rescate / inversión', category: 'Savings' },
  { name: 'Dinero prestado a terceros (por cobrar)', category: 'Other' },
  { name: 'Participaciones en empresas o startups', category: 'Investments' },
  { name: 'Propiedad intelectual (marca, royalties, licencias)', category: 'Other' },
  { name: 'Saldos en apps fintech (MercadoPago, PayPal, Revolut)', category: 'Checking' },
  { name: 'Inventario o mercancía para venta', category: 'Other' },
  { name: 'Obras de arte / joyas / metales preciosos', category: 'Other' },
  { name: 'Otros activos personalizados', category: 'Other' },
];

const liabilityCategories = [
  { name: 'Deuda de tarjetas de crédito', category: 'Credit' },
  { name: 'Préstamo personal bancario o fintech', category: 'Loans' },
  { name: 'Crédito automotriz', category: 'Loans' },
  { name: 'Hipoteca o préstamo hipotecario', category: 'Mortgage' },
  { name: 'Créditos educativos / estudiantiles', category: 'Loans' },
  { name: 'Préstamos con familiares o amigos', category: 'Other' },
  { name: 'Créditos de nómina o payroll loans', category: 'Loans' },
  { name: 'Deudas en tiendas departamentales (Liverpool, Coppel)', category: 'Credit' },
  { name: 'Pagos diferidos / meses sin intereses', category: 'Credit' },
  { name: 'Créditos empresariales / de negocio', category: 'Loans' },
  { name: 'Cuotas de mantenimiento o servicios atrasados', category: 'Other' },
  { name: 'Deudas con proveedores o socios', category: 'Other' },
  { name: 'Créditos en moneda extranjera (USD/EUR)', category: 'Loans' },
  { name: 'Impuestos o multas pendientes de pago', category: 'Other' },
  { name: 'Arrendamientos financieros (leasing)', category: 'Loans' },
  { name: 'Otros pasivos personalizados', category: 'Other' },
];

export default function NetWorthSetupForm({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const [assetValues, setAssetValues] = useState<Record<string, string>>({});
  const [liabilityValues, setLiabilityValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const updateAssetValue = (index: number, value: string) => {
    setAssetValues(prev => ({ ...prev, [index]: value }));
  };

  const updateLiabilityValue = (index: number, value: string) => {
    setLiabilityValues(prev => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSaveStatus('saving');

    try {
      // Preparar activos válidos
      const validAssets = assetCategories
        .map((asset, index) => ({
          name: asset.name,
          value: parseFloat(assetValues[index] || '0'),
          category: asset.category
        }))
        .filter(a => a.value > 0);

      // Preparar pasivos válidos
      const validLiabilities = liabilityCategories
        .map((liability, index) => ({
          name: liability.name,
          value: parseFloat(liabilityValues[index] || '0'),
          category: liability.category
        }))
        .filter(l => l.value > 0);

      // Insert assets
      if (validAssets.length > 0) {
        const { error: assetsError } = await supabase
          .from('assets')
          .insert(validAssets.map(a => ({
            user_id: user.id,
            name: a.name,
            value: a.value,
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
            value: l.value,
            category: l.category
          })));

        if (liabilitiesError) throw liabilitiesError;
      }

      // Create initial snapshot
      const totalAssets = validAssets.reduce((sum, a) => sum + a.value, 0);
      const totalLiabilities = validLiabilities.reduce((sum, l) => sum + l.value, 0);
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

      setSaveStatus('saved');
      toast.success('Patrimonio configurado exitosamente');
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error: any) {
      console.error('Error setting up net worth:', error);
      toast.error('Error al configurar patrimonio: ' + error.message);
      setSaveStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-wave-bg pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-card/95 backdrop-blur-md border-b border-border/30 shadow-card">
          <div className="flex items-center gap-3 px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-accent/50 hover-lift"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Configura tu Patrimonio</h1>
              <p className="text-sm text-muted-foreground">Completa la información financiera</p>
            </div>
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2 text-sm text-foreground animate-fade-in">
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Guardando...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    <span className="hidden sm:inline text-success">Guardado</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Activos Card */}
          <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all hover-lift overflow-hidden">
            <div className="bg-gradient-primary/30 px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/20 border border-success/30">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-card-foreground">💰 Activos Esenciales</h3>
                  <p className="text-xs text-card-foreground/70">Lo que posees</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {assetCategories.map((asset, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`asset-${index}`} className="text-card-foreground text-sm font-medium">
                    {asset.name}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-card-foreground/70 font-semibold">$</span>
                    <Input
                      id={`asset-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={assetValues[index] || ''}
                      onChange={(e) => updateAssetValue(index, e.target.value)}
                      className="pl-7 bg-card border-border/30 text-card-foreground focus:border-success transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pasivos Card */}
          <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all hover-lift overflow-hidden">
            <div className="bg-gradient-primary/30 px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-danger/20 border border-danger/30">
                  <TrendingDown className="h-5 w-5 text-danger" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-card-foreground">💸 Pasivos Esenciales</h3>
                  <p className="text-xs text-card-foreground/70">Lo que debes</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {liabilityCategories.map((liability, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`liability-${index}`} className="text-card-foreground text-sm font-medium">
                    {liability.name}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-card-foreground/70 font-semibold">$</span>
                    <Input
                      id={`liability-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={liabilityValues[index] || ''}
                      onChange={(e) => updateLiabilityValue(index, e.target.value)}
                      className="pl-7 bg-card border-border/30 text-card-foreground focus:border-danger transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full py-6 text-lg font-semibold shadow-glow hover:scale-105 transition-all"
            disabled={loading}
          >
            {loading ? 'Guardando tu patrimonio...' : 'Completar Cuestionario'}
          </Button>
        </form>
      </div>
    </div>
  );
}
