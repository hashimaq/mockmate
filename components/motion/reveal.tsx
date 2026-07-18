"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { EASE_OUT_EXPO, VIEWPORT_ONCE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  x?: number;
  once?: boolean;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  x = 0,
  once = true,
  ...props
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={prefersReducedMotion ? false : { opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={once ? VIEWPORT_ONCE : { once: false, margin: "-80px" }}
      transition={{
        duration: 0.55,
        delay: prefersReducedMotion ? 0 : delay,
        ease: EASE_OUT_EXPO,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
