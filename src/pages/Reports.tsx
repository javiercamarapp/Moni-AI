import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loadingMonth, setLoadingMonth] = useState<number | null>(null);

  const months = [
    { number: 1, name: 'Enero' },
    { number: 2, name: 'Febrero' },
    { number: 3, name: 'Marzo' },
    { number: 4, name: 'Abril' },
    { number: 5, name: 'Mayo' },
    { number: 6, name: 'Junio' },
    { number: 7, name: 'Julio' },
    { number: 8, name: 'Agosto' },
    { number: 9, name: 'Septiembre' },
    { number: 10, name: 'Octubre' },
    { number: 11, name: 'Noviembre' },
    { number: 12, name: 'Diciembre' },
  ];

  useEffect(() => {
    loadAvailableYears();
  }, []);

  const loadAvailableYears = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: transactions } = await supabase
        .from('transactions')
        .select('transaction_date')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (transactions && transactions.length > 0) {
        const years = [...new Set(
          transactions.map(t => new Date(t.transaction_date).getFullYear())
        )].sort((a, b) => b - a);
        
        setAvailableYears(years);
      } else {
        setAvailableYears([new Date().getFullYear()]);
      }
    } catch (error) {
      console.error('Error loading years:', error);
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const handleDownloadReport = async (month: number) => {
    setLoadingMonth(month);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para descargar reportes",
          variant: "destructive"
        });
        return;
      }

      // Calcular rango de fechas para el mes seleccionado
      const startDate = new Date(selectedYear, month - 1, 1);
      const endDate = new Date(selectedYear, month, 0);

      const { data, error } = await supabase.functions.invoke('generate-statement-pdf', {
        body: {
          userId: user.id,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          monthName: months[month - 1].name,
          year: selectedYear
        }
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        // Crear un link temporal y hacer click para descargar
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = `Estado_Cuenta_${months[month - 1].name}_${selectedYear}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "¡Descarga iniciada!",
          description: `Descargando reporte de ${months[month - 1].name} ${selectedYear}`
        });
      }
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error al descargar",
        description: error.message || "No se pudo generar el reporte",
        variant: "destructive"
      });
    } finally {
      setLoadingMonth(null);
    }
  };

  return (
    <div className="min-h-screen animated-wave-bg pb-20">
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 z-10 bg-gradient-to-b from-background to-transparent backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/profile')}
          className="bg-white rounded-[20px] shadow-xl hover:bg-white/90 text-foreground hover:scale-105 transition-all border border-blue-100 h-12 w-12"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Reportes</h1>
        <div className="w-12" />
      </div>

      <div className="px-4 space-y-4">
        {/* Descripción */}
        <Card className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground mb-1">Estados de Cuenta</h2>
              <p className="text-xs text-foreground/70">
                Descarga tus reportes mensuales de ingresos y gastos en formato PDF
              </p>
            </div>
          </div>
        </Card>

        {/* Lista de Meses con Selector de Año */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-semibold text-foreground">
              Reportes de {selectedYear}
            </h3>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[120px] h-9 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-105 transition-all">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-100 rounded-[15px] shadow-xl z-50">
                {availableYears.filter(year => year <= new Date().getFullYear()).map((year) => (
                  <SelectItem 
                    key={year} 
                    value={year.toString()}
                    className="hover:bg-primary/10 cursor-pointer rounded-[10px]"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[...months].reverse().map((month) => (
              <Card
                key={month.number}
                className="p-4 bg-white rounded-[20px] shadow-xl border border-blue-100 hover:scale-[1.02] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {month.number.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {month.name} {selectedYear}
                      </p>
                      <p className="text-xs text-foreground/60">
                        Estado de cuenta mensual
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadReport(month.number)}
                    disabled={loadingMonth === month.number}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    {loadingMonth === month.number ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Descargar
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
