"use client" 

import * as React from "react"
import { useEffect, useState } from "react"
import { motion } from "motion/react";
 
export const BlurredStagger = ({
  text = "we love hextaui.com ❤️",
  loop = false,
  loopDelay = 3000,
  className = "text-base",
}: {
  text: string | string[];
  loop?: boolean;
  loopDelay?: number;
  className?: string;
}) => {
  const textLines = Array.isArray(text) ? text : [text];
  const [key, setKey] = useState(0);
 
  useEffect(() => {
    if (!loop) return;

    const interval = setInterval(() => {
      setKey(prev => prev + 1);
    }, loopDelay);

    return () => clearInterval(interval);
  }, [loop, loopDelay]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
      },
    },
  };
 
  const letterAnimation = {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
    },
    show: {
      opacity: 1,
      filter: "blur(0px)",
    },
  };
 
  return (
    <>
      <div>
        <motion.div
          key={key}
          variants={container}
          initial="hidden"
          animate="show"
          className={className}
        >
          {textLines.map((line, lineIndex) => (
            <div key={lineIndex}>
              {line.split("").map((char, index) => (
                <motion.span
                  key={`${lineIndex}-${index}`}
                  variants={letterAnimation}
                  transition={{ duration: 0.3 }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </>
  );
};
