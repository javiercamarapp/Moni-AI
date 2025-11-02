import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  gradientColors?: string;
  gradientAnimationDuration?: number;
  hoverEffect?: boolean;
  className?: string;
  textClassName?: string;
  loop?: boolean;
  loopDelay?: number;
}

const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
  (
    {
      text,
      gradientColors = "linear-gradient(90deg, #000, #fff, #000)",
      gradientAnimationDuration = 1,
      hoverEffect = false,
      className,
      textClassName,
      loop = false,
      loopDelay = 3000,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [key, setKey] = React.useState(0);

    React.useEffect(() => {
      if (!loop) return;

      const interval = setInterval(() => {
        setKey(prev => prev + 1);
      }, loopDelay);

      return () => clearInterval(interval);
    }, [loop, loopDelay]);

    const textVariants: Variants = {
      initial: {
        backgroundPosition: "0 0",
        opacity: 0,
      },
      animate: {
        backgroundPosition: "100% 0",
        opacity: 1,
        transition: {
          backgroundPosition: {
            duration: gradientAnimationDuration,
            repeat: Infinity,
            repeatType: "reverse" as const,
          },
          opacity: {
            duration: 0.3,
          }
        },
      },
    };

    return (
      <div
        ref={ref}
        className={cn("flex justify-center items-center py-8", className)}
        {...props}
      >
        <motion.h1
          key={key}
          className={cn("text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[5rem] xl:text-[6rem] leading-normal font-bold", textClassName)}
          style={{
            background: gradientColors,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: isHovered ? "0 0 8px rgba(255,255,255,0.3)" : "none",
          }}
          variants={textVariants}
          initial="initial"
          animate="animate"
          onHoverStart={() => hoverEffect && setIsHovered(true)}
          onHoverEnd={() => hoverEffect && setIsHovered(false)}
        >
          {text}
        </motion.h1>
      </div>
    );
  }
);

AnimatedText.displayName = "AnimatedText";

export { AnimatedText };
