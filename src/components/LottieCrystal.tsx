import { useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import lottieData from '../imports/animated-shape-effect.json';

/**
 * Lottie crystal ball with iOS SVG filter fix.
 * lottie-web generates SVG filters with small filter regions.
 * iOS clips blur strictly to that region, so we expand it post-render.
 */
export function LottieCrystal({ size = 160 }: { size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const fixFilters = () => {
      const svg = el.querySelector('svg');
      if (!svg) return;
      svg.style.overflow = 'visible';
      svg.querySelectorAll('filter').forEach((f) => {
        f.setAttribute('x', '-100%');
        f.setAttribute('y', '-100%');
        f.setAttribute('width', '400%');
        f.setAttribute('height', '400%');
      });
    };

    // Run after Lottie renders the SVG
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(fixFilters);
    });
    // Also run on a small delay as fallback
    const timer = setTimeout(fixFilters, 200);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size, flexShrink: 0, transform: 'translateZ(0)' }}
    >
      <Lottie
        animationData={lottieData}
        loop
        autoplay
        renderer="svg"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      />
    </div>
  );
}
