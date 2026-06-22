import { useEffect, useRef, useState } from 'react';

/**
 * Tracks an element's measured size and reports when it's ready to render
 * (non-zero width/height). Use to defer mounting Recharts' ResponsiveContainer,
 * which otherwise logs a harmless "-1 width/height" warning on its first
 * render frame before its internal ResizeObserver fires.
 */
export function useElementSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      setSize({ width: element.offsetWidth || 0, height: element.offsetHeight || 0 });
    };

    measure();

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    resizeObserver?.observe(element);
    window.addEventListener('resize', measure);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return {
    ref,
    width: size.width,
    height: size.height,
    isReady: size.width > 0 && size.height > 0,
  };
}
