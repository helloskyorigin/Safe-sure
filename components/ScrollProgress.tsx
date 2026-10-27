"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className="reading-progress"
      style={{ scaleX: reduceMotion ? scrollYProgress : smoothProgress }}
    />
  );
}
