import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Badge {
  level: number;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  explanation: string;
  growthPercentage: number;
}

interface BadgeCarouselProps {
  items: React.ReactElement<{
    badge: Badge;
    index: number;
    onCardClose: () => void;
  }>[];
  initialScroll?: number;
}

const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  onOutsideClick: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      onOutsideClick();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
};

export const BadgeCarousel = ({ items, initialScroll = 0 }: BadgeCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  return (
    <div className="relative w-full">
      <div
        className="flex w-full overflow-x-scroll overscroll-x-contain scroll-smooth [scrollbar-width:none] [-webkit-overflow-scrolling:touch] py-4 gap-3 px-2"
        ref={carouselRef}
        onScroll={checkScrollability}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.5,
                delay: 0.05 * index,
                ease: "easeOut",
              },
            }}
            key={`badge-${index}`}
            style={{ scrollSnapAlign: 'start' }}
            className="flex-shrink-0"
          >
            {item}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const BadgeCard = ({
  badge,
  index,
  onCardClose = () => {},
}: {
  badge: Badge;
  index: number;
  onCardClose?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const IconComponent = badge.icon;

  const handleExpand = () => setIsExpanded(true);
  
  const handleCollapse = () => {
    setIsExpanded(false);
    onCardClose();
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCollapse();
      }
    };

    if (isExpanded) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY, behavior: "instant" });
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isExpanded]);

  useOutsideClick(containerRef, handleCollapse);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 h-screen overflow-hidden z-[9999]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black/60 backdrop-blur-md h-full w-full fixed inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              ref={containerRef}
              className="max-w-md mx-auto bg-white/95 backdrop-blur-sm h-auto z-[10000] p-4 rounded-[12px] relative top-10 shadow-xl border-0"
            >
              <button
                className="absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-500 to-orange-500 hover:scale-110 transition-all shadow-lg"
                onClick={handleCollapse}
              >
                <X className="h-4 w-4 text-white" />
              </button>
              
              <div className="flex flex-col items-center pt-2">
                <div className={`bg-gradient-to-br ${badge.color} p-3 rounded-full mb-3 shadow-lg`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-1 text-center">
                  {badge.name}
                </h2>
                
                <p className="text-xs text-muted-foreground font-medium mb-4">
                  Nivel {badge.level}
                </p>
                
                <div className="bg-background/80 backdrop-blur-sm rounded-[10px] p-4 mb-4 shadow-md border border-border w-full">
                  <p className="text-sm text-foreground leading-relaxed text-center mb-3">
                    {badge.explanation}
                  </p>
                  
                  <div className={`bg-gradient-to-br ${badge.color} px-3 py-2 rounded-[8px] shadow-md`}>
                    <p className="text-xs text-white font-bold text-center drop-shadow-md">
                      🎯 {badge.growthPercentage}% patrimonio deseado
                    </p>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-xs text-center italic px-2">
                  {badge.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleExpand}
        className={`bg-gradient-to-br ${badge.color} rounded-[10px] p-2 flex flex-col items-center gap-1 shadow-lg relative overflow-hidden cursor-pointer transition-all min-w-[100px]`}
      >
        {/* Efecto de brillo de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        
        <div className="bg-white/30 p-1.5 rounded-full backdrop-blur-sm relative z-10 shadow-md">
          <IconComponent className="h-4 w-4 text-white" />
        </div>
        
        <div className="text-center relative z-10">
          <p className="text-[9px] font-bold text-white leading-tight mb-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {badge.name}
          </p>
          <p className="text-[7px] text-white/90 leading-tight drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)]">
            {badge.description}
          </p>
        </div>
        
        <div className="bg-white/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm relative z-10">
          <p className="text-[7px] text-white font-semibold drop-shadow-md">
            ✓ DESBLOQUEADO
          </p>
        </div>
      </motion.div>
    </>
  );
};
