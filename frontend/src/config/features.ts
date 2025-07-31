/**
 * Feature flags for enabling/disabling experimental features
 */
export const features = {
  /**
   * Enable virtualized calendar grid for better performance with large datasets
   */
  virtualizedCalendar: true,
  
  /**
   * Enable performance monitoring in development
   */
  performanceMonitoring: process.env.NODE_ENV === 'development',
};