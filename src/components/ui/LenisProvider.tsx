'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { useStore } from '@/lib/store/useStore';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const setDepth = useStore((state) => state.setDepth);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', (e: any) => {
      setDepth(e.scroll);
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [setDepth]);

  return <>{children}</>;
}
