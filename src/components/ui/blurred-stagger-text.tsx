"use client" 

import * as React from "react"
import { useEffect, useState } from "react"
import { motion } from "motion/react";
 
export const BlurredStagger = ({
  text = "we love hextaui.com ❤️",
  loop = false,
  loopDelay = 3000,
}: {
  text: string;
  loop?: boolean;
  loopDelay?: number;
}) => {
  const headingText = text;
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
        <motion.h1
          key={key}
          variants={container}
          initial="hidden"
          animate="show"
          className="text-base"
        >
          {headingText.split("").map((char, index) => (
            <motion.span
              key={index}
              variants={letterAnimation}
              transition={{ duration: 0.3 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.h1>
      </div>
    </>
  );
};
