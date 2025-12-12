// Standard categories for quick record modal
// These are predefined categories that users see when no custom/recent categories exist

import {
  Home,
  ShoppingCart,
  Car,
  GraduationCap,
  Utensils,
  Heart,
  Gamepad2,
  Shirt,
  Briefcase,
  TrendingUp,
  Gift,
  Banknote,
  Building2,
  Coins,
  type LucideIcon
} from 'lucide-react';

export interface StandardCategory {
  id: string;
  name: string;
  icon: string;
  IconComponent: LucideIcon;
}

// 8 standard expense categories
export const STANDARD_EXPENSE_CATEGORIES: StandardCategory[] = [
  { id: 'std_vivienda', name: 'Vivienda', icon: 'Home', IconComponent: Home },
  { id: 'std_supermercado', name: 'Supermercado', icon: 'ShoppingCart', IconComponent: ShoppingCart },
  { id: 'std_transporte', name: 'Transporte', icon: 'Car', IconComponent: Car },
  { id: 'std_educacion', name: 'Educación', icon: 'GraduationCap', IconComponent: GraduationCap },
  { id: 'std_restaurantes', name: 'Restaurantes', icon: 'Utensils', IconComponent: Utensils },
  { id: 'std_salud', name: 'Salud', icon: 'Heart', IconComponent: Heart },
  { id: 'std_entretenimiento', name: 'Entretenimiento', icon: 'Gamepad2', IconComponent: Gamepad2 },
  { id: 'std_ropa', name: 'Ropa', icon: 'Shirt', IconComponent: Shirt },
];

// 8 standard income categories
export const STANDARD_INCOME_CATEGORIES: StandardCategory[] = [
  { id: 'std_salario', name: 'Salario', icon: 'Briefcase', IconComponent: Briefcase },
  { id: 'std_inversiones', name: 'Inversiones', icon: 'TrendingUp', IconComponent: TrendingUp },
  { id: 'std_regalo', name: 'Regalo', icon: 'Gift', IconComponent: Gift },
  { id: 'std_freelance', name: 'Freelance', icon: 'Banknote', IconComponent: Banknote },
  { id: 'std_rentas', name: 'Rentas', icon: 'Building2', IconComponent: Building2 },
  { id: 'std_bonos', name: 'Bonos', icon: 'Coins', IconComponent: Coins },
  { id: 'std_reembolso', name: 'Reembolso', icon: 'TrendingUp', IconComponent: TrendingUp },
  { id: 'std_otros', name: 'Otros', icon: 'Banknote', IconComponent: Banknote },
];

// Icon mapping for dynamic rendering
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Home,
  ShoppingCart,
  Car,
  GraduationCap,
  Utensils,
  Heart,
  Gamepad2,
  Shirt,
  Briefcase,
  TrendingUp,
  Gift,
  Banknote,
  Building2,
  Coins,
};

export function getStandardCategories(type: 'expense' | 'income'): StandardCategory[] {
  return type === 'expense' ? STANDARD_EXPENSE_CATEGORIES : STANDARD_INCOME_CATEGORIES;
}
