import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface SlideWrapperProps {
  children: React.ReactNode;
  id: string;
  className?: string;
  innerClassName?: string;
}

export const SlideWrapper = ({ children, id, className, innerClassName }: SlideWrapperProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 0.3, once: false });

  return (
    <section id={id} ref={ref} className={cn("slide", className)}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn("slide-inner", innerClassName)}
      >
        {children}
      </motion.div>
    </section>
  );
};
