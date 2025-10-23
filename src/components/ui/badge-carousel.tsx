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

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const isMobile = window && window.innerWidth < 768;
      const cardWidth = isMobile ? 150 : 200;
      const gap = isMobile ? 8 : 16;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
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
        className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth [scrollbar-width:none] py-4"
        ref={carouselRef}
        onScroll={checkScrollability}
      >
        <div className={cn("flex flex-row justify-start gap-4 pl-2")}>
          {items.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.5,
                  delay: 0.1 * index,
                  ease: "easeOut",
                },
              }}
              key={`badge-${index}`}
              className="last:pr-4"
            >
              {React.cloneElement(item, {
                onCardClose: () => handleCardClose(index),
              })}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          className="relative z-40 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all duration-200 shadow-lg"
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
        <button
          className="relative z-40 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all duration-200 shadow-lg"
          onClick={handleScrollRight}
          disabled={!canScrollRight}
        >
          <ArrowRight className="h-4 w-4 text-white" />
        </button>
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
              className="max-w-2xl mx-auto bg-gradient-to-br from-white via-purple-50 to-blue-50 h-auto z-[10000] p-6 md:p-10 rounded-3xl relative mt-20 shadow-2xl border-2 border-purple-200"
            >
              <button
                className="absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 hover:scale-110 transition-transform shadow-lg"
                onClick={handleCollapse}
              >
                <X className="h-5 w-5 text-white" />
              </button>
              
              <div className="flex flex-col items-center">
                <div className={`${badge.color} p-4 rounded-full mb-4 shadow-lg`}>
                  <IconComponent className="h-12 w-12 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                  {badge.name}
                </h2>
                
                <p className="text-sm text-purple-600 font-medium mb-6">
                  Nivel {badge.level}
                </p>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-purple-100">
                  <p className="text-gray-700 leading-relaxed text-center mb-4">
                    {badge.explanation}
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-3 rounded-xl border-2 border-purple-200">
                    <p className="text-sm text-gray-900 font-bold text-center">
                      🎯 {badge.growthPercentage}% patrimonio deseado
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm text-center italic">
                  {badge.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <motion.button
        onClick={handleExpand}
        className="relative"
        whileHover={{
          scale: 1.05,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.95 }}
      >
        <div className={`${badge.color} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 w-36 h-36 flex flex-col items-center justify-center gap-2`}>
          <IconComponent className="h-10 w-10 text-white" />
          <p className="text-white text-xs font-bold text-center leading-tight">
            {badge.name}
          </p>
          <p className="text-white/90 text-[10px] text-center">
            Nivel {badge.level}
          </p>
        </div>
      </motion.button>
    </>
  );
};
