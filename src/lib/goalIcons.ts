import { Target, Home, Car, Plane, Heart, Shield, Briefcase, GraduationCap, Smartphone, Dumbbell, type LucideIcon } from 'lucide-react';

/**
 * Returns the appropriate Lucide icon component based on goal name/title
 * Used consistently across dashboard GoalsWidget and Goals page
 */
export const getGoalIcon = (name: string): LucideIcon => {
    if (!name) return Target;
    const lowerName = name.toLowerCase();
    
    // Home & Property
    if (lowerName.includes('casa') || lowerName.includes('hogar') || lowerName.includes('depa') || lowerName.includes('apartamento')) return Home;
    
    // Vehicles
    if (lowerName.includes('coche') || lowerName.includes('auto') || lowerName.includes('carro') || lowerName.includes('moto')) return Car;
    
    // Travel
    if (lowerName.includes('viaje') || lowerName.includes('vacaciones') || lowerName.includes('europa') || lowerName.includes('playa')) return Plane;
    
    // Love & Wedding
    if (lowerName.includes('boda') || lowerName.includes('anillo') || lowerName.includes('matrimonio')) return Heart;
    
    // Emergency & Insurance
    if (lowerName.includes('emergencia') || lowerName.includes('seguro') || lowerName.includes('fondo') || lowerName.includes('reserva')) return Shield;
    
    // Business
    if (lowerName.includes('negocio') || lowerName.includes('empresa') || lowerName.includes('startup') || lowerName.includes('emprender')) return Briefcase;
    
    // Education
    if (lowerName.includes('estudio') || lowerName.includes('universidad') || lowerName.includes('curso') || lowerName.includes('maestría') || lowerName.includes('educación')) return GraduationCap;
    
    // Tech
    if (lowerName.includes('laptop') || lowerName.includes('computadora') || lowerName.includes('iphone') || lowerName.includes('celular') || lowerName.includes('tech')) return Smartphone;
    
    // Fitness
    if (lowerName.includes('gym') || lowerName.includes('gimnasio') || lowerName.includes('fitness')) return Dumbbell;
    
    return Target;
};

/**
 * Returns emoji icon based on category (legacy support)
 */
export const getCategoryEmoji = (category: string): string => {
    switch (category?.toLowerCase()) {
        case 'travel':
        case 'viaje':
            return '✈️';
        case 'tech':
        case 'tecnología':
            return '💻';
        case 'education':
        case 'educación':
            return '🎓';
        case 'emergency fund':
        case 'emergencia':
            return '🛡️';
        case 'home':
        case 'hogar':
            return '🏠';
        case 'vehicle':
        case 'auto':
            return '🚗';
        default:
            return '🎯';
    }
};
