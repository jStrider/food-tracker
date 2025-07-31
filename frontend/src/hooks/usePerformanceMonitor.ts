import { useEffect, useRef } from 'react';
import { features } from '@/config/features';

interface PerformanceMetrics {
  renderTime: number;
  renderCount: number;
  averageRenderTime: number;
}

/**
 * Hook to monitor component render performance
 * @param componentName - Name of the component being monitored
 * @returns Performance metrics
 */
export function usePerformanceMonitor(componentName: string): PerformanceMetrics {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);

  // Record render start time
  startTime.current = performance.now();

  useEffect(() => {
    if (!features.performanceMonitoring) return;

    // Calculate render time
    const renderTime = performance.now() - startTime.current;
    renderCount.current++;
    renderTimes.current.push(renderTime);

    // Keep only last 100 render times to avoid memory leak
    if (renderTimes.current.length > 100) {
      renderTimes.current = renderTimes.current.slice(-100);
    }

    // Calculate average render time
    const averageRenderTime = 
      renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length;

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: renderCount.current,
        averageRenderTime: `${averageRenderTime.toFixed(2)}ms`,
      });
    }
  });

  return {
    renderTime: startTime.current,
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((sum, time) => sum + time, 0) / renderTimes.current.length
      : 0,
  };
}