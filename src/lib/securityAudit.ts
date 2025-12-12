import { supabase } from '@/integrations/supabase/client';
import { invalidateAllCache } from '@/lib/cacheService';

/**
 * Sistema de Detección de Anomalías y Auditoría de Seguridad
 * Detecta inconsistencias, mezclas de datos y problemas de integridad
 */

interface AnomalyReport {
  type: 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  details?: any;
  timestamp: Date;
}

interface SecurityAuditResult {
  isValid: boolean;
  anomalies: AnomalyReport[];
  score: number; // 0-100, donde 100 es completamente seguro
}

export class SecurityAuditor {
  private userId: string;
  private anomalies: AnomalyReport[] = [];

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Ejecuta una auditoría completa de seguridad para el usuario actual
   */
  async runFullAudit(): Promise<SecurityAuditResult> {
    this.anomalies = [];

    await Promise.all([
      this.checkDataIntegrity(),
      this.checkLocalStorageIntegrity(),
      this.checkTransactionAnomalies(),
      this.checkGoalAnomalies(),
      this.checkNetWorthConsistency(),
      this.detectDataLeakage(),
    ]);

    const score = this.calculateSecurityScore();
    const isValid = score >= 70; // Umbral de validación

    // Si hay anomalías críticas, reportar al servidor
    const criticalAnomalies = this.anomalies.filter(a => a.type === 'critical');
    if (criticalAnomalies.length > 0) {
      await this.reportCriticalAnomalies(criticalAnomalies);
    }

    return {
      isValid,
      anomalies: this.anomalies,
      score,
    };
  }

  /**
   * Verifica la integridad de los datos del usuario
   */
  private async checkDataIntegrity() {
    try {
      // Verificar que todas las transacciones pertenecen al usuario actual
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, user_id')
        .neq('user_id', this.userId)
        .limit(1);

      if (error) throw error;

      if (transactions && transactions.length > 0) {
        this.addAnomaly('critical', 'data_integrity',
          'Se detectaron transacciones de otros usuarios en el contexto actual',
          { count: transactions.length }
        );
      }

      // Verificar metas
      const { data: goals } = await supabase
        .from('goals')
        .select('id, user_id')
        .neq('user_id', this.userId)
        .limit(1);

      if (goals && goals.length > 0) {
        this.addAnomaly('critical', 'data_integrity',
          'Se detectaron metas de otros usuarios en el contexto actual',
          { count: goals.length }
        );
      }

      // Verificar activos
      const { data: assets } = await supabase
        .from('assets')
        .select('id, user_id')
        .neq('user_id', this.userId)
        .limit(1);

      if (assets && assets.length > 0) {
        this.addAnomaly('critical', 'data_integrity',
          'Se detectaron activos de otros usuarios en el contexto actual',
          { count: assets.length }
        );
      }
    } catch (error) {
      this.addAnomaly('error', 'data_integrity',
        'Error al verificar integridad de datos',
        { error: error.message }
      );
    }
  }

  /**
   * Verifica que localStorage no contenga datos de otros usuarios
   */
  private async checkLocalStorageIntegrity() {
    const problematicKeys: string[] = [];

    // Claves que deberían tener user_id pero no lo tienen
    const keysToCheck = [
      'balance_ingresos',
      'balance_gastos',
      'balance_totalIngresos',
      'balance_totalGastos',
      'balance_proyecciones',
      'financialAnalysis_evolutionData',
      'financialAnalysis_historicalAverages',
      'last_notified_score',
    ];

    keysToCheck.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        problematicKeys.push(key);
      }
    });

    if (problematicKeys.length > 0) {
      this.addAnomaly('warning', 'localStorage',
        'Datos en localStorage sin user_id específico detectados',
        { keys: problematicKeys }
      );
    }

    // Verificar que no existan datos de otros usuarios
    Object.keys(localStorage).forEach(key => {
      if ((key.includes('cachedSubscriptions_') || key.includes('subscriptionsLastUpdate_'))
        && !key.includes(this.userId)) {
        problematicKeys.push(key);
      }
    });

    if (problematicKeys.length > 0) {
      this.addAnomaly('error', 'localStorage',
        'Datos de otros usuarios encontrados en localStorage',
        { keys: problematicKeys }
      );
    }
  }

  /**
   * Detecta anomalías en transacciones (valores extremos, patrones sospechosos)
   */
  private async checkTransactionAnomalies() {
    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, amount, transaction_date, description, user_id')
        .eq('user_id', this.userId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (!transactions) return;

      // Detectar transacciones con montos extremadamente altos
      const avgAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length;
      const extremeTransactions = transactions.filter(t =>
        Number(t.amount) > avgAmount * 10 // 10x el promedio
      );

      if (extremeTransactions.length > 0) {
        this.addAnomaly('warning', 'transactions',
          'Transacciones con montos extremadamente altos detectadas',
          { count: extremeTransactions.length, avg: avgAmount }
        );
      }

      // Detectar transacciones duplicadas sospechosas
      const duplicates = this.findDuplicateTransactions(transactions);
      if (duplicates.length > 0) {
        this.addAnomaly('warning', 'transactions',
          'Posibles transacciones duplicadas detectadas',
          { count: duplicates.length }
        );
      }
    } catch (error) {
      this.addAnomaly('error', 'transactions',
        'Error al verificar anomalías en transacciones',
        { error: error.message }
      );
    }
  }

  /**
   * Verifica consistencia en metas
   */
  private async checkGoalAnomalies() {
    try {
      const { data: goals } = await supabase
        .from('goals')
        .select('id, current, target, user_id')
        .eq('user_id', this.userId);

      if (!goals) return;

      // Detectar metas con current > target (completadas pero no marcadas)
      const overflowGoals = goals.filter(g => Number(g.current) > Number(g.target));
      if (overflowGoals.length > 0) {
        this.addAnomaly('warning', 'goals',
          'Metas con monto actual superior al objetivo detectadas',
          { count: overflowGoals.length }
        );
      }

      // Detectar metas con valores negativos
      const negativeGoals = goals.filter(g =>
        Number(g.current) < 0 || Number(g.target) < 0
      );
      if (negativeGoals.length > 0) {
        this.addAnomaly('error', 'goals',
          'Metas con valores negativos detectadas',
          { count: negativeGoals.length }
        );
      }
    } catch (error) {
      this.addAnomaly('error', 'goals',
        'Error al verificar anomalías en metas',
        { error: error.message }
      );
    }
  }

  /**
   * Verifica consistencia en patrimonio neto
   */
  private async checkNetWorthConsistency() {
    try {
      const [{ data: assets }, { data: liabilities }] = await Promise.all([
        supabase.from('assets').select('value, user_id').eq('user_id', this.userId),
        supabase.from('liabilities').select('value, user_id').eq('user_id', this.userId),
      ]);

      const totalAssets = assets?.reduce((sum, a) => sum + Number(a.value), 0) || 0;
      const totalLiabilities = liabilities?.reduce((sum, l) => sum + Number(l.value), 0) || 0;
      const netWorth = totalAssets - totalLiabilities;

      // Detectar patrimonio neto extremadamente negativo
      if (netWorth < -1000000) {
        this.addAnomaly('warning', 'net_worth',
          'Patrimonio neto extremadamente negativo detectado',
          { netWorth, assets: totalAssets, liabilities: totalLiabilities }
        );
      }

      // Detectar valores negativos en activos (error de datos)
      const negativeAssets = assets?.filter(a => Number(a.value) < 0) || [];
      if (negativeAssets.length > 0) {
        this.addAnomaly('error', 'net_worth',
          'Activos con valores negativos detectados',
          { count: negativeAssets.length }
        );
      }
    } catch (error) {
      this.addAnomaly('error', 'net_worth',
        'Error al verificar consistencia de patrimonio',
        { error: error.message }
      );
    }
  }

  /**
   * Detecta posibles fugas de datos entre usuarios
   */
  private async detectDataLeakage() {
    try {
      // Verificar que el perfil del usuario corresponde al auth.uid()
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.id !== this.userId) {
        this.addAnomaly('critical', 'data_leakage',
          'Mismatch entre usuario autenticado y user_id',
          { authUserId: user?.id, contextUserId: this.userId }
        );
      }

      // Verificar que no hay datos compartidos accidentalmente
      const { count: sharedTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .neq('user_id', this.userId);

      if (sharedTransactions && sharedTransactions > 0) {
        this.addAnomaly('critical', 'data_leakage',
          'Acceso a transacciones de otros usuarios detectado',
          { count: sharedTransactions }
        );
      }
    } catch (error) {
      this.addAnomaly('error', 'data_leakage',
        'Error al detectar fugas de datos',
        { error: error.message }
      );
    }
  }

  /**
   * Busca transacciones duplicadas sospechosas
   */
  private findDuplicateTransactions(transactions: any[]): any[] {
    const seen = new Map<string, number>();
    const duplicates: any[] = [];

    transactions.forEach(t => {
      const key = `${t.amount}_${t.transaction_date}_${t.description}`;
      const count = seen.get(key) || 0;
      seen.set(key, count + 1);

      if (count > 0) {
        duplicates.push(t);
      }
    });

    return duplicates;
  }

  /**
   * Agrega una anomalía al reporte
   */
  private addAnomaly(
    type: 'warning' | 'error' | 'critical',
    category: string,
    message: string,
    details?: any
  ) {
    this.anomalies.push({
      type,
      category,
      message,
      details,
      timestamp: new Date(),
    });
  }

  /**
   * Calcula un score de seguridad basado en las anomalías encontradas
   */
  private calculateSecurityScore(): number {
    let score = 100;

    this.anomalies.forEach(anomaly => {
      switch (anomaly.type) {
        case 'critical':
          score -= 30;
          break;
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Reporta anomalías críticas al servidor para análisis
   */
  private async reportCriticalAnomalies(anomalies: AnomalyReport[]) {
    try {
      // Registrar en el log de auditoría
      await supabase.from('security_audit_log').insert({
        user_id: this.userId,
        action: 'critical_anomaly_detected',
        metadata: {
          anomalies: anomalies.map(a => ({
            type: a.type,
            category: a.category,
            message: a.message,
          })),
          timestamp: new Date().toISOString(),
        },
        status: 'warning',
      });
    } catch (error) {
      console.error('Error al reportar anomalías críticas:', error);
    }
  }

  /**
   * Limpia localStorage de datos problemáticos
   */
  static cleanProblematicLocalStorage(userId: string) {
    // Claves que deberían tener user_id
    const keysToRemove = [
      'balance_ingresos',
      'balance_gastos',
      'balance_totalIngresos',
      'balance_totalGastos',
      'balance_proyecciones',
      'financialAnalysis_evolutionData',
      'financialAnalysis_historicalAverages',
      'financialAnalysis_recentTransactions',
      'financialAnalysis_yearOverYearData',
      'financialAnalysis_seasonalData',
      'financialAnalysis_categoryHeatmapData',
      'financialAnalysis_burnRateData',
      'financialAnalysis_netWorthEvolutionData',
      'financialAnalysis_weeklySpendingData',
      'financialAnalysis_expensePatterns',
      'financialAnalysis_categoryBreakdownData',
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Remover datos de otros usuarios
    Object.keys(localStorage).forEach(key => {
      if ((key.includes('cachedSubscriptions_') || key.includes('subscriptionsLastUpdate_'))
        && !key.includes(userId)) {
        localStorage.removeItem(key);
      }
    });

    console.log('[SecurityAudit] localStorage limpiado de datos problemáticos');
  }
}

/**
 * Hook rápido para ejecutar auditoría de seguridad
 */
export async function runSecurityAudit(userId: string): Promise<SecurityAuditResult> {
  const auditor = new SecurityAuditor(userId);
  return await auditor.runFullAudit();
}

/**
 * Limpia todos los datos problemáticos al iniciar sesión
 */
export function cleanUserDataOnLogin(userId: string) {
  SecurityAuditor.cleanProblematicLocalStorage(userId);
  // Also clear the new caching system to ensure fresh data
  invalidateAllCache();
}
