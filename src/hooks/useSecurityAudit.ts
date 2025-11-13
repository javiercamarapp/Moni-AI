import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runSecurityAudit, cleanUserDataOnLogin } from '@/lib/securityAudit';
import { useToast } from '@/hooks/use-toast';

interface SecurityStatus {
  isLoading: boolean;
  isSecure: boolean;
  score: number;
  anomalyCount: number;
  lastCheck: Date | null;
}

/**
 * Hook para monitorear seguridad y detectar anomalías automáticamente
 */
export const useSecurityAudit = (options?: {
  runOnMount?: boolean;
  autoClean?: boolean;
  showToasts?: boolean;
}) => {
  const { runOnMount = true, autoClean = true, showToasts = false } = options || {};
  const { toast } = useToast();
  
  const [status, setStatus] = useState<SecurityStatus>({
    isLoading: true,
    isSecure: true,
    score: 100,
    anomalyCount: 0,
    lastCheck: null,
  });

  const runAudit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setStatus(prev => ({ ...prev, isLoading: true }));

      // Limpiar datos problemáticos si está habilitado
      if (autoClean) {
        cleanUserDataOnLogin(user.id);
      }

      // Ejecutar auditoría completa
      const result = await runSecurityAudit(user.id);

      setStatus({
        isLoading: false,
        isSecure: result.isValid,
        score: result.score,
        anomalyCount: result.anomalies.length,
        lastCheck: new Date(),
      });

      // Mostrar alertas si hay problemas críticos
      const criticalAnomalies = result.anomalies.filter(a => a.type === 'critical');
      if (criticalAnomalies.length > 0 && showToasts) {
        toast({
          title: '⚠️ Anomalías de seguridad detectadas',
          description: `Se detectaron ${criticalAnomalies.length} problemas críticos de seguridad. Tus datos han sido protegidos.`,
          variant: 'destructive',
        });
      }

      // Log para debugging
      if (result.anomalies.length > 0) {
        console.warn('[SecurityAudit] Anomalías detectadas:', result.anomalies);
      }

      return result;
    } catch (error) {
      console.error('[SecurityAudit] Error en auditoría:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (runOnMount) {
      runAudit();
    }
  }, [runOnMount]);

  return {
    status,
    runAudit,
    isSecure: status.isSecure,
    score: status.score,
    anomalyCount: status.anomalyCount,
  };
};
