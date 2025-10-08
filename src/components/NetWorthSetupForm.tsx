import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, ArrowLeft, Check, Plus, X, Banknote } from "lucide-react";
import { format } from "date-fns";

type AssetEntry = {
  id: string;
  categoryType: string;
  name: string;
  value: string;
  category: string;
};

type LiabilityEntry = {
  id: string;
  categoryType: string;
  name: string;
  value: string;
  category: string;
};

type CustomAssetAccount = {
  id: string;
  name: string;
  value: string;
};

type CustomAsset = {
  id: string;
  name: string;
  accounts: CustomAssetAccount[];
};

type CustomLiabilityAccount = {
  id: string;
  name: string;
  value: string;
};

type CustomLiability = {
  id: string;
  name: string;
  accounts: CustomLiabilityAccount[];
};

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

export default function NetWorthSetupForm({ onComplete, onBack }: { onComplete: () => void; onBack?: () => void }) {
  const navigate = useNavigate();
  const [assetEntries, setAssetEntries] = useState<AssetEntry[]>([]);
  const [liabilityEntries, setLiabilityEntries] = useState<LiabilityEntry[]>([]);
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);
  const [customLiabilities, setCustomLiabilities] = useState<CustomLiability[]>([]);
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

  const addAssetEntry = (categoryType: string, category: string) => {
    const newEntry: AssetEntry = {
      id: Date.now().toString(),
      categoryType,
      name: '',
      value: '',
      category
    };
    setAssetEntries([...assetEntries, newEntry]);
  };

  const addLiabilityEntry = (categoryType: string, category: string) => {
    const newEntry: LiabilityEntry = {
      id: Date.now().toString(),
      categoryType,
      name: '',
      value: '',
      category
    };
    setLiabilityEntries([...liabilityEntries, newEntry]);
  };

  const removeAssetEntry = (id: string) => {
    setAssetEntries(assetEntries.filter(entry => entry.id !== id));
  };

  const removeLiabilityEntry = (id: string) => {
    setLiabilityEntries(liabilityEntries.filter(entry => entry.id !== id));
  };

  const updateAssetEntry = (id: string, field: 'name' | 'value', value: string) => {
    setAssetEntries(assetEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const updateLiabilityEntry = (id: string, field: 'name' | 'value', value: string) => {
    setLiabilityEntries(liabilityEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Custom Assets functions
  const addCustomAsset = () => {
    const newAsset: CustomAsset = {
      id: Date.now().toString(),
      name: '',
      accounts: []
    };
    setCustomAssets([...customAssets, newAsset]);
  };

  const removeCustomAsset = (id: string) => {
    setCustomAssets(customAssets.filter(asset => asset.id !== id));
  };

  const updateCustomAssetName = (id: string, name: string) => {
    setCustomAssets(customAssets.map(asset => 
      asset.id === id ? { ...asset, name } : asset
    ));
  };

  const addCustomAssetAccount = (assetId: string) => {
    setCustomAssets(customAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          accounts: [...asset.accounts, { id: Date.now().toString(), name: '', value: '' }]
        };
      }
      return asset;
    }));
  };

  const removeCustomAssetAccount = (assetId: string, accountId: string) => {
    setCustomAssets(customAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          accounts: asset.accounts.filter(acc => acc.id !== accountId)
        };
      }
      return asset;
    }));
  };

  const updateCustomAssetAccount = (assetId: string, accountId: string, field: 'name' | 'value', value: string) => {
    setCustomAssets(customAssets.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          accounts: asset.accounts.map(acc => 
            acc.id === accountId ? { ...acc, [field]: value } : acc
          )
        };
      }
      return asset;
    }));
  };

  // Custom Liabilities functions
  const addCustomLiability = () => {
    const newLiability: CustomLiability = {
      id: Date.now().toString(),
      name: '',
      accounts: []
    };
    setCustomLiabilities([...customLiabilities, newLiability]);
  };

  const removeCustomLiability = (id: string) => {
    setCustomLiabilities(customLiabilities.filter(liability => liability.id !== id));
  };

  const updateCustomLiabilityName = (id: string, name: string) => {
    setCustomLiabilities(customLiabilities.map(liability => 
      liability.id === id ? { ...liability, name } : liability
    ));
  };

  const addCustomLiabilityAccount = (liabilityId: string) => {
    setCustomLiabilities(customLiabilities.map(liability => {
      if (liability.id === liabilityId) {
        return {
          ...liability,
          accounts: [...liability.accounts, { id: Date.now().toString(), name: '', value: '' }]
        };
      }
      return liability;
    }));
  };

  const removeCustomLiabilityAccount = (liabilityId: string, accountId: string) => {
    setCustomLiabilities(customLiabilities.map(liability => {
      if (liability.id === liabilityId) {
        return {
          ...liability,
          accounts: liability.accounts.filter(acc => acc.id !== accountId)
        };
      }
      return liability;
    }));
  };

  const updateCustomLiabilityAccount = (liabilityId: string, accountId: string, field: 'name' | 'value', value: string) => {
    setCustomLiabilities(customLiabilities.map(liability => {
      if (liability.id === liabilityId) {
        return {
          ...liability,
          accounts: liability.accounts.map(acc => 
            acc.id === accountId ? { ...acc, [field]: value } : acc
          )
        };
      }
      return liability;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSaveStatus('saving');

    try {
      // Preparar activos válidos
      const validAssets = assetEntries
        .filter(entry => entry.name.trim() && parseFloat(entry.value) > 0)
        .map(entry => ({
          name: entry.name.trim(),
          value: parseFloat(entry.value),
          category: entry.category
        }));

      // Agregar activos personalizados
      customAssets.forEach(customAsset => {
        if (customAsset.name.trim()) {
          customAsset.accounts.forEach(account => {
            if (account.name.trim() && parseFloat(account.value) > 0) {
              validAssets.push({
                name: `${customAsset.name} - ${account.name}`,
                value: parseFloat(account.value),
                category: 'Other'
              });
            }
          });
        }
      });

      // Preparar pasivos válidos
      const validLiabilities = liabilityEntries
        .filter(entry => entry.name.trim() && parseFloat(entry.value) > 0)
        .map(entry => ({
          name: entry.name.trim(),
          value: parseFloat(entry.value),
          category: entry.category
        }));

      // Agregar pasivos personalizados
      customLiabilities.forEach(customLiability => {
        if (customLiability.name.trim()) {
          customLiability.accounts.forEach(account => {
            if (account.name.trim() && parseFloat(account.value) > 0) {
              validLiabilities.push({
                name: `${customLiability.name} - ${account.name}`,
                value: parseFloat(account.value),
                category: 'Other'
              });
            }
          });
        }
      });

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
              onClick={() => onBack ? onBack() : navigate(-1)}
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

            <div className="p-5 space-y-4">
              {assetCategories.map((asset, index) => {
                const entriesForCategory = assetEntries.filter(e => e.categoryType === asset.name);
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-card-foreground text-sm font-medium">
                        {asset.name}
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addAssetEntry(asset.name, asset.category)}
                        className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                      >
                        <Plus className="h-3 w-3" />
                        Agregar
                      </Button>
                    </div>
                    
                    {entriesForCategory.map((entry) => (
                      <div key={entry.id} className="flex gap-1.5 items-start">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            type="text"
                            placeholder="Nombre (ej: Cuenta Bancomer)"
                            value={entry.name}
                            onChange={(e) => updateAssetEntry(entry.id, 'name', e.target.value)}
                            className="bg-card border-border/30 text-card-foreground text-xs h-7"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-card-foreground/70 font-semibold text-xs">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={entry.value}
                              onChange={(e) => updateAssetEntry(entry.id, 'value', e.target.value)}
                              className="pl-6 bg-card border-border/30 text-card-foreground focus:border-success transition-all text-xs h-7"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAssetEntry(entry.id)}
                          className="mt-0.5 h-6 w-6 text-danger hover:bg-danger/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activos Personalizados Card */}
          <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all hover-lift overflow-hidden">
            <div className="bg-gradient-primary/30 px-5 py-4 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/20 border border-accent/30">
                    <Banknote className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-bold text-lg text-card-foreground whitespace-nowrap">Activos Personalizados</h3>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addCustomAsset}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Categoría</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            </div>

            <div className="p-2 space-y-2">
              {customAssets.length === 0 && (
                <div className="text-center py-4 space-y-1">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted mb-1">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-card-foreground">
                    Crea tus propias categorías de activos
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Agrega categorías como colecciones, inversiones privadas o cualquier otro activo
                  </p>
                </div>
              )}

              {customAssets.map((customAsset) => (
                <div key={customAsset.id} className="space-y-2 p-2 rounded-lg bg-accent/5 border border-accent/20 hover:border-accent/30 transition-all">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Label className="text-card-foreground text-xs font-semibold mb-1 block">
                        📁 Categoría de Activo
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ej: Colección de Arte, Negocios, Inversiones Privadas"
                        value={customAsset.name}
                        onChange={(e) => updateCustomAssetName(customAsset.id, e.target.value)}
                        className="bg-card border-border/30 text-card-foreground font-semibold text-sm h-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomAsset(customAsset.id)}
                      className="mt-5 h-7 w-7 text-danger hover:bg-danger/10 hover:scale-110 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="pl-2 border-l-2 border-accent/30 space-y-2 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-card-foreground text-[10px] font-semibold uppercase tracking-wide">
                        Cuentas dentro de esta categoría
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addCustomAssetAccount(customAsset.id)}
                        className="h-6 text-[10px] gap-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-105"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        Agregar Cuenta
                      </Button>
                    </div>

                    {customAsset.accounts.length === 0 && (
                      <div className="text-center py-2 px-2 bg-muted/30 rounded-md border border-dashed border-border">
                        <p className="text-[10px] text-muted-foreground">
                          Agrega cuentas específicas dentro de esta categoría
                        </p>
                      </div>
                    )}

                    {customAsset.accounts.map((account) => (
                      <div key={account.id} className="flex gap-1.5 items-start p-2 rounded-md bg-card/50 border border-border/20">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            type="text"
                            placeholder="Nombre específico (ej: Pintura Picasso, Local Centro)"
                            value={account.name}
                            onChange={(e) => updateCustomAssetAccount(customAsset.id, account.id, 'name', e.target.value)}
                            className="bg-card border-border/30 text-card-foreground text-xs h-7"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-card-foreground/70 font-semibold text-xs">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={account.value}
                              onChange={(e) => updateCustomAssetAccount(customAsset.id, account.id, 'value', e.target.value)}
                              className="pl-6 bg-card border-border/30 text-card-foreground focus:border-success transition-all text-xs h-7"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomAssetAccount(customAsset.id, account.id)}
                          className="mt-0.5 h-6 w-6 text-danger hover:bg-danger/10 hover:scale-110 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
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

            <div className="p-5 space-y-4">
              {liabilityCategories.map((liability, index) => {
                const entriesForCategory = liabilityEntries.filter(e => e.categoryType === liability.name);
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-card-foreground text-sm font-medium">
                        {liability.name}
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addLiabilityEntry(liability.name, liability.category)}
                        className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                      >
                        <Plus className="h-3 w-3" />
                        Agregar
                      </Button>
                    </div>
                    
                    {entriesForCategory.map((entry) => (
                      <div key={entry.id} className="flex gap-1.5 items-start">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            type="text"
                            placeholder="Nombre (ej: Tarjeta Banamex)"
                            value={entry.name}
                            onChange={(e) => updateLiabilityEntry(entry.id, 'name', e.target.value)}
                            className="bg-card border-border/30 text-card-foreground text-xs h-7"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-card-foreground/70 font-semibold text-xs">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={entry.value}
                              onChange={(e) => updateLiabilityEntry(entry.id, 'value', e.target.value)}
                              className="pl-6 bg-card border-border/30 text-card-foreground focus:border-danger transition-all text-xs h-7"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLiabilityEntry(entry.id)}
                          className="mt-0.5 h-6 w-6 text-danger hover:bg-danger/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pasivos Personalizados Card */}
          <Card className="bg-gradient-card border-border/50 shadow-card hover:shadow-glow transition-all hover-lift overflow-hidden">
            <div className="bg-gradient-primary/30 px-5 py-4 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-danger/20 border border-danger/30">
                    <Banknote className="h-5 w-5 text-danger" />
                  </div>
                  <h3 className="font-bold text-lg text-card-foreground whitespace-nowrap">Pasivos Personalizados</h3>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addCustomLiability}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-105"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva Categoría</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>
            </div>

            <div className="p-2 space-y-2">
              {customLiabilities.length === 0 && (
                <div className="text-center py-4 space-y-1">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted mb-1">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-card-foreground">
                    Crea tus propias categorías de pasivos
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Agrega categorías como compromisos personales, deudas informales o cualquier otro pasivo
                  </p>
                </div>
              )}

              {customLiabilities.map((customLiability) => (
                <div key={customLiability.id} className="space-y-2 p-2 rounded-lg bg-danger/5 border border-danger/20 hover:border-danger/30 transition-all">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Label className="text-card-foreground text-xs font-semibold mb-1 block">
                        📁 Categoría de Pasivo
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ej: Deudas Familiares, Compromisos Personales, Otros"
                        value={customLiability.name}
                        onChange={(e) => updateCustomLiabilityName(customLiability.id, e.target.value)}
                        className="bg-card border-border/30 text-card-foreground font-semibold text-sm h-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomLiability(customLiability.id)}
                      className="mt-5 h-7 w-7 text-danger hover:bg-danger/10 hover:scale-110 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="pl-2 border-l-2 border-danger/30 space-y-2 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-card-foreground text-[10px] font-semibold uppercase tracking-wide">
                        Cuentas dentro de esta categoría
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addCustomLiabilityAccount(customLiability.id)}
                        className="h-6 text-[10px] gap-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-105"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        Agregar Cuenta
                      </Button>
                    </div>

                    {customLiability.accounts.length === 0 && (
                      <div className="text-center py-2 px-2 bg-muted/30 rounded-md border border-dashed border-border">
                        <p className="text-[10px] text-muted-foreground">
                          Agrega cuentas específicas dentro de esta categoría
                        </p>
                      </div>
                    )}

                    {customLiability.accounts.map((account) => (
                      <div key={account.id} className="flex gap-1.5 items-start p-2 rounded-md bg-card/50 border border-border/20">
                        <div className="flex-1 space-y-1.5">
                          <Input
                            type="text"
                            placeholder="Nombre específico (ej: Préstamo Mamá, Deuda Tienda)"
                            value={account.name}
                            onChange={(e) => updateCustomLiabilityAccount(customLiability.id, account.id, 'name', e.target.value)}
                            className="bg-card border-border/30 text-card-foreground text-xs h-7"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-card-foreground/70 font-semibold text-xs">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={account.value}
                              onChange={(e) => updateCustomLiabilityAccount(customLiability.id, account.id, 'value', e.target.value)}
                              className="pl-6 bg-card border-border/30 text-card-foreground focus:border-danger transition-all text-xs h-7"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCustomLiabilityAccount(customLiability.id, account.id)}
                          className="mt-0.5 h-6 w-6 text-danger hover:bg-danger/10 hover:scale-110 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
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
