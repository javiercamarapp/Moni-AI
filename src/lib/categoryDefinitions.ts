// Definiciones de categorías y subcategorías para activos y pasivos

export const ASSET_CATEGORIES = {
  'Activos líquidos': [
    'Efectivo',
    'Caja chica',
    'Cuenta de ahorro',
    'Cuenta corriente',
    'Fondo de inversión líquido',
    'PayPal',
    'MercadoPago',
    'Wise',
    'Dólares',
    'Criptomonedas'
  ],
  'Activos fijos': [
    'Vivienda principal',
    'Casa de veraneo',
    'Terreno',
    'Auto',
    'Moto',
    'Embarcación',
    'Muebles',
    'Equipo de cómputo',
    'Arte',
    'Joyería'
  ],
  'Activos financieros': [
    'Acciones',
    'Bonos',
    'ETFs',
    'Cetes',
    'AFORE',
    'Crowdfunding',
    'REIT',
    'Inversión en negocio',
    'Contrato de renta',
    'Cripto staking'
  ],
  'Activos por cobrar': [
    'Préstamos a terceros',
    'Cuentas por cobrar',
    'Anticipos',
    'Reembolsos',
    'Dividendos pendientes'
  ],
  'Activos intangibles': [
    'Dominio web',
    'Software propio',
    'Licencias',
    'Derechos de autor',
    'Marca registrada',
    'NFT'
  ]
};

export const LIABILITY_CATEGORIES = {
  'Pasivos corrientes (corto plazo)': [
    'Tarjeta de crédito',
    'Crédito de nómina',
    'Préstamo personal',
    'Crédito automotriz corto',
    'Servicios por pagar',
    'Renta corriente',
    'Suscripciones',
    'Impuestos mensuales',
    'Compras a plazos',
    'Deudas familiares'
  ],
  'Pasivos no corrientes (largo plazo)': [
    'Hipoteca',
    'Crédito automotriz largo',
    'Crédito educativo',
    'Crédito Infonavit',
    'Préstamo bancario empresarial',
    'Leasing de equipo',
    'Préstamo con aval',
    'Crédito consolidado',
    'Deuda inversión',
    'Obligaciones fiscales'
  ],
  'Pasivos contingentes o legales': [
    'Multas',
    'Litigios',
    'Pensión alimenticia',
    'Avales',
    'Garantías',
    'Pagos diferidos',
    'Deuda con socios',
    'Anticipos de clientes',
    'Mantenimiento pendiente',
    'Contratos futuros'
  ]
};

export type AssetCategory = keyof typeof ASSET_CATEGORIES;
export type LiabilityCategory = keyof typeof LIABILITY_CATEGORIES;

export function getAssetCategoryIcon(category: AssetCategory): string {
  switch (category) {
    case 'Activos líquidos':
      return 'Wallet';
    case 'Activos fijos':
      return 'Home';
    case 'Activos financieros':
      return 'TrendingUp';
    case 'Activos por cobrar':
      return 'FileText';
    case 'Activos intangibles':
      return 'Sparkles';
    default:
      return 'Wallet';
  }
}

export function getLiabilityCategoryIcon(category: LiabilityCategory): string {
  switch (category) {
    case 'Pasivos corrientes (corto plazo)':
      return 'CreditCard';
    case 'Pasivos no corrientes (largo plazo)':
      return 'Home';
    case 'Pasivos contingentes o legales':
      return 'AlertTriangle';
    default:
      return 'CreditCard';
  }
}

export function getAssetCategoryColors(category: AssetCategory) {
  switch (category) {
    case 'Activos líquidos':
      return {
        iconBg: 'bg-blue-500/30',
        iconColor: 'text-blue-600',
        badge: 'border-blue-500/40 text-blue-600 bg-blue-50'
      };
    case 'Activos fijos':
      return {
        iconBg: 'bg-purple-500/30',
        iconColor: 'text-purple-600',
        badge: 'border-purple-500/40 text-purple-600 bg-purple-50'
      };
    case 'Activos financieros':
      return {
        iconBg: 'bg-green-500/30',
        iconColor: 'text-green-600',
        badge: 'border-green-500/40 text-green-600 bg-green-50'
      };
    case 'Activos por cobrar':
      return {
        iconBg: 'bg-orange-500/30',
        iconColor: 'text-orange-600',
        badge: 'border-orange-500/40 text-orange-600 bg-orange-50'
      };
    case 'Activos intangibles':
      return {
        iconBg: 'bg-pink-500/30',
        iconColor: 'text-pink-600',
        badge: 'border-pink-500/40 text-pink-600 bg-pink-50'
      };
    default:
      return {
        iconBg: 'bg-primary/30',
        iconColor: 'text-primary',
        badge: 'border-primary/40 text-primary bg-primary/5'
      };
  }
}

export function getLiabilityCategoryColors(category: LiabilityCategory) {
  switch (category) {
    case 'Pasivos corrientes (corto plazo)':
      return {
        iconBg: 'bg-orange-500/30',
        iconColor: 'text-orange-600',
        badge: 'border-orange-500/40 text-orange-600 bg-orange-50'
      };
    case 'Pasivos no corrientes (largo plazo)':
      return {
        iconBg: 'bg-purple-500/30',
        iconColor: 'text-purple-600',
        badge: 'border-purple-500/40 text-purple-600 bg-purple-50'
      };
    case 'Pasivos contingentes o legales':
      return {
        iconBg: 'bg-red-500/30',
        iconColor: 'text-red-600',
        badge: 'border-red-500/40 text-red-600 bg-red-50'
      };
    default:
      return {
        iconBg: 'bg-destructive/30',
        iconColor: 'text-destructive',
        badge: 'border-destructive/40 text-destructive bg-destructive/5'
      };
  }
}
