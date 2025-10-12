"use client";

import React, {useEffect, useRef, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {ArrowLeft, ArrowRight, Quote, X} from "lucide-react";
import {cn} from "@/lib/utils";

// ===== Types and Interfaces =====
export interface ScoreComponent {
  title: string;
  value: number;
  maxValue: number;
  description: string;
}

interface CarouselProps {
  items: React.ReactElement<{
    component: ScoreComponent;
    index: number;
    layout?: boolean;
    onCardClose: () => void;
  }>[];
  initialScroll?: number;
}

// ===== Custom Hooks =====
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

// ===== Components =====
const RetroCarousel = ({items, initialScroll = 0}: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const {scrollLeft, scrollWidth, clientWidth} = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const handleScrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({left: -300, behavior: "smooth"});
    }
  };

  const handleScrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({left: 300, behavior: "smooth"});
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384;
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  };

  const isMobile = () => {
    return window && window.innerWidth < 768;
  };

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  return (
    <div className="relative w-full mt-6">
      <div
        className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth [scrollbar-width:none] py-5"
        ref={carouselRef}
        onScroll={checkScrollability}
      >
        <div
          className={cn(
            "absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l",
          )}
        />
        <div
          className={cn(
            "flex flex-row justify-start gap-4 pl-3",
            "max-w-5xl mx-auto",
          )}
        >
          {items.map((item, index) => {
            return (
              <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.2 * index,
                    ease: "easeOut",
                  },
                }}
                key={`card-${index}`}
                className="last:pr-[5%] md:last:pr-[33%] rounded-3xl"
              >
                {React.cloneElement(item, {
                  onCardClose: () => {
                    return handleCardClose(index);
                  },
                })}
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          className="relative z-40 h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center disabled:opacity-50 hover:bg-purple-700 transition-colors duration-200"
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
        >
          <ArrowLeft className="h-6 w-6 text-white" />
        </button>
        <button
          className="relative z-40 h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center disabled:opacity-50 hover:bg-purple-700 transition-colors duration-200"
          onClick={handleScrollRight}
          disabled={!canScrollRight}
        >
          <ArrowRight className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
};

const ScoreCard = ({
  component,
  index,
  layout = false,
  onCardClose = () => {},
}: {
  component: ScoreComponent;
  index: number;
  layout?: boolean;
  onCardClose?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExpand = () => {
    return setIsExpanded(true);
  };
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
      window.scrollTo({top: scrollY, behavior: "instant"});
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      return window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isExpanded]);

  useOutsideClick(containerRef, handleCollapse);

  const percentage = Math.round((component.value / component.maxValue) * 100);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 h-screen overflow-hidden z-50">
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              className="bg-black/50 backdrop-blur-lg h-full w-full fixed inset-0"
            />
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              ref={containerRef}
              layoutId={layout ? `card-${component.title}` : undefined}
              className="max-w-5xl mx-auto bg-gradient-to-b from-white to-purple-50 h-full z-[60] p-4 md:p-10 rounded-3xl relative md:mt-10"
            >
              <button
                className="sticky top-4 h-8 w-8 right-0 ml-auto rounded-full flex items-center justify-center bg-purple-600"
                onClick={handleCollapse}
              >
                <X className="h-6 w-6 text-white absolute" />
              </button>
              <motion.p
                layoutId={layout ? `title-${component.title}` : undefined}
                className="px-0 md:px-20 text-2xl md:text-4xl font-bold text-purple-600 mt-4"
              >
                {component.title}
              </motion.p>
              <motion.p
                layoutId={layout ? `score-${component.title}` : undefined}
                className="px-0 md:px-20 text-5xl font-bold text-purple-700 mt-4"
              >
                {component.value}/{component.maxValue} pts
              </motion.p>
              <div className="py-8 text-foreground/80 px-0 md:px-20 text-lg leading-relaxed">
                <Quote className="h-6 w-6 text-purple-600 mb-4" />
                {component.description}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${component.title}` : undefined}
        onClick={handleExpand}
        className=""
        whileHover={{
          rotateX: 2,
          rotateY: 2,
          rotate: 3,
          scale: 1.02,
          transition: {duration: 0.3, ease: "easeOut"},
        }}
      >
        <div
          className={`${index % 2 === 0 ? "rotate-1" : "-rotate-1"} rounded-3xl bg-gradient-to-b from-white to-purple-50 h-[400px] md:h-[450px] w-72 md:w-80 overflow-hidden flex flex-col items-center justify-center relative z-10 shadow-xl border border-purple-100`}
        >
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-purple-500 to-blue-500" />
          
          <div className="relative z-10 flex flex-col items-center justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-purple-600">{percentage}%</span>
            </div>
            
            <motion.p
              layoutId={layout ? `title-${component.title}` : undefined}
              className="text-foreground text-xl md:text-2xl font-bold text-center mt-2"
            >
              {component.title}
            </motion.p>
            
            <motion.p
              layoutId={layout ? `score-${component.title}` : undefined}
              className="text-purple-600 text-2xl font-bold text-center mt-3"
            >
              {component.value}/{component.maxValue}
            </motion.p>
            
            <motion.p
              className="text-foreground/70 text-sm text-center mt-4 px-4 line-clamp-3"
            >
              {component.description.length > 80
                ? `${component.description.slice(0, 80)}...`
                : component.description}
            </motion.p>
          </div>
        </div>
      </motion.button>
    </>
  );
};

export {RetroCarousel, ScoreCard};
