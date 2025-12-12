// Standard categories for the app
// These are the 6 core expense categories used consistently across the app

import {
  Home,
  ShoppingCart,
  Car,
  Heart,
  Gamepad2,
  Utensils,
  Briefcase,
  TrendingUp,
  Gift,
  Banknote,
  Building2,
  Zap,
  type LucideIcon
} from 'lucide-react';

export interface StandardCategory {
  id: string;
  name: string;
  icon: string;
  IconComponent: LucideIcon;
}

// 6 standard expense categories - short names only
export const STANDARD_EXPENSE_CATEGORIES: StandardCategory[] = [
  { id: 'std_vivienda', name: 'Vivienda', icon: 'Home', IconComponent: Home },
  { id: 'std_comida', name: 'Comida', icon: 'Utensils', IconComponent: Utensils },
  { id: 'std_transporte', name: 'Transporte', icon: 'Car', IconComponent: Car },
  { id: 'std_servicios', name: 'Servicios', icon: 'Zap', IconComponent: Zap },
  { id: 'std_salud', name: 'Salud', icon: 'Heart', IconComponent: Heart },
  { id: 'std_ocio', name: 'Ocio', icon: 'Gamepad2', IconComponent: Gamepad2 },
];

// 6 standard income categories - short names only
export const STANDARD_INCOME_CATEGORIES: StandardCategory[] = [
  { id: 'std_salario', name: 'Salario', icon: 'Briefcase', IconComponent: Briefcase },
  { id: 'std_inversiones', name: 'Inversiones', icon: 'TrendingUp', IconComponent: TrendingUp },
  { id: 'std_freelance', name: 'Freelance', icon: 'Banknote', IconComponent: Banknote },
  { id: 'std_rentas', name: 'Rentas', icon: 'Building2', IconComponent: Building2 },
  { id: 'std_regalo', name: 'Regalo', icon: 'Gift', IconComponent: Gift },
  { id: 'std_otros', name: 'Otros', icon: 'Banknote', IconComponent: Banknote },
];

// Icon mapping for dynamic rendering
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Home,
  ShoppingCart,
  Car,
  Utensils,
  Heart,
  Gamepad2,
  Briefcase,
  TrendingUp,
  Gift,
  Banknote,
  Building2,
  Zap,
};

// Map any category name to one of the 6 standard categories
export function normalizeCategory(name: string): string {
  const lower = name.toLowerCase();
  
  // Vivienda
  if (lower.includes('vivienda') || lower.includes('renta') || lower.includes('hipoteca') || lower.includes('casa') || lower.includes('luz') || lower.includes('agua') || lower.includes('gas')) {
    return 'Vivienda';
  }
  
  // Comida
  if (lower.includes('comida') || lower.includes('alimenta') || lower.includes('super') || lower.includes('restaur') || lower.includes('mercado')) {
    return 'Comida';
  }
  
  // Transporte
  if (lower.includes('transport') || lower.includes('uber') || lower.includes('gasolina') || lower.includes('auto') || lower.includes('carro')) {
    return 'Transporte';
  }
  
  // Servicios
  if (lower.includes('servicio') || lower.includes('internet') || lower.includes('teléfono') || lower.includes('netflix') || lower.includes('spotify') || lower.includes('suscripc')) {
    return 'Servicios';
  }
  
  // Salud
  if (lower.includes('salud') || lower.includes('médico') || lower.includes('farmacia') || lower.includes('gym') || lower.includes('gimnasio') || lower.includes('bienestar')) {
    return 'Salud';
  }
  
  // Ocio (entertainment, shopping, etc)
  if (lower.includes('entreten') || lower.includes('ocio') || lower.includes('cine') || lower.includes('fiesta') || lower.includes('bar') || lower.includes('ropa') || lower.includes('compra') || lower.includes('educación') || lower.includes('curso')) {
    return 'Ocio';
  }
  
  // Default: return first word cleaned
  const cleanName = name.replace(/^[^\w\sáéíóúñ]+\s*/i, '').trim();
  const firstWord = cleanName.split(' ')[0];
  return firstWord.length > 10 ? firstWord.substring(0, 10) : firstWord;
}

// Get icon for a category name
export function getCategoryIconName(name: string): string {
  const normalized = normalizeCategory(name);
  switch (normalized) {
    case 'Vivienda': return 'Home';
    case 'Comida': return 'Utensils';
    case 'Transporte': return 'Car';
    case 'Servicios': return 'Zap';
    case 'Salud': return 'Heart';
    case 'Ocio': return 'Gamepad2';
    default: return 'ShoppingCart';
  }
}

export function getStandardCategories(type: 'expense' | 'income'): StandardCategory[] {
  return type === 'expense' ? STANDARD_EXPENSE_CATEGORIES : STANDARD_INCOME_CATEGORIES;
}
