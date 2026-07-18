"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  duration?: number;
};

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 16,
  duration = 0.6,
  ...props
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={prefersReducedMotion ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASE_OUT_EXPO,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
