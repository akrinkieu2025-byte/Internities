"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, useReducedMotion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.65, ease } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.94 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.65, ease } },
  },
  lineDraw: {
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: 1, opacity: 1, transition: { duration: 0.8, ease } },
  },
};

export default function Reveal({
  as = 'div',
  variant = 'fadeUp',
  delay = 0,
  children,
  className,
  style,
  ...rest
}) {
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.28, margin: '-10% 0px' });

  useEffect(() => {
    if (prefersReducedMotion) {
      controls.set('show');
      return;
    }
    if (inView) controls.start('show');
    else controls.start('hidden');
  }, [controls, inView, prefersReducedMotion]);

  const Comp = motion[as] || motion.div;
  const selected = variants[variant] || variants.fadeUp;

  return (
    <Comp
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={selected}
      transition={{ delay, duration: selected.show?.transition?.duration || 0.7, ease }}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </Comp>
  );
}
