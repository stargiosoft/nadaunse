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
        if (f.getAttribute('x') !== '-100%') {
          f.setAttribute('x', '-100%');
          f.setAttribute('y', '-100%');
          f.setAttribute('width', '400%');
          f.setAttribute('height', '400%');
        }
      });
    };

    // Run after Lottie renders the SVG
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(fixFilters);
    });
    const timer = setTimeout(fixFilters, 200);

    // MutationObserver: Lottie re-renders SVG DOM on each frame,
    // which can reset filter regions. Watch and re-apply the fix.
    const observer = new MutationObserver(fixFilters);
    const startObserving = () => {
      const svg = el.querySelector('svg');
      if (svg) {
        observer.observe(svg, { childList: true, subtree: true, attributes: true, attributeFilter: ['x', 'y', 'width', 'height'] });
      }
    };
    startObserving();
    const observerTimer = setTimeout(startObserving, 300);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearTimeout(observerTimer);
      observer.disconnect();
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
