import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

const quotes = [
  {
    text: "No ahorres lo que te queda después de gastar; gasta lo que te queda después de ahorrar.",
    author: "Warren Buffett"
  },
  {
    text: "El dinero es un gran sirviente pero un mal amo.",
    author: "Francis Bacon"
  },
  {
    text: "No es lo que ganas, sino lo que ahorras lo que te hace rico.",
    author: "Henry Ford"
  },
  {
    text: "La mejor inversión que puedes hacer es en ti mismo.",
    author: "Warren Buffett"
  },
  {
    text: "El precio es lo que pagas. El valor es lo que obtienes.",
    author: "Warren Buffett"
  },
  {
    text: "La libertad financiera está disponible para aquellos que la aprenden y trabajan por ella.",
    author: "Robert Kiyosaki"
  }
];

export default function FinancialQuotesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
        setIsAnimating(false);
      }, 500);
    }
  };

  const handlePrev = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
        setIsAnimating(false);
      }, 500);
    }
  };

  const handleDotClick = (index: number) => {
    if (!isAnimating && index !== currentIndex) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsAnimating(false);
      }, 500);
    }
  };

  return (
    <div className="relative">
      <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-xl border-blue-100 rounded-[20px] overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
        
        {/* Content */}
        <div className="relative min-h-[60px] flex flex-col justify-center">
          <div
            className={`transition-all duration-500 ${
              isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            }`}
          >
            <p className="text-xs font-bold text-foreground leading-relaxed mb-2 text-center italic">
              "{quotes[currentIndex].text}"
            </p>
            <p className="text-[10px] font-semibold text-primary text-center">
              – {quotes[currentIndex].author}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
