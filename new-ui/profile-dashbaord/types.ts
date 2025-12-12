import React from 'react';

export enum UserTier {
  FREE = 'Standard',
  PREMIUM = 'Moni Prime',
  BLACK = 'Moni Black'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl: string;
  tier: UserTier;
  points: number;
}

export interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string; // Added to customize badge background/text color
  onClick?: () => void;
  isDestructive?: boolean;
  // Toggle properties
  isToggle?: boolean;
  isToggled?: boolean;
  onToggle?: (newValue: boolean) => void;
}