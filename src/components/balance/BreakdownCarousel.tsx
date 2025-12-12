import React, { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import BalanceCategoryBreakdown from './BalanceCategoryBreakdown';

interface CategoryBalance {
  id: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
}

interface BreakdownCarouselProps {
  ingresosByCategory: CategoryBalance[];
  gastosByCategory: CategoryBalance[];
}

const BreakdownCarousel: React.FC<BreakdownCarouselProps> = ({ 
  ingresosByCategory, 
  gastosByCategory 
}) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = (index: number) => {
    api?.scrollTo(index);
  };

  const hasIngresos = ingresosByCategory.length > 0;
  const hasGastos = gastosByCategory.length > 0;

  return (
    <div className="space-y-2">
      {/* Tab Indicators */}
      <div className="flex justify-center">
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
          {hasIngresos && (
            <button
              onClick={() => scrollTo(0)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                current === 0 
                  ? 'bg-[#8D6E63] text-white' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Ingresos
            </button>
          )}
          {hasGastos && (
            <button
              onClick={() => scrollTo(hasIngresos ? 1 : 0)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                current === (hasIngresos ? 1 : 0) 
                  ? 'bg-[#8D6E63] text-white' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Gastos
            </button>
          )}
        </div>
      </div>
      
      <Carousel className="w-full" setApi={setApi}>
        <CarouselContent>
          {hasIngresos && (
            <CarouselItem>
              <BalanceCategoryBreakdown
                title="Ingresos"
                data={ingresosByCategory.map(cat => ({
                  name: cat.name,
                  amount: cat.total,
                  color: cat.color,
                  percent: Math.round(cat.percentage)
                }))}
                type="income"
              />
            </CarouselItem>
          )}
          {hasGastos && (
            <CarouselItem>
              <BalanceCategoryBreakdown
                title="Gastos"
                data={gastosByCategory.map(cat => ({
                  name: cat.name,
                  amount: cat.total,
                  color: cat.color,
                  percent: Math.round(cat.percentage)
                }))}
                type="expense"
              />
            </CarouselItem>
          )}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default BreakdownCarousel;
